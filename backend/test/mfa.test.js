// Double authentification TOTP : enrôlement, connexion en deux étapes, codes de secours,
// MFA obligatoire par organisation, réinitialisation par l'administrateur.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, DEMO_PASSWORD } from './helpers.js';
import { totp, hotp, counterAt } from '../src/core/totp.js';

let t;
before(async () => { t = await startTestApp(); });
after(async () => { await t.close(); });

async function enroll(token) {
  const setup = await t.call(token, 'POST', '/me/mfa/setup');
  assert.equal(setup.status, 200);
  assert.match(setup.body.otpauth_uri, /^otpauth:\/\/totp\/TRIVALINK%20ESG/);
  // Code du pas précédent : laisse le code courant libre pour la connexion qui suit.
  const code = hotp(setup.body.secret, counterAt() - 1);
  const ok = await t.call(token, 'POST', '/me/mfa/confirm', { code });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  return { secret: setup.body.secret, recovery: ok.body.recovery_codes };
}
const password = (email) => t.call(null, 'POST', '/auth/login', { email, password: DEMO_PASSWORD });

test('enrôlement puis connexion en deux étapes', async () => {
  const token = await t.login('rse@kalaya.demo');
  assert.equal((await t.call(token, 'POST', '/me/mfa/confirm', { code: '000000' })).status, 400, 'pas de secret en attente');
  const { secret, recovery } = await enroll(token);
  assert.equal(recovery.length, 10);
  const { rows: [u] } = await t.ownerPool.query("SELECT mfa_secret_enc FROM users WHERE email = 'rse@kalaya.demo'");
  assert.ok(u.mfa_secret_enc.startsWith('v1:') && !u.mfa_secret_enc.includes(secret), 'secret chiffré en base');

  const step1 = await password('rse@kalaya.demo');
  assert.equal(step1.status, 200);
  assert.equal(step1.body.token, undefined);
  assert.equal(step1.body.mfa_required, true);
  assert.equal((await t.call(step1.body.mfa_token, 'GET', '/me')).status, 401, "le jeton d'étape n'ouvre pas l'API");

  const bad = await t.call(null, 'POST', '/auth/mfa', { mfa_token: step1.body.mfa_token, code: '000000' });
  assert.equal(bad.status, 401);
  assert.equal(bad.body.code, 'mfa_invalid');

  const code = totp(secret);
  const step2 = await t.call(null, 'POST', '/auth/mfa', { mfa_token: step1.body.mfa_token, code });
  assert.equal(step2.status, 200);
  assert.equal((await t.call(step2.body.token, 'GET', '/me')).body.user.mfa_enabled, true);
  assert.equal((await t.call(null, 'POST', '/auth/mfa', { mfa_token: step1.body.mfa_token, code })).status, 401, "jeton d'étape à usage unique");

  // Rejeu du même code sur une nouvelle connexion : refusé.
  const again = await password('rse@kalaya.demo');
  assert.equal((await t.call(null, 'POST', '/auth/mfa', { mfa_token: again.body.mfa_token, code })).status, 401);

  // Code de secours : accepté une fois.
  const r1 = await t.call(null, 'POST', '/auth/mfa', { mfa_token: again.body.mfa_token, recovery_code: recovery[0].toUpperCase() });
  assert.equal(r1.status, 200);
  const third = await password('rse@kalaya.demo');
  assert.equal((await t.call(null, 'POST', '/auth/mfa', { mfa_token: third.body.mfa_token, recovery_code: recovery[0] })).status, 401);

  const log = await t.call(r1.body.token, 'GET', '/audit-log?object_type=user');
  const actions = log.body.filter((l) => l.user_name === 'Fatoumata Bah').map((l) => `${l.action}:${l.details?.mfa ?? ''}`);
  assert.ok(actions.includes('mfa_enable:'));
  assert.ok(actions.includes('login:totp') && actions.includes('login:recovery_code'));
});

test('retrait de la MFA : mot de passe et code exigés', async () => {
  const token = await t.login('hse@kalaya.demo');
  const { secret } = await enroll(token);
  const full = await t.call(null, 'POST', '/auth/mfa', { mfa_token: (await password('hse@kalaya.demo')).body.mfa_token, code: totp(secret) });
  assert.equal((await t.call(full.body.token, 'POST', '/me/mfa/disable', { password: 'faux', code: '000000' })).status, 400);
  const off = await t.call(full.body.token, 'POST', '/me/mfa/disable', { password: DEMO_PASSWORD, code: hotp(secret, counterAt() + 1) });
  assert.equal(off.status, 200, JSON.stringify(off.body));
  const login = await password('hse@kalaya.demo');
  assert.ok(login.body.token, 'connexion directe une fois la MFA retirée');
});

test("MFA obligatoire pour l'organisation : enrôlement imposé avant tout accès", async () => {
  const admin = await t.as('admin@kalaya.demo');
  assert.equal((await t.call(await t.as('dg@kalaya.demo'), 'PATCH', '/organization', { mfa_required: true })).status, 403);
  assert.equal((await t.call(admin, 'PATCH', '/organization', { mfa_required: true })).status, 200);

  const login = await password('site.siguiri@kalaya.demo');
  assert.equal(login.body.mfa_enrollment_required, true);
  const blocked = await t.call(login.body.token, 'GET', '/entities');
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.code, 'mfa_enrollment_required');
  assert.equal((await t.call(login.body.token, 'GET', '/me')).body.session.stage, 'enroll');
  await enroll(login.body.token);
  assert.equal((await t.call(login.body.token, 'GET', '/entities')).status, 200, 'session promue après enrôlement');

  // L'auditeur (lecture seule) peut aussi s'enrôler.
  const aud = await password('auditeur@cabinet-es.demo');
  await enroll(aud.body.token);

  assert.equal((await t.call(admin, 'PATCH', '/organization', { mfa_required: false })).status, 200);
});

test("téléphone perdu : l'administrateur réinitialise la MFA", async () => {
  const token = await t.login('site.boke@kalaya.demo');
  await enroll(token);
  const admin = await t.as('admin@kalaya.demo');
  const users = (await t.call(admin, 'GET', '/users')).body;
  const boke = users.find((u) => u.email === 'site.boke@kalaya.demo');
  assert.equal(boke.mfa_enabled, true);
  assert.equal((await t.call(admin, 'PATCH', `/users/${boke.id}`, { mfa_reset: true })).status, 200);
  assert.equal((await t.call(token, 'GET', '/me')).status, 401, 'sessions fermées');
  assert.ok((await password('site.boke@kalaya.demo')).body.token);
});
