// Piste d'audit chaînée : intégrité, concurrence, détection d'altération, droits de lecture.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp } from './helpers.js';

let t;
before(async () => { t = await startTestApp(); });
after(async () => { await t.close(); });

test('écritures concurrentes : la chaîne reste linéaire et valide', async () => {
  const rse = await t.as('rse@kalaya.demo');
  const results = await Promise.all(Array.from({ length: 25 }, (_, i) =>
    t.call(rse, 'POST', '/policies', { title: `Politique ${i}` })));
  assert.ok(results.every((r) => r.status === 201));
  const v = await t.call(rse, 'GET', '/audit-log/verify');
  assert.equal(v.body.ok, true);
  assert.ok(v.body.count >= 25 + 10);
});

test('altération en base détectée par la vérification', async () => {
  const admin = await t.as('admin@kalaya.demo');
  const log = (await t.call(admin, 'GET', '/audit-log?object_type=policy&limit=5')).body;
  const target = log[2];
  // Un attaquant ayant les droits du propriétaire désactive le trigger et modifie une ligne.
  const c = await t.ownerPool.connect();
  try {
    await c.query('BEGIN');
    await c.query('ALTER TABLE audit_log DISABLE TRIGGER audit_log_no_update');
    await c.query(`UPDATE audit_log SET details = '{"title":"Falsifié"}' WHERE id = $1`, [target.id]);
    await c.query('ALTER TABLE audit_log ENABLE TRIGGER audit_log_no_update');
    await c.query('COMMIT');
  } finally { c.release(); }
  const v = await t.call(admin, 'GET', '/audit-log/verify');
  assert.equal(v.body.ok, false);
  assert.equal(v.body.broken_at, target.id);
  // La chaîne de l'autre client n'est pas affectée.
  assert.equal((await t.call(await t.as('admin@sil.demo'), 'GET', '/audit-log/verify')).body.ok, true);
});

test('lecture du journal : responsables, direction et auditeur seulement', async () => {
  for (const who of ['site.boke@kalaya.demo', 'env.bauxite@kalaya.demo']) {
    assert.equal((await t.call(await t.as(who), 'GET', '/audit-log')).status, 403, who);
  }
  for (const who of ['rse@kalaya.demo', 'dg@kalaya.demo', 'auditeur@cabinet-es.demo']) {
    assert.equal((await t.call(await t.as(who), 'GET', '/audit-log/verify')).status, 200, who);
  }
  const page = (await t.call(await t.as('rse@kalaya.demo'), 'GET', '/audit-log?limit=3')).body;
  assert.equal(page.length, 3);
  const next = (await t.call(await t.as('rse@kalaya.demo'), 'GET', `/audit-log?limit=3&before=${page[2].id}`)).body;
  assert.ok(next[0].id < page[2].id);
});
