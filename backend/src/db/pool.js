// Accès PostgreSQL : pool, helpers de requêtes, transactions avec contexte d'organisation (RLS).
import pg from 'pg';

// bigint (ids) et numeric : convertis en Number. Les ids restent sous 2^53 ; les valeurs
// numeric(20,6) perdent au-delà de 15-16 chiffres significatifs, ce qui est documenté (05 §3).
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => Number(v));
// date : conservée en texte AAAA-MM-JJ, sans conversion de fuseau.
pg.types.setTypeParser(pg.types.builtins.DATE, (v) => v);

export function createPool(connectionString, { max = 10 } = {}) {
  return new pg.Pool({ connectionString, max, options: '-c TimeZone=UTC' });
}

// Mêmes noms que dans le MVP (q.all / q.get / q.run), en asynchrone et avec $1, $2…
export function queries(client) {
  return {
    all: async (sql, ...params) => (await client.query(sql, params)).rows,
    get: async (sql, ...params) => (await client.query(sql, params)).rows[0] ?? null,
    run: async (sql, ...params) => {
      const r = await client.query(sql, params);
      return { rowCount: r.rowCount, rows: r.rows };
    },
  };
}

// Exécute fn(q) dans une transaction. Avec orgId, la transaction est rattachée à
// l'organisation : les politiques RLS ne laissent voir et écrire que ses lignes.
export async function withTx(pool, fn, { orgId = null, userId = null } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (orgId != null) {
      await client.query("SELECT set_config('app.org_id', $1, true), set_config('app.user_id', $2, true)",
        [String(orgId), userId == null ? '' : String(userId)]);
    }
    const out = await fn(queries(client));
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export const withTenant = (pool, user, fn) => withTx(pool, fn, { orgId: user.org_id, userId: user.id });
