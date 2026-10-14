// Organisation, entités, utilisateurs : rôles, périmètres et isolation entre clients.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp } from './helpers.js';

let t;
before(async () => { t = await startTestApp(); });
after(async () => { await t.close(); });

test('entités : règles de hiérarchie et réservées à l’administrateur', async () => {
  const admin = await t.as('admin@kalaya.demo');
  const ents = (await t.call(admin, 'GET', '/entities')).body;
  const site = ents.find((e) => e.code === 'BKN');
  const sub = ents.find((e) => e.code === 'KBX');
  assert.equal((await t.call(admin, 'POST', '/entities', { type: 'site', name: 'X', code: 'X1' })).status, 400, 'site sans parent');
  assert.equal((await t.call(admin, 'POST', '/entities', { type: 'site', name: 'X', code: 'X1', parent_id: site.id })).status, 400, 'site sous un site');
  assert.equal((await t.call(admin, 'POST', '/entities', { type: 'site', name: 'X', code: 'X1', parent_id: sub.id, country: 'Guinée' })).status, 400);
  const ok = await t.call(admin, 'POST', '/entities', { type: 'site', name: 'Carrière de Débélé', code: 'DBL', parent_id: sub.id, country: 'gn' });
  assert.equal(ok.status, 201);
  assert.equal((await t.call(admin, 'POST', '/entities', { type: 'site', name: 'Doublon', code: 'DBL', parent_id: sub.id })).status, 409);
  assert.equal((await t.call(await t.as('rse@kalaya.demo'), 'POST', '/entities', { type: 'site', name: 'Y', code: 'Y1', parent_id: sub.id })).status, 403);
});

test("périmètre : un contributeur de site ne voit que son site", async () => {
  const c = await t.as('site.boke@kalaya.demo');
  const ents = (await t.call(c, 'GET', '/entities')).body;
  assert.deepEqual(ents.map((e) => e.code), ['BKN']);
  const owner = await t.as('env.bauxite@kalaya.demo');
  assert.deepEqual((await t.call(owner, 'GET', '/entities')).body.map((e) => e.code).sort(), ['BKN', 'DBL', 'KBX', 'KMS']);
});

test('utilisateurs : e-mails visibles du seul administrateur', async () => {
  const admin = (await t.call(await t.as('admin@kalaya.demo'), 'GET', '/users')).body;
  assert.ok(admin[0].email);
  const others = (await t.call(await t.as('site.boke@kalaya.demo'), 'GET', '/users')).body;
  assert.ok(others.length > 5);
  assert.deepEqual(Object.keys(others[0]).sort(), ['active', 'id', 'name', 'role']);
});

test('création de compte : politique, unicité, auditeur avec expiration', async () => {
  const admin = await t.as('admin@kalaya.demo');
  const base = { email: 'nouveau@kalaya.demo', name: 'Nouveau', role: 'contributor', password: 'phrase-de-passe-solide' };
  assert.equal((await t.call(admin, 'POST', '/users', { ...base, password: 'court' })).status, 400);
  assert.equal((await t.call(admin, 'POST', '/users', { ...base, role: 'superadmin' })).status, 400);
  assert.equal((await t.call(admin, 'POST', '/users', { ...base, role: 'auditor' })).status, 400);
  assert.equal((await t.call(admin, 'POST', '/users', { ...base, role: 'auditor', access_expires_at: '2020-01-01' })).status, 400);
  const ok = await t.call(admin, 'POST', '/users', base);
  assert.equal(ok.status, 201);
  assert.equal((await t.call(admin, 'POST', '/users', { ...base, email: 'NOUVEAU@kalaya.demo' })).status, 409);
  assert.equal((await t.call(admin, 'POST', '/users', { ...base, email: 'admin@sil.demo' })).status, 409, 'e-mail unique sur la plateforme');
  assert.equal((await t.call(null, 'POST', '/auth/login', { email: base.email, password: base.password })).status, 200);
});

test('changement de droits : sessions de la personne fermées', async () => {
  const admin = await t.as('admin@kalaya.demo');
  const victim = await t.login('site.kamsar@kalaya.demo');
  const users = (await t.call(admin, 'GET', '/users')).body;
  const u = users.find((x) => x.email === 'site.kamsar@kalaya.demo');
  assert.equal((await t.call(admin, 'PATCH', `/users/${u.id}`, { role: 'action_owner' })).status, 200);
  assert.equal((await t.call(victim, 'GET', '/me')).status, 401);
  const self = users.find((x) => x.email === 'admin@kalaya.demo');
  assert.equal((await t.call(admin, 'PATCH', `/users/${self.id}`, { active: false })).status, 400);
});

test("isolation : le client SIL ne voit, ne lit, ne modifie rien de Kalaya", async () => {
  const kalaya = await t.as('admin@kalaya.demo');
  const sil = await t.as('admin@sil.demo');
  const kEnts = (await t.call(kalaya, 'GET', '/entities')).body;
  const kUsers = (await t.call(kalaya, 'GET', '/users')).body;
  const silEnts = (await t.call(sil, 'GET', '/entities')).body;
  assert.ok(silEnts.every((e) => !kEnts.some((k) => k.id === e.id)));
  assert.ok((await t.call(sil, 'GET', '/users')).body.every((u) => u.email.endsWith('@sil.demo')));
  assert.equal((await t.call(sil, 'PATCH', `/users/${kUsers[0].id}`, { active: false })).status, 404);
  assert.equal((await t.call(sil, 'POST', '/entities', { type: 'site', name: 'X', code: 'X9', parent_id: kEnts[0].id })).status, 404);
  assert.equal((await t.call(sil, 'POST', '/users', { email: 'x@sil.demo', name: 'X', role: 'contributor', password: 'phrase-de-passe-solide', scope_entity_id: kEnts[0].id })).status, 404);
  assert.equal((await t.call(sil, 'POST', '/policies', { title: 'X', owner_id: kUsers[0].id })).status, 400);
  assert.equal((await t.call(sil, 'GET', '/organization')).body.name, 'Société Industrielle du Littoral (démo)');
  const log = (await t.call(sil, 'GET', '/audit-log')).body;
  assert.ok(log.every((l) => !/kalaya/i.test(JSON.stringify(l))));
});

test('politiques : créées par les responsables, lues par tous', async () => {
  const rse = await t.as('rse@kalaya.demo');
  const users = (await t.call(rse, 'GET', '/users')).body;
  const r = await t.call(rse, 'POST', '/policies', { title: 'Politique environnementale', owner_id: users[0].id, review_due: '2027-06-30' });
  assert.equal(r.status, 201);
  assert.equal((await t.call(rse, 'POST', '/policies', { title: 'X', review_due: '30/06/2027' })).status, 400);
  assert.equal((await t.call(await t.as('site.boke@kalaya.demo'), 'POST', '/policies', { title: 'X' })).status, 403);
  const list = (await t.call(await t.as('auditeur@cabinet-es.demo'), 'GET', '/policies')).body;
  assert.equal(list[0].review_due, '2027-06-30');
});
