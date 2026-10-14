// Sessions (TL-PROD-5) : jeton opaque 256 bits remis au client, seule son empreinte SHA-256
// est stockée ; expiration glissante (inactivité) et absolue.
import { randomToken, sha256 } from './crypto.js';

export async function createSession(q, user, stage, { seconds, ip = null, userAgent = null }) {
  const token = randomToken(32);
  await q.run(`INSERT INTO sessions (org_id, user_id, token_hash, stage, expires_at, ip, user_agent)
               VALUES ($1, $2, $3, $4, now() + make_interval(secs => $5), $6, $7)`,
  user.org_id, user.id, sha256(token), stage, seconds, ip, userAgent?.slice(0, 300) ?? null);
  return token;
}

export async function resolveSession(pool, token, idleSeconds) {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const { rows } = await pool.query('SELECT * FROM app_auth_session($1, $2)', [sha256(token), idleSeconds]);
  return rows[0] ?? null;
}

export const revokeSession = (q, token) => q.run('DELETE FROM sessions WHERE token_hash = $1', sha256(token));
export const revokeUserSessions = (q, userId) => q.run('DELETE FROM sessions WHERE user_id = $1', userId);
