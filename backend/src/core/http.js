// Enveloppes de routes. Une route métier s'exécute dans UNE transaction rattachée à
// l'organisation de l'utilisateur (RLS) ; la réponse n'est envoyée qu'après le COMMIT.
import { withTenant } from '../db/pool.js';
import { scopeEntityIds } from './rbac.js';

export class Reply {
  constructor(status, body) { this.status = status; this.body = body; }
}
export const created = (id) => new Reply(201, { id });

function send(res, out) {
  if (out instanceof Reply) return res.status(out.status).json(out.body);
  return res.json(out ?? { ok: true });
}

// Route authentifiée : fn(req, q) avec req.user, req.scope, et q lié à l'organisation.
export const tenantRoute = (pool, fn) => async (req, res) => {
  const out = await withTenant(pool, req.user, async (q) => {
    req.scope = await scopeEntityIds(q, req.user);
    return fn(req, q);
  });
  send(res, out);
};

// Route sans organisation (connexion, santé) : fn(req) gère elle-même ses transactions.
export const publicRoute = (fn) => async (req, res) => {
  send(res, await fn(req, res));
};
