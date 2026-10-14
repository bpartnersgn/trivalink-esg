// Authentification : connexion en une ou deux étapes (MFA TOTP), déconnexion, profil,
// changement de mot de passe, enrôlement et retrait de la MFA (TL-PROD-4, TL-PROD-5).
import { withTenant } from '../db/pool.js';
import { bad, unauthorized, tooMany } from '../core/errors.js';
import { tenantRoute, publicRoute } from '../core/http.js';
import { audit } from '../core/audit.js';
import { deriveKey, encryptText, decryptText, sha256 } from '../core/crypto.js';
import { verifyPassword, hashPassword, checkPasswordPolicy, DUMMY_HASH } from '../core/passwords.js';
import { createSession, resolveSession, revokeSession } from '../core/sessions.js';
import {
  generateSecret, verifyTotp, otpauthUri, generateRecoveryCodes, normalizeRecoveryCode,
} from '../core/totp.js';

const USER_COLUMNS = `id, org_id, email, name, role, scope_entity_id, access_expires_at, lang, active,
  mfa_enabled, last_login_at, created_at`;

export default function authModule(api, { config, pool, log }) {
  const mfaKey = deriveKey(config.storageKey, 'trivalink:mfa');
  const clientIp = (req) => req.ip || null;

  async function securityEvent(type, { email = null, ip = null, user = null, details = null }) {
    await pool.query(`INSERT INTO security_events (type, email, ip, user_id, org_id, details)
                      VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [type, email, ip, user?.id ?? null, user?.org_id ?? null, details == null ? null : JSON.stringify(details)]);
    log.warn('security_event', { type, email, ip, user_id: user?.id, org_id: user?.org_id });
  }

  async function assertNotLocked(email, ip) {
    const { rows: [f] } = await pool.query('SELECT * FROM app_login_failures($1, $2, $3)',
      [email, ip, config.login.windowSeconds]);
    if (f.by_email >= config.login.maxFailuresPerAccount || f.by_ip >= config.login.maxFailuresPerIp) {
      await securityEvent('login_locked', { email, ip, details: f });
      throw tooMany(`Trop de tentatives de connexion. Réessayez dans ${Math.round(config.login.windowSeconds / 60)} minutes.`);
    }
  }

  // --- Connexion, étape 1 : mot de passe ---
  api.post('/auth/login', publicRoute(async (req) => {
    const email = String(req.body?.email ?? '').toLowerCase().trim().slice(0, 320);
    const password = String(req.body?.password ?? '');
    const ip = clientIp(req);
    if (!email || !password) throw bad('Adresse e-mail et mot de passe obligatoires');
    await assertNotLocked(email, ip);

    const { rows: [u] } = await pool.query('SELECT * FROM app_auth_user_by_email($1)', [email]);
    // Vérification systématique, même pour un e-mail inconnu : temps de réponse identique.
    const ok = await verifyPassword(password, u?.password_hash ?? DUMMY_HASH);
    if (!u || !ok || !u.active) {
      await securityEvent('login_failed', { email, ip, user: u, details: { step: 'password' } });
      throw unauthorized('Identifiants incorrects');
    }
    if (u.access_expires_at && u.access_expires_at < new Date().toISOString().slice(0, 10)) {
      await securityEvent('login_expired', { email, ip, user: u });
      throw unauthorized('Votre accès a expiré', 'expired');
    }

    const stage = u.mfa_enabled ? 'mfa' : (u.mfa_required ? 'enroll' : 'full');
    return withTenant(pool, u, async (q) => {
      const token = await createSession(q, u, stage, {
        seconds: stage === 'mfa' ? config.session.mfaSeconds : config.session.absoluteSeconds,
        ip, userAgent: req.get('user-agent'),
      });
      if (stage === 'mfa') return { mfa_required: true, mfa_token: token };
      await q.run('UPDATE users SET last_login_at = now() WHERE id = $1', u.id);
      await audit(q, u, 'login', 'user', u.id, { mfa: false });
      const user = await q.get(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, u.id);
      return { token, user, mfa_enrollment_required: stage === 'enroll' };
    });
  }));

  // --- Connexion, étape 2 : code TOTP ou code de secours ---
  api.post('/auth/mfa', publicRoute(async (req) => {
    const pending = await resolveSession(pool, String(req.body?.mfa_token ?? ''), config.session.mfaSeconds);
    if (!pending || pending.stage !== 'mfa') throw unauthorized('Étape de vérification expirée : reconnectez-vous');
    const ip = clientIp(req);
    await assertNotLocked(pending.email, ip);
    const { session_id: pendingId, stage: _stage, ...user } = pending;

    const result = await withTenant(pool, user, async (q) => {
      const row = await q.get('SELECT mfa_secret_enc, mfa_last_counter FROM users WHERE id = $1', user.id);
      let method = null;
      if (req.body?.code != null) {
        const counter = verifyTotp(decryptText(mfaKey, row.mfa_secret_enc), req.body.code,
          { lastCounter: row.mfa_last_counter });
        if (counter != null) {
          await q.run('UPDATE users SET mfa_last_counter = $1 WHERE id = $2', counter, user.id);
          method = 'totp';
        }
      } else if (req.body?.recovery_code != null) {
        const used = await q.run(`UPDATE mfa_recovery_codes SET used_at = now()
          WHERE id = (SELECT id FROM mfa_recovery_codes WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL LIMIT 1)`,
        user.id, sha256(normalizeRecoveryCode(req.body.recovery_code)));
        if (used.rowCount === 1) method = 'recovery_code';
      }
      if (!method) return null;
      await q.run('DELETE FROM sessions WHERE id = $1', pendingId);
      const token = await createSession(q, user, 'full', {
        seconds: config.session.absoluteSeconds, ip, userAgent: req.get('user-agent'),
      });
      await q.run('UPDATE users SET last_login_at = now() WHERE id = $1', user.id);
      await audit(q, user, 'login', 'user', user.id, { mfa: method });
      return { token, user: await q.get(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, user.id) };
    });
    if (!result) {
      await securityEvent('login_failed', { email: user.email, ip, user, details: { step: 'mfa' } });
      throw unauthorized('Code de vérification incorrect', 'mfa_invalid');
    }
    return result;
  }));

  api.post('/auth/logout', tenantRoute(pool, async (req, q) => {
    await revokeSession(q, req.token);
    await audit(q, req.user, 'logout', 'user', req.user.id);
    return { ok: true };
  }));

  // --- Profil ---
  api.get('/me', tenantRoute(pool, async (req, q) => {
    const org = await q.get('SELECT id, name, mfa_required FROM organizations WHERE id = $1', req.user.org_id);
    const user = await q.get(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, req.user.id);
    return { user, org, scope: [...req.scope], session: { stage: req.session.stage } };
  }));

  // Langue : permise à tous les rôles, y compris lecture seule (corrige l'écart D10).
  api.patch('/me', tenantRoute(pool, async (req, q) => {
    const lang = req.body?.lang;
    if (lang == null) throw bad('Rien à modifier');
    if (!['fr', 'en'].includes(lang)) throw bad('Langue invalide');
    await q.run('UPDATE users SET lang = $1 WHERE id = $2', lang, req.user.id);
    return { ok: true };
  }));

  api.post('/me/password', tenantRoute(pool, async (req, q) => {
    const row = await q.get('SELECT password_hash FROM users WHERE id = $1', req.user.id);
    if (!(await verifyPassword(String(req.body?.current_password ?? ''), row.password_hash))) {
      throw bad('Mot de passe actuel incorrect');
    }
    const pw = checkPasswordPolicy(req.body?.new_password, { email: req.user.email });
    await q.run('UPDATE users SET password_hash = $1, password_changed_at = now() WHERE id = $2',
      await hashPassword(pw), req.user.id);
    // Les autres sessions de l'utilisateur sont fermées.
    await q.run('DELETE FROM sessions WHERE user_id = $1 AND id <> $2', req.user.id, req.session.id);
    await audit(q, req.user, 'password_change', 'user', req.user.id);
    return { ok: true };
  }));

  // --- MFA : enrôlement ---
  api.post('/me/mfa/setup', tenantRoute(pool, async (req, q) => {
    if (req.user.mfa_enabled) throw bad('La double authentification est déjà activée');
    const secret = generateSecret();
    await q.run('UPDATE users SET mfa_pending_secret_enc = $1 WHERE id = $2', encryptText(mfaKey, secret), req.user.id);
    return { secret, otpauth_uri: otpauthUri(config.mfaIssuer, req.user.email, secret) };
  }));

  api.post('/me/mfa/confirm', tenantRoute(pool, async (req, q) => {
    const row = await q.get('SELECT mfa_enabled, mfa_pending_secret_enc FROM users WHERE id = $1', req.user.id);
    if (row.mfa_enabled) throw bad('La double authentification est déjà activée');
    if (!row.mfa_pending_secret_enc) throw bad('Commencez par générer un secret (POST /me/mfa/setup)');
    const counter = verifyTotp(decryptText(mfaKey, row.mfa_pending_secret_enc), req.body?.code);
    if (counter == null) throw bad("Code incorrect : vérifiez l'heure de votre téléphone et réessayez");
    await q.run(`UPDATE users SET mfa_enabled = true, mfa_secret_enc = mfa_pending_secret_enc,
                 mfa_pending_secret_enc = NULL, mfa_last_counter = $1, mfa_enrolled_at = now() WHERE id = $2`,
    counter, req.user.id);
    const codes = generateRecoveryCodes();
    await q.run('DELETE FROM mfa_recovery_codes WHERE user_id = $1', req.user.id);
    for (const c of codes) {
      await q.run('INSERT INTO mfa_recovery_codes (org_id, user_id, code_hash) VALUES ($1, $2, $3)',
        req.user.org_id, req.user.id, sha256(normalizeRecoveryCode(c)));
    }
    if (req.session.stage === 'enroll') {
      await q.run("UPDATE sessions SET stage = 'full' WHERE id = $1", req.session.id);
    }
    await audit(q, req.user, 'mfa_enable', 'user', req.user.id);
    return { ok: true, recovery_codes: codes };
  }));

  api.post('/me/mfa/disable', tenantRoute(pool, async (req, q) => {
    const row = await q.get(`SELECT u.password_hash, u.mfa_enabled, u.mfa_secret_enc, u.mfa_last_counter, o.mfa_required
                             FROM users u JOIN organizations o ON o.id = u.org_id WHERE u.id = $1`, req.user.id);
    if (!row.mfa_enabled) throw bad("La double authentification n'est pas activée");
    if (row.mfa_required) throw bad('La double authentification est obligatoire pour votre organisation');
    if (!(await verifyPassword(String(req.body?.password ?? ''), row.password_hash))) throw bad('Mot de passe incorrect');
    if (verifyTotp(decryptText(mfaKey, row.mfa_secret_enc), req.body?.code, { lastCounter: row.mfa_last_counter }) == null) {
      throw bad('Code de vérification incorrect');
    }
    await disableMfa(q, req.user.id);
    await audit(q, req.user, 'mfa_disable', 'user', req.user.id);
    return { ok: true };
  }));
}

export async function disableMfa(q, userId) {
  await q.run(`UPDATE users SET mfa_enabled = false, mfa_secret_enc = NULL, mfa_pending_secret_enc = NULL,
               mfa_last_counter = NULL, mfa_enrolled_at = NULL WHERE id = $1`, userId);
  await q.run('DELETE FROM mfa_recovery_codes WHERE user_id = $1', userId);
}
