// Organisation : paramètres du client, entités (groupe -> filiale -> site), utilisateurs
// (dont accès auditeur limité dans le temps), registre des politiques. Livrable 04 §4.1.
import { bad, notFound } from '../core/errors.js';
import { tenantRoute, created } from '../core/http.js';
import { requireRole, MANAGERS, ROLES, assertInScope } from '../core/rbac.js';
import { audit } from '../core/audit.js';
import { str, id, date, oneOf, today } from '../core/validate.js';
import { hashPassword, checkPasswordPolicy } from '../core/passwords.js';
import { revokeUserSessions } from '../core/sessions.js';
import { disableMfa } from './auth.js';

export default function orgModule(api, { pool }) {
  // --- Paramètres de l'organisation ---
  api.get('/organization', tenantRoute(pool, async (req, q) =>
    q.get('SELECT id, name, mfa_required, created_at FROM organizations WHERE id = $1', req.user.org_id)));

  api.patch('/organization', tenantRoute(pool, async (req, q) => {
    requireRole(req.user, ['org_admin']);
    const v = req.body?.mfa_required;
    if (typeof v !== 'boolean') throw bad('mfa_required doit valoir true ou false');
    const before = await q.get('SELECT mfa_required FROM organizations WHERE id = $1', req.user.org_id);
    await q.run('UPDATE organizations SET mfa_required = $1 WHERE id = $2', v, req.user.org_id);
    await audit(q, req.user, 'update', 'organization', req.user.org_id, { before, after: { mfa_required: v } });
    return { ok: true };
  }));

  // --- Entités ---
  api.get('/entities', tenantRoute(pool, async (req, q) => {
    const rows = await q.all('SELECT * FROM entities WHERE org_id = $1 ORDER BY id', req.user.org_id);
    return rows.filter((e) => req.scope.has(e.id));
  }));

  api.post('/entities', tenantRoute(pool, async (req, q) => {
    requireRole(req.user, ['org_admin']);
    const b = req.body ?? {};
    const type = oneOf(b.type, ['group', 'subsidiary', 'site'], "type d'entité");
    const parentId = id(b.parent_id, 'entité parente');
    if (parentId) {
      const p = await q.get('SELECT * FROM entities WHERE id = $1 AND org_id = $2', parentId, req.user.org_id);
      if (!p || !req.scope.has(p.id)) throw notFound('Entité parente');
      if (p.type === 'site') throw bad("Un site ne peut pas avoir d'entité fille");
    } else if (type !== 'group') {
      throw bad('Une filiale ou un site doit avoir une entité parente');
    }
    const country = str(b.country, 'pays', { max: 2 })?.toUpperCase() ?? null;
    if (country && !/^[A-Z]{2}$/.test(country)) throw bad('Pays : code ISO à deux lettres attendu (GN, CI, SN…)');
    const row = await q.get(`INSERT INTO entities (org_id, parent_id, name, code, type, country)
                             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    req.user.org_id, parentId, str(b.name, 'nom', { required: true, max: 200 }),
    str(b.code, 'code', { required: true, max: 20 }), type, country);
    await audit(q, req.user, 'create', 'entity', row.id, { after: row });
    return created(row.id);
  }));

  // --- Utilisateurs ---
  // Seul l'administrateur voit les e-mails et les dates d'accès ; les autres rôles reçoivent
  // le nom et le rôle, utiles pour désigner un responsable (corrige l'écart D6).
  api.get('/users', tenantRoute(pool, async (req, q) => {
    if (req.user.role === 'org_admin') {
      return q.all(`SELECT id, email, name, role, scope_entity_id, access_expires_at, lang, active,
                           mfa_enabled, last_login_at, created_at
                    FROM users WHERE org_id = $1 ORDER BY name`, req.user.org_id);
    }
    return q.all('SELECT id, name, role, active FROM users WHERE org_id = $1 AND active ORDER BY name', req.user.org_id);
  }));

  api.post('/users', tenantRoute(pool, async (req, q) => {
    requireRole(req.user, ['org_admin']);
    const b = req.body ?? {};
    const role = oneOf(b.role, ROLES, 'rôle');
    const email = str(b.email, 'email', { required: true, max: 320 }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad('Adresse e-mail invalide');
    const scopeId = id(b.scope_entity_id, 'périmètre');
    if (scopeId) assertInScope(req.scope, scopeId);
    const expires = date(b.access_expires_at, "date d'expiration");
    if (role === 'auditor' && !expires) throw bad("Un accès auditeur doit avoir une date d'expiration");
    if (expires && expires < today()) throw bad("La date d'expiration est déjà passée");
    // [TL-PROD-6] remplacer par une invitation par e-mail (lien à usage unique, 72 h).
    const pw = checkPasswordPolicy(b.password, { email });
    const row = await q.get(`INSERT INTO users (org_id, email, name, password_hash, role, scope_entity_id, access_expires_at, lang)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    req.user.org_id, email, str(b.name, 'nom', { required: true, max: 200 }), await hashPassword(pw),
    role, scopeId, expires, b.lang === 'en' ? 'en' : 'fr');
    await audit(q, req.user, 'create', 'user', row.id,
      { after: { email, role, scope_entity_id: scopeId, access_expires_at: expires } });
    return created(row.id);
  }));

  api.patch('/users/:id', tenantRoute(pool, async (req, q) => {
    requireRole(req.user, ['org_admin']);
    const u = await q.get(`SELECT id, role, scope_entity_id, access_expires_at, active, mfa_enabled
                           FROM users WHERE id = $1 AND org_id = $2`, id(req.params.id), req.user.org_id);
    if (!u) throw notFound('Utilisateur');
    const b = req.body ?? {};
    const role = b.role == null ? u.role : oneOf(b.role, ROLES, 'rôle');
    const active = b.active == null ? u.active : Boolean(b.active);
    const expires = b.access_expires_at === undefined ? u.access_expires_at : date(b.access_expires_at, "date d'expiration");
    let scopeId = u.scope_entity_id;
    if (b.scope_entity_id !== undefined) {
      scopeId = id(b.scope_entity_id, 'périmètre');
      if (scopeId) assertInScope(req.scope, scopeId);
    }
    if (u.id === req.user.id && (!active || role !== 'org_admin')) throw bad('Vous ne pouvez pas retirer vos propres droits');
    if (role === 'auditor' && !expires) throw bad("Un accès auditeur doit avoir une date d'expiration");

    await q.run(`UPDATE users SET role = $1, active = $2, access_expires_at = $3, scope_entity_id = $4 WHERE id = $5`,
      role, active, expires, scopeId, u.id);
    const after = { role, active, access_expires_at: expires, scope_entity_id: scopeId };
    // Tout changement de droits ferme les sessions ouvertes de la personne.
    const rightsChanged = role !== u.role || active !== u.active || scopeId !== u.scope_entity_id;
    if (rightsChanged) await revokeUserSessions(q, u.id);
    // Perte du téléphone : l'administrateur réinitialise la MFA, la personne la reconfigure.
    if (b.mfa_reset === true && u.mfa_enabled) {
      await disableMfa(q, u.id);
      await revokeUserSessions(q, u.id);
      after.mfa_reset = true;
    }
    const { id: _id, mfa_enabled: _m, ...before } = u;
    await audit(q, req.user, 'update', 'user', u.id, { before, after });
    return { ok: true };
  }));

  // --- Governance : registre des politiques ---
  api.get('/policies', tenantRoute(pool, async (req, q) =>
    q.all(`SELECT p.*, u.name AS owner_name FROM policies p
           LEFT JOIN users u ON u.id = p.owner_id AND u.org_id = p.org_id
           WHERE p.org_id = $1 ORDER BY p.title`, req.user.org_id)));

  api.post('/policies', tenantRoute(pool, async (req, q) => {
    requireRole(req.user, MANAGERS);
    const b = req.body ?? {};
    const row = await q.get(`INSERT INTO policies (org_id, title, owner_id, approved_at, review_due)
                             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    req.user.org_id, str(b.title, 'titre', { required: true, max: 300 }), await ownerIn(q, req.user, b.owner_id),
    date(b.approved_at, "date d'approbation"), date(b.review_due, 'date de revue'));
    await audit(q, req.user, 'create', 'policy', row.id, { after: row });
    return created(row.id);
  }));
}

// Vérifie qu'un responsable désigné appartient bien à la même organisation.
export async function ownerIn(q, user, ownerId) {
  const oid = id(ownerId, 'responsable');
  if (!oid) return null;
  const o = await q.get('SELECT id FROM users WHERE id = $1 AND org_id = $2 AND active', oid, user.org_id);
  if (!o) throw bad('Responsable inconnu');
  return o.id;
}
