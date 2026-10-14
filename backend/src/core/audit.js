// Piste d'audit chaînée (ADR-004) : chaque ligne contient l'empreinte de la précédente,
// par organisation. En PostgreSQL multi-instances, l'écriture est sérialisée par un verrou
// consultatif de transaction propre à l'organisation (docs-dev/07 §5).
import crypto from 'node:crypto';

const AUDIT_LOCK_CLASS = 4242;
export const GENESIS = '0'.repeat(64);

// JSON canonique (clés triées) : jsonb réordonne les clés, l'empreinte ne doit pas en dépendre.
export function canonicalJson(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(v).filter((k) => v[k] !== undefined).sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(v[k])}`).join(',')}}`;
}

export function auditHash(row) {
  const at = row.at instanceof Date ? row.at.toISOString() : row.at;
  const payload = [row.org_id, at, row.user_id ?? '', row.action, row.object_type, row.object_id ?? '',
    row.details == null ? '' : canonicalJson(row.details), row.prev_hash].join('|');
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// À appeler dans la transaction de l'écriture métier (q = transaction rattachée à l'organisation).
export async function audit(q, user, action, objectType, objectId = null, details = null) {
  await q.run('SELECT pg_advisory_xact_lock($1, $2)', AUDIT_LOCK_CLASS, user.org_id);
  const prev = await q.get('SELECT hash FROM audit_log WHERE org_id = $1 ORDER BY id DESC LIMIT 1', user.org_id);
  const row = {
    org_id: user.org_id,
    at: new Date().toISOString(),
    user_id: user.id ?? null,
    action,
    object_type: objectType,
    object_id: objectId,
    details: details == null ? null : JSON.parse(JSON.stringify(details)),
    prev_hash: prev ? prev.hash : GENESIS,
  };
  row.hash = auditHash(row);
  await q.run(`INSERT INTO audit_log (org_id, at, user_id, user_name, action, object_type, object_id, details, prev_hash, hash)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)`,
  row.org_id, row.at, row.user_id, user.name ?? 'système', row.action, row.object_type, row.object_id,
  row.details == null ? null : JSON.stringify(row.details), row.prev_hash, row.hash);
  return row.hash;
}

export async function verifyAuditChain(q, orgId) {
  const rows = await q.all('SELECT * FROM audit_log WHERE org_id = $1 ORDER BY id', orgId);
  let prev = GENESIS;
  for (const r of rows) {
    if (r.prev_hash !== prev || auditHash(r) !== r.hash) return { ok: false, count: rows.length, broken_at: r.id };
    prev = r.hash;
  }
  return { ok: true, count: rows.length, last_hash: rows.length ? prev : null };
}
