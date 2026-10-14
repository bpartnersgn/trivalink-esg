// Connexion, sessions durcies, anti force brute, règle de lecture seule.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, DEMO_PASSWORD } from './helpers.js';
import { sha256 } from '../src/core/crypto.js';

let t;
before(async () => { t = await startTestApp(); });
after(async () => { await t.close(); });

test('connexion : nominale, message identique pour e-mail inconnu et mauvais mot de passe', async () => {
  const ok = await t.call(null, 'POST', '/auth/login', { email: 'RSE@kalaya.demo ', password: DEMO_PASSWORD });
  assert.equal(ok.status, 200);
  assert.match(ok.body.token, /^[0-9a-f]{64}$/);
  assert.equal(ok.body.user.password_hash, undefined);
  assert.equal(ok.body.user.mfa_secret_enc, undefined);
  const unknown = await t.call(null, 'POST', '/auth/login', { email: 'inconnu@kalaya.demo', password: 'x' });
  const wrong = await t.call(null, 'POST', '/auth/login', { email: 'hse@kalaya.demo', password: 'mauvais' });
  assert.equal(unknown.status, 401);
  assert.deepEqual(unknown.body, wrong.body);
});

test("sessions : seule l'empreinte du jeton est stockée", async () => {
  const token = await t.login('dg@kalaya.demo');
  const { rows } = await t.ownerPool.query('SELECT token_hash FROM sessions');
  assert.ok(rows.some((r) => r.token_hash === sha256(token)));
  assert.ok(rows.every((r) => r.token_hash !== token));
});

test("jeton refusé dans l'URL, accepté dans l'en-tête", async () => {
  const token = await t.as('rse@kalaya.demo');
  assert.equal((await t.call(null, 'GET', `/me?token=${token}`)).status, 401);
  assert.equal((await t.call(token, 'GET', '/me')).status, 200);
  assert.equal((await t.call(null, 'GET', '/me')).status, 401);
  assert.equal((await t.call('pas-un-jeton', 'GET', '/me')).status, 401);
});

test('anti force brute : verrouillage après 5 échecs sur un compte', async () => {
  for (let i = 0; i < 5; i++) {
    assert.equal((await t.call(null, 'POST', '/auth/login', { email: 'site.kamsar@kalaya.demo', password: 'faux' })).status, 401);
  }
  const locked = await t.call(null, 'POST', '/auth/login', { email: 'site.kamsar@kalaya.demo', password: DEMO_PASSWORD });
  assert.equal(locked.status, 429);
  assert.match(locked.body.error, /Trop de tentatives/);
  const { rows } = await t.ownerPool.query("SELECT type, count(*)::int AS n FROM security_events WHERE email = 'site.kamsar@kalaya.demo' GROUP BY type");
  assert.deepEqual(Object.fromEntries(rows.map((r) => [r.type, r.n])), { login_failed: 5, login_locked: 1 });
});

test('déconnexion : le jeton ne fonctionne plus', async () => {
  const token = await t.login('hse@kalaya.demo');
  assert.equal((await t.call(token, 'POST', '/auth/logout')).status, 200);
  assert.equal((await t.call(token, 'GET', '/me')).status, 401);
});

test("expiration : par inactivité et à la date de fin d'accès de l'auditeur", async () => {
  const token = await t.login('site.boke@kalaya.demo');
  await t.ownerPool.query("UPDATE sessions SET last_seen_at = now() - interval '3 hours' WHERE token_hash = $1", [sha256(token)]);
  assert.equal((await t.call(token, 'GET', '/me')).status, 401, 'inactivité > 2 h');

  const auditor = await t.login('auditeur@cabinet-es.demo');
  assert.equal((await t.call(auditor, 'GET', '/me')).status, 200);
  await t.ownerPool.query("UPDATE users SET access_expires_at = current_date - 1 WHERE email = 'auditeur@cabinet-es.demo'");
  assert.equal((await t.call(auditor, 'GET', '/me')).status, 401, 'session coupée dès le lendemain');
  const r = await t.call(null, 'POST', '/auth/login', { email: 'auditeur@cabinet-es.demo', password: DEMO_PASSWORD });
  assert.equal(r.status, 401);
  assert.equal(r.body.code, 'expired');
  await t.ownerPool.query("UPDATE users SET access_expires_at = current_date + 30 WHERE email = 'auditeur@cabinet-es.demo'");
});

test('lecture seule : la direction lit, ne crée rien, mais gère son propre compte', async () => {
  const dg = await t.as('dg@kalaya.demo');
  assert.equal((await t.call(dg, 'GET', '/policies')).status, 200);
  const w = await t.call(dg, 'POST', '/policies', { title: 'X' });
  assert.equal(w.status, 403);
  assert.equal(w.body.error, 'Accès en lecture seule');
  assert.equal((await t.call(dg, 'PATCH', '/me', { lang: 'en' })).status, 200, 'langue enregistrée (écart D10 corrigé)');
  assert.equal((await t.call(dg, 'GET', '/me')).body.user.lang, 'en');
});

test('changement de mot de passe : politique appliquée, autres sessions fermées', async () => {
  const s1 = await t.login('env.bauxite@kalaya.demo');
  const s2 = await t.login('env.bauxite@kalaya.demo');
  assert.equal((await t.call(s1, 'POST', '/me/password', { current_password: DEMO_PASSWORD, new_password: 'court' })).status, 400);
  assert.equal((await t.call(s1, 'POST', '/me/password', { current_password: 'faux', new_password: 'nouvelle-phrase-2026' })).status, 400);
  assert.equal((await t.call(s1, 'POST', '/me/password', { current_password: DEMO_PASSWORD, new_password: 'nouvelle-phrase-2026' })).status, 200);
  assert.equal((await t.call(s1, 'GET', '/me')).status, 200);
  assert.equal((await t.call(s2, 'GET', '/me')).status, 401);
  assert.equal((await t.call(null, 'POST', '/auth/login', { email: 'env.bauxite@kalaya.demo', password: 'nouvelle-phrase-2026' })).status, 200);
});

test('santé, en-têtes de sécurité, erreurs uniformes', async () => {
  const h = await t.call(null, 'GET', '/health');
  assert.deepEqual(h.body, { ok: true, checks: { database: 'ok', storage: 'ok' } });
  assert.equal(h.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(h.headers.get('x-request-id'));
  const token = await t.as('rse@kalaya.demo');
  const unknown = await t.call(token, 'GET', '/nexiste-pas');
  assert.deepEqual(unknown.body, { error: 'Route inconnue', code: 'not_found' });
  const res = await fetch(`${t.base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{mal' });
  assert.equal(res.status, 400);
});
