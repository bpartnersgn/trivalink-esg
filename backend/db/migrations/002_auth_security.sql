-- 002 · Authentification durcie : sessions hachées, MFA TOTP, journal de sécurité.
-- Backlog : TL-PROD-4 (MFA), TL-PROD-5 (sessions), docs-dev/07 §3 et §8.

ALTER TABLE organizations ADD COLUMN mfa_required boolean NOT NULL DEFAULT false;
GRANT UPDATE (mfa_required) ON organizations TO trivalink_app;

ALTER TABLE users
  ADD COLUMN mfa_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN mfa_secret_enc text,
  ADD COLUMN mfa_pending_secret_enc text,
  ADD COLUMN mfa_last_counter bigint,
  ADD COLUMN mfa_enrolled_at timestamptz,
  ADD COLUMN last_login_at timestamptz,
  ADD COLUMN password_changed_at timestamptz NOT NULL DEFAULT now(),
  ADD CONSTRAINT users_mfa_secret CHECK (NOT mfa_enabled OR mfa_secret_enc IS NOT NULL);

-- Sessions : seule l'empreinte SHA-256 du jeton est stockée.
-- stage : 'mfa' (mot de passe vérifié, code TOTP attendu), 'enroll' (MFA exigée mais pas encore
-- configurée : seules les routes d'enrôlement sont ouvertes), 'full'.
CREATE TABLE sessions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  user_id bigint NOT NULL REFERENCES users(id),
  token_hash char(64) NOT NULL UNIQUE,
  stage text NOT NULL CHECK (stage IN ('mfa','enroll','full')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ip inet,
  user_agent text
);
CREATE INDEX idx_sessions_user ON sessions (org_id, user_id);
CREATE INDEX idx_sessions_expiry ON sessions (expires_at);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sessions
  USING (org_id = app_current_org()) WITH CHECK (org_id = app_current_org());
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO trivalink_app;

-- Codes de secours MFA : empreintes SHA-256, usage unique.
CREATE TABLE mfa_recovery_codes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  user_id bigint NOT NULL REFERENCES users(id),
  code_hash char(64) NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mfa_codes_user ON mfa_recovery_codes (org_id, user_id);
ALTER TABLE mfa_recovery_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON mfa_recovery_codes
  USING (org_id = app_current_org()) WITH CHECK (org_id = app_current_org());
GRANT SELECT, INSERT, UPDATE, DELETE ON mfa_recovery_codes TO trivalink_app;

-- Journal de sécurité de la plateforme (hors chaîne client) : échecs de connexion,
-- verrouillages, codes MFA refusés. Le rôle applicatif ne peut qu'y ajouter des lignes.
CREATE TABLE security_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  email text,
  ip inet,
  user_id bigint,
  org_id bigint,
  details jsonb
);
CREATE INDEX idx_security_events_email ON security_events (type, email, at);
CREATE INDEX idx_security_events_ip ON security_events (type, ip, at);
GRANT INSERT ON security_events TO trivalink_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO trivalink_app;

-- Fonctions d'authentification. Elles s'exécutent avec les droits du propriétaire
-- (SECURITY DEFINER) car l'organisation n'est pas encore connue à ce stade : elles ne
-- renvoient que le strict nécessaire, et le reste de la requête passe sous RLS.

CREATE FUNCTION app_auth_user_by_email(p_email text)
RETURNS TABLE (id bigint, org_id bigint, name text, password_hash text, role text,
               active boolean, access_expires_at date, mfa_enabled boolean, mfa_required boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, u.org_id, u.name, u.password_hash, u.role, u.active, u.access_expires_at,
         u.mfa_enabled, o.mfa_required
  FROM users u JOIN organizations o ON o.id = u.org_id
  WHERE u.email = lower(p_email)
$$;

-- Résout un jeton en utilisateur et prolonge la session (expiration glissante).
CREATE FUNCTION app_auth_session(p_token_hash text, p_idle_seconds integer)
RETURNS TABLE (session_id bigint, stage text, id bigint, org_id bigint, email text, name text,
               role text, scope_entity_id bigint, access_expires_at date, lang text,
               mfa_enabled boolean)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE sessions s SET last_seen_at = now()
  FROM users u
  WHERE s.token_hash = p_token_hash
    AND u.id = s.user_id
    AND s.expires_at > now()
    AND s.last_seen_at > now() - make_interval(secs => p_idle_seconds)
    AND u.active
    AND (u.access_expires_at IS NULL OR u.access_expires_at >= current_date)
  RETURNING s.id, s.stage, u.id, u.org_id, u.email, u.name, u.role, u.scope_entity_id,
            u.access_expires_at, u.lang, u.mfa_enabled
$$;

-- Nombre d'échecs de connexion récents, par compte et par adresse IP (anti force brute).
CREATE FUNCTION app_login_failures(p_email text, p_ip inet, p_window_seconds integer)
RETURNS TABLE (by_email bigint, by_ip bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM security_events
      WHERE type = 'login_failed' AND email = lower(p_email)
        AND at > now() - make_interval(secs => p_window_seconds)),
    (SELECT count(*) FROM security_events
      WHERE type = 'login_failed' AND p_ip IS NOT NULL AND ip = p_ip
        AND at > now() - make_interval(secs => p_window_seconds))
$$;

-- Purge des sessions expirées (tâche périodique de l'API).
CREATE FUNCTION app_purge_sessions(p_idle_seconds integer) RETURNS bigint
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH d AS (
    DELETE FROM sessions
    WHERE expires_at <= now() OR last_seen_at <= now() - make_interval(secs => p_idle_seconds)
    RETURNING 1
  )
  SELECT count(*) FROM d
$$;

REVOKE ALL ON FUNCTION app_auth_user_by_email(text), app_auth_session(text, integer),
  app_login_failures(text, inet, integer), app_purge_sessions(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_auth_user_by_email(text), app_auth_session(text, integer),
  app_login_failures(text, inet, integer), app_purge_sessions(integer) TO trivalink_app;
