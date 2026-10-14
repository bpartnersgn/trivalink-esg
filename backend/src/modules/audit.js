// Journal d'audit : consultation et vérification de la chaîne (livrable 04 §4.6).
import { tenantRoute } from '../core/http.js';
import { requireRole, AUDIT_READERS } from '../core/rbac.js';
import { verifyAuditChain } from '../core/audit.js';
import { str, id } from '../core/validate.js';

export default function auditModule(api, { pool }) {
  api.get('/audit-log', tenantRoute(pool, async (req, q) => {
    requireRole(req.user, AUDIT_READERS);
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 1000);
    const where = ['org_id = $1'];
    const params = [req.user.org_id];
    const objectType = str(req.query.object_type, 'type d’objet', { max: 50 });
    if (objectType) { params.push(objectType); where.push(`object_type = $${params.length}`); }
    const objectId = id(req.query.object_id, 'objet');
    if (objectId) { params.push(objectId); where.push(`object_id = $${params.length}`); }
    const before = id(req.query.before, 'curseur');
    if (before) { params.push(before); where.push(`id < $${params.length}`); }
    params.push(limit);
    // [À FAIRE] restreindre aux objets du périmètre pour un utilisateur à périmètre limité (04, note 5),
    // quand les modules métier seront portés (résolution objet -> entité).
    return q.all(`SELECT id, at, user_id, user_name, action, object_type, object_id, details, hash
                  FROM audit_log WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT $${params.length}`, ...params);
  }));

  api.get('/audit-log/verify', tenantRoute(pool, async (req, q) => {
    requireRole(req.user, AUDIT_READERS);
    return verifyAuditChain(q, req.user.org_id);
  }));
}
