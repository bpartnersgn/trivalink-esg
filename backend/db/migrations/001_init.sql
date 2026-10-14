-- 001 · Portage du schéma du MVP vers PostgreSQL 16
-- Source : MVP server/src/db.js et livrable 05 (dictionnaire des données, §3 et §9.2).
-- Une migration livrée est immuable : toute évolution passe par une nouvelle migration.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'trivalink_app') THEN
    RAISE EXCEPTION 'Rôle trivalink_app absent : exécuter db/init/00-roles.sql en superutilisateur';
  END IF;
END $$;

-- Organisation courante de la transaction, posée par l'API avec SET LOCAL app.org_id.
-- NULL si absente : aucune ligne n'est alors visible.
CREATE FUNCTION app_current_org() RETURNS bigint
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.org_id', true), '')::bigint
$$;

CREATE TABLE organizations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Hiérarchie groupe -> filiale -> site
CREATE TABLE entities (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  parent_id bigint REFERENCES entities(id),
  name text NOT NULL,
  code text NOT NULL,
  type text NOT NULL CHECK (type IN ('group','subsidiary','site')),
  country char(2),
  UNIQUE (org_id, code)
);

CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('org_admin','esg_manager','contributor','action_owner','executive','auditor')),
  scope_entity_id bigint REFERENCES entities(id),
  access_expires_at date,
  lang text NOT NULL DEFAULT 'fr' CHECK (lang IN ('fr','en')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (role <> 'auditor' OR access_expires_at IS NOT NULL)
);

-- Référentiel d'indicateurs (copié par organisation, ADR-012)
CREATE TABLE indicators (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  code text NOT NULL,
  domain char(1) NOT NULL CHECK (domain IN ('E','S','G')),
  category text NOT NULL,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  unit text NOT NULL,
  direction text NOT NULL DEFAULT 'lower' CHECK (direction IN ('lower','higher','neutral')),
  aggregation text NOT NULL DEFAULT 'sum' CHECK (aggregation IN ('sum','avg','max')),
  threshold_min numeric(20,6),
  threshold_max numeric(20,6),
  gri text,
  ifc text,
  evidence_required boolean NOT NULL DEFAULT true,
  level text NOT NULL DEFAULT 'site' CHECK (level IN ('site','group')),
  active boolean NOT NULL DEFAULT true,
  UNIQUE (org_id, code)
);

-- Strategy
CREATE TABLE commitments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  title text NOT NULL,
  description text,
  domain char(1) NOT NULL CHECK (domain IN ('E','S','G')),
  source text,
  owner_id bigint REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE objectives (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  commitment_id bigint NOT NULL REFERENCES commitments(id),
  indicator_id bigint NOT NULL REFERENCES indicators(id),
  entity_id bigint NOT NULL REFERENCES entities(id),
  title text NOT NULL,
  baseline_value numeric(20,6),
  baseline_period char(7) CHECK (baseline_period ~ '^\d{4}-Q[1-4]$'),
  target_value numeric(20,6) NOT NULL,
  target_period char(7) NOT NULL CHECK (target_period ~ '^\d{4}-Q[1-4]$')
);

-- Collecte
CREATE TABLE campaigns (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  period char(7) NOT NULL CHECK (period ~ '^\d{4}-Q[1-4]$'),
  deadline date NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_by bigint REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE datapoints (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  campaign_id bigint REFERENCES campaigns(id),
  indicator_id bigint NOT NULL REFERENCES indicators(id),
  entity_id bigint NOT NULL REFERENCES entities(id),
  period char(7) NOT NULL CHECK (period ~ '^\d{4}-Q[1-4]$'),
  value numeric(20,6),
  comment text,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','draft','submitted','reviewed','validated','rejected')),
  version integer NOT NULL DEFAULT 0,
  submitted_by bigint REFERENCES users(id),
  submitted_at timestamptz,
  reviewed_by bigint REFERENCES users(id),
  reviewed_at timestamptz,
  validated_by bigint REFERENCES users(id),
  validated_at timestamptz,
  rejection_reason text,
  breach boolean NOT NULL DEFAULT false,
  UNIQUE (org_id, indicator_id, entity_id, period)
);

-- Preuves : fichier chiffré hors base, empreinte SHA-256 du clair
CREATE TABLE evidence (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  object_type text NOT NULL CHECK (object_type IN ('datapoint','action','obligation','incident')),
  object_id bigint NOT NULL,
  filename text NOT NULL,
  mime text,
  size bigint NOT NULL,
  sha256 char(64) NOT NULL,
  storage_key text NOT NULL,
  uploaded_by bigint REFERENCES users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- Risk & Compliance
CREATE TABLE risks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  entity_id bigint NOT NULL REFERENCES entities(id),
  title text NOT NULL,
  category text NOT NULL,
  domain char(1) NOT NULL CHECK (domain IN ('E','S','G')),
  likelihood smallint NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  impact smallint NOT NULL CHECK (impact BETWEEN 1 AND 5),
  mitigation text,
  owner_id bigint REFERENCES users(id),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','mitigated','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE obligations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  entity_id bigint NOT NULL REFERENCES entities(id),
  source text NOT NULL,
  reference text,
  title text NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','compliant','non_compliant')),
  owner_id bigint REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE incidents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  entity_id bigint NOT NULL REFERENCES entities(id),
  type text NOT NULL CHECK (type IN ('incident','audit_finding','non_conformity','threshold_breach')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  title text NOT NULL,
  description text,
  occurred_at date NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  datapoint_id bigint REFERENCES datapoints(id),
  obligation_id bigint REFERENCES obligations(id),
  created_by bigint REFERENCES users(id),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE grievances (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  entity_id bigint NOT NULL REFERENCES entities(id),
  received_at date NOT NULL,
  channel text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','investigating','resolved','closed')),
  resolution text,
  resolved_at date
);

-- Social : programmes communautaires (montants en USD implicite, devise prévue en phase 1)
CREATE TABLE programs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  entity_id bigint NOT NULL REFERENCES entities(id),
  name text NOT NULL,
  budget numeric(14,2) NOT NULL DEFAULT 0,
  spent numeric(14,2) NOT NULL DEFAULT 0,
  beneficiaries_target integer NOT NULL DEFAULT 0,
  beneficiaries_actual integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('planned','active','completed'))
);

-- Governance
CREATE TABLE policies (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  title text NOT NULL,
  owner_id bigint REFERENCES users(id),
  approved_at date,
  review_due date
);

-- Actions : écart -> action -> résultat mesuré
CREATE TABLE actions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  entity_id bigint NOT NULL REFERENCES entities(id),
  title text NOT NULL,
  description text,
  source_type text CHECK (source_type IN ('incident','obligation','risk','objective')),
  source_id bigint,
  owner_id bigint REFERENCES users(id),
  due_date date NOT NULL,
  budget numeric(14,2) NOT NULL DEFAULT 0,
  spent numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','cancelled')),
  progress smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  result_indicator_id bigint REFERENCES indicators(id),
  baseline_value numeric(20,6),
  target_value numeric(20,6),
  result_value numeric(20,6),
  result_period char(7) CHECK (result_period ~ '^\d{4}-Q[1-4]$'),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Piste d'audit chaînée (ADR-004). Une chaîne par organisation ; écriture sérialisée
-- par pg_advisory_xact_lock dans l'application ; modification et suppression interdites.
CREATE TABLE audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id),
  at timestamptz NOT NULL,
  user_id bigint,
  user_name text,
  action text NOT NULL,
  object_type text NOT NULL,
  object_id bigint,
  details jsonb,
  prev_hash char(64) NOT NULL,
  hash char(64) NOT NULL UNIQUE
);
-- Deux lignes d'une même organisation ne peuvent pas pointer vers le même prédécesseur.
CREATE UNIQUE INDEX audit_log_chain ON audit_log (org_id, prev_hash);

CREATE FUNCTION audit_log_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only' USING ERRCODE = 'insufficient_privilege';
END $$;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_append_only();

-- Index (MVP + livrable 05 §8.3)
CREATE INDEX idx_entities_org ON entities (org_id, parent_id);
CREATE INDEX idx_users_org ON users (org_id);
CREATE INDEX idx_dp_org_period ON datapoints (org_id, period);
CREATE INDEX idx_dp_ind_status ON datapoints (org_id, indicator_id, status, period);
CREATE INDEX idx_evidence_obj ON evidence (org_id, object_type, object_id);
CREATE INDEX idx_actions_entity ON actions (org_id, entity_id);
CREATE INDEX idx_actions_source ON actions (org_id, source_type, source_id);
CREATE INDEX idx_incidents_entity ON incidents (org_id, entity_id, status);
CREATE INDEX idx_risks_entity ON risks (org_id, entity_id);
CREATE INDEX idx_obligations_entity ON obligations (org_id, entity_id);
CREATE INDEX idx_audit_org ON audit_log (org_id, id);
CREATE INDEX idx_audit_object ON audit_log (org_id, object_type, object_id);

-- Row-Level Security : défense en profondeur derrière le filtre applicatif org_id (ADR-017).
-- trivalink_app n'est pas propriétaire des tables : les politiques s'appliquent à lui.
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON organizations
  USING (id = app_current_org()) WITH CHECK (id = app_current_org());

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['entities','users','indicators','commitments','objectives','campaigns',
    'datapoints','evidence','risks','obligations','incidents','grievances','programs','policies',
    'actions','audit_log']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (org_id = app_current_org()) WITH CHECK (org_id = app_current_org())', t);
  END LOOP;
END $$;

-- Droits du rôle applicatif : pas de DELETE métier (règle d'immutabilité), journal en ajout seul.
GRANT USAGE ON SCHEMA public TO trivalink_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO trivalink_app;
REVOKE UPDATE ON organizations, audit_log FROM trivalink_app;
REVOKE INSERT ON organizations FROM trivalink_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO trivalink_app;
