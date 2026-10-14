// Rôles et périmètres (livrable 04). Le serveur impose ; le front ne fait que masquer.
import { forbidden, notFound } from './errors.js';

export const ROLES = ['org_admin', 'esg_manager', 'contributor', 'action_owner', 'executive', 'auditor'];
export const MANAGERS = ['org_admin', 'esg_manager'];
export const READ_ONLY = ['executive', 'auditor'];
export const AUDIT_READERS = [...MANAGERS, 'executive', 'auditor'];

export function requireRole(user, roles) {
  if (!roles.includes(user.role)) throw forbidden();
}

// Périmètre : l'entité de rattachement et toutes ses descendantes (NULL = toute l'organisation).
export async function scopeEntityIds(q, user) {
  const ents = await q.all('SELECT id, parent_id FROM entities WHERE org_id = $1', user.org_id);
  if (!user.scope_entity_id) return new Set(ents.map((e) => e.id));
  return subtree(ents, user.scope_entity_id);
}

export function subtree(ents, rootId) {
  const children = new Map();
  for (const e of ents) {
    if (!children.has(e.parent_id)) children.set(e.parent_id, []);
    children.get(e.parent_id).push(e.id);
  }
  const out = new Set([rootId]);
  const stack = [rootId];
  while (stack.length) {
    for (const c of children.get(stack.pop()) || []) { out.add(c); stack.push(c); }
  }
  return out;
}

// Hors périmètre = inexistant : 404, pour ne pas révéler l'existence de l'objet.
export function assertInScope(scope, entityId) {
  if (!scope.has(Number(entityId))) throw notFound();
}
