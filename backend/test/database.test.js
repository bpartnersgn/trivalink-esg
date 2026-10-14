// Migrations, Row-Level Security et droits du rôle applicatif, testés directement en SQL.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { createTestDb } from './helpers.js';
import { migrate, MIGRATIONS_DIR } from '../src/db/migrate.js';
import { createPool, withTx } from '../src/db/pool.js';
import { seedDemo } from '../src/seed.js';

let db;
let owner;
let app;
before(async () => {
  db = await createTestDb();
  await migrate(db.ownerUrl);
  owner = createPool(db.ownerUrl, { max: 2 });
  await seedDemo(owner);
  app = createPool(db.appUrl, { max: 4 });
});
after(async () => {
  await app.end();
  await owner.end();
  await db.drop();
});

const KALAYA = 1;
const SIL = 2;

test('migrations : idempotentes, immuables une fois appliquées', async () => {
  assert.deepEqual(await migrate(db.ownerUrl), [], 'second passage sans effet');
  const { rows } = await owner.query('SELECT version FROM schema_migrations ORDER BY version');
  assert.deepEqual(rows.map((r) => r.version), ['001', '002']);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trivalink-mig-'));
  for (const f of fs.readdirSync(MIGRATIONS_DIR)) fs.copyFileSync(path.join(MIGRATIONS_DIR, f), path.join(dir, f));
  fs.appendFileSync(path.join(dir, '001_init.sql'), '\n-- modification après livraison\n');
  await assert.rejects(migrate(db.ownerUrl, { dir }), /modifiée après application/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("RLS : sans organisation en contexte, le rôle applicatif ne voit rien", async () => {
  for (const table of ['organizations', 'users', 'entities', 'audit_log', 'sessions']) {
    const { rows } = await app.query(`SELECT count(*)::int AS n FROM ${table}`);
    assert.equal(rows[0].n, 0, table);
  }
});

test("RLS : une transaction d'organisation ne voit et n'écrit que ses lignes", async () => {
  await withTx(app, async (q) => {
    const orgs = await q.all('SELECT id FROM organizations');
    assert.deepEqual(orgs.map((o) => o.id), [KALAYA]);
    // Même sans filtre org_id dans la requête (oubli dans le code), SIL reste invisible.
    const users = await q.all('SELECT DISTINCT org_id FROM users');
    assert.deepEqual(users.map((u) => u.org_id), [KALAYA]);
    const sil = await q.get("SELECT id FROM users WHERE email = 'admin@sil.demo'");
    assert.equal(sil, null);
  }, { orgId: KALAYA });

  await assert.rejects(withTx(app, (q) => q.run(
    "INSERT INTO policies (org_id, title) VALUES ($1, 'Intrusion')", SIL), { orgId: KALAYA }),
  /row-level security/);
  // Mise à jour d'une ligne d'un autre client : aucune ligne touchée.
  const r = await withTx(app, (q) => q.run("UPDATE entities SET name = 'piraté' WHERE org_id = $1", SIL), { orgId: KALAYA });
  assert.equal(r.rowCount, 0);
});

test("droits : journal en ajout seul, pas de DELETE métier, pas de création d'organisation", async () => {
  await assert.rejects(withTx(app, (q) => q.run("UPDATE audit_log SET action = 'x'"), { orgId: KALAYA }), /permission denied/);
  await assert.rejects(withTx(app, (q) => q.run('DELETE FROM audit_log'), { orgId: KALAYA }), /permission denied/);
  await assert.rejects(withTx(app, (q) => q.run('DELETE FROM entities'), { orgId: KALAYA }), /permission denied/);
  await assert.rejects(app.query("INSERT INTO organizations (name) VALUES ('X')"), /permission denied/);
  await assert.rejects(app.query('SELECT * FROM security_events'), /permission denied/);
  // Même le propriétaire ne peut ni modifier ni vider le journal (triggers).
  await assert.rejects(owner.query("UPDATE audit_log SET action = 'x'"), /append-only/);
  await assert.rejects(owner.query('DELETE FROM audit_log'), /append-only/);
  await assert.rejects(owner.query('TRUNCATE audit_log'), /append-only/);
});

test('chaîne : deux lignes ne peuvent pas avoir le même prédécesseur', async () => {
  const { rows: [last] } = await owner.query('SELECT * FROM audit_log WHERE org_id = $1 ORDER BY id DESC LIMIT 1', [KALAYA]);
  await assert.rejects(owner.query(`INSERT INTO audit_log (org_id, at, action, object_type, prev_hash, hash)
    VALUES ($1, now(), 'x', 'x', $2, $3)`, [KALAYA, last.prev_hash, 'e'.repeat(64)]), /audit_log_chain/);
});

test("le rôle applicatif n'a pas BYPASSRLS et ne possède aucune table", async () => {
  const c = new pg.Client({ connectionString: db.appUrl });
  await c.connect();
  const { rows: [r] } = await c.query("SELECT rolbypassrls, rolsuper FROM pg_roles WHERE rolname = current_user");
  assert.equal(r.rolbypassrls, false);
  assert.equal(r.rolsuper, false);
  const { rows: owned } = await c.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tableowner = current_user");
  assert.deepEqual(owned, []);
  await c.end();
});
