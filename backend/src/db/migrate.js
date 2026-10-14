// Migrations versionnées (TL-PROD-1) : fichiers db/migrations/NNN_nom.sql, appliqués dans
// l'ordre, chacun dans sa transaction, sous verrou consultatif (plusieurs instances peuvent
// démarrer en même temps). Une migration appliquée est immuable : son empreinte est vérifiée.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

export const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../db/migrations');
const LOCK_ID = 7_424_242;

export function listMigrations(dir = MIGRATIONS_DIR) {
  return fs.readdirSync(dir)
    .filter((f) => /^\d{3}_[a-z0-9_]+\.sql$/.test(f))
    .sort()
    .map((file) => {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      return {
        version: file.slice(0, 3),
        name: file.slice(4, -4),
        sql,
        checksum: crypto.createHash('sha256').update(sql).digest('hex'),
      };
    });
}

export async function migrate(connectionString, { dir = MIGRATIONS_DIR, log = () => {} } = {}) {
  const client = new pg.Client({ connectionString, options: '-c TimeZone=UTC' });
  await client.connect();
  const applied = [];
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY, name text NOT NULL, checksum char(64) NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now())`);
    const done = new Map((await client.query('SELECT version, checksum FROM schema_migrations')).rows
      .map((r) => [r.version, r.checksum]));

    for (const m of listMigrations(dir)) {
      if (done.has(m.version)) {
        if (done.get(m.version) !== m.checksum) {
          throw new Error(`La migration ${m.version}_${m.name} a été modifiée après application : créer une nouvelle migration`);
        }
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(m.sql);
        await client.query('INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
          [m.version, m.name, m.checksum]);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        e.message = `Migration ${m.version}_${m.name} : ${e.message}`;
        throw e;
      }
      applied.push(`${m.version}_${m.name}`);
      log(`migration appliquée : ${m.version}_${m.name}`);
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    await client.end();
  }
  return applied;
}
