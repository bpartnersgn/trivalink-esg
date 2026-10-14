// Tests unitaires du socle (sans base de données).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadConfig, ConfigError, DEV_STORAGE_KEY } from '../src/config.js';
import { hotp, verifyTotp, totp, base32Encode, base32Decode, counterAt } from '../src/core/totp.js';
import { canonicalJson, auditHash, GENESIS } from '../src/core/audit.js';
import { createStorage, IntegrityError } from '../src/storage/index.js';
import { checkPasswordPolicy, hashPassword, verifyPassword } from '../src/core/passwords.js';
import { subtree } from '../src/core/rbac.js';
import { previousPeriod, isPeriod } from '../src/core/periods.js';

test('configuration : garde-fous de production', () => {
  const base = { DATABASE_URL: 'postgres://x', NODE_ENV: 'production' };
  assert.throws(() => loadConfig(base), ConfigError, 'clé absente refusée');
  assert.throws(() => loadConfig({ ...base, TRIVALINK_STORAGE_KEY: DEV_STORAGE_KEY }), ConfigError);
  assert.throws(() => loadConfig({ ...base, TRIVALINK_STORAGE_KEY: 'trop-courte' }), ConfigError);
  const key = 'k'.repeat(40);
  assert.throws(() => loadConfig({ ...base, TRIVALINK_STORAGE_KEY: key, TRIVALINK_SEED: '1' }), /interdit en production/);
  assert.throws(() => loadConfig({ NODE_ENV: 'production', TRIVALINK_STORAGE_KEY: key }), /DATABASE_URL/);
  const c = loadConfig({ ...base, TRIVALINK_STORAGE_KEY: key });
  assert.equal(c.production, true);
  assert.equal(c.migrateOnStart, false, 'pas de migration implicite en production');
  assert.equal(loadConfig({ DATABASE_URL: 'postgres://x' }).storageKey, DEV_STORAGE_KEY, 'clé de dev hors production');
});

test('TOTP : vecteurs de la RFC 6238 et tolérance', () => {
  const secret = base32Encode(Buffer.from('12345678901234567890'));
  assert.equal(base32Decode(secret).toString(), '12345678901234567890');
  // RFC 6238, annexe B (SHA-1), 8 chiffres tronqués à 6 : 94287082 -> 287082
  assert.equal(hotp(secret, counterAt(59 * 1000)), '287082');
  assert.equal(hotp(secret, counterAt(1111111109 * 1000)), '081804');
  const now = Date.now();
  const code = totp(secret, now);
  assert.notEqual(verifyTotp(secret, code, { ms: now }), null);
  assert.notEqual(verifyTotp(secret, code, { ms: now + 30_000 }), null, 'un pas de décalage toléré');
  assert.equal(verifyTotp(secret, code, { ms: now + 120_000 }), null, 'code trop ancien refusé');
  const counter = verifyTotp(secret, code, { ms: now });
  assert.equal(verifyTotp(secret, code, { ms: now, lastCounter: counter }), null, 'rejeu refusé');
  assert.equal(verifyTotp(secret, 'abcdef', { ms: now }), null);
});

test("audit : JSON canonique indépendant de l'ordre des clés", () => {
  assert.equal(canonicalJson({ b: 1, a: { d: [1, { z: 1, y: 2 }], c: null } }), '{"a":{"c":null,"d":[1,{"y":2,"z":1}]},"b":1}');
  const row = { org_id: 1, at: '2026-10-14T10:00:00.000Z', user_id: 2, action: 'create', object_type: 'policy',
    object_id: 3, details: { x: 1, a: 'é' }, prev_hash: GENESIS };
  assert.equal(auditHash(row), auditHash({ ...row, details: { a: 'é', x: 1 }, at: new Date(row.at) }));
  assert.notEqual(auditHash(row), auditHash({ ...row, details: { a: 'é', x: 2 } }));
});

test('stockage : chiffrement, intégrité, cloisonnement par organisation', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trivalink-st-'));
  try {
    const st = createStorage({ storageDriver: 'disk', storageDir: dir, storageKey: 'x'.repeat(40) });
    const content = Buffer.from('Rapport de laboratoire, rejets T3');
    const saved = await st.save(7, content);
    const onDisk = fs.readFileSync(path.join(dir, saved.storageKey));
    assert.equal(onDisk.includes(content), false, 'contenu chiffré au repos');
    assert.deepEqual(await st.read(7, saved.storageKey, saved.sha256), content);
    await assert.rejects(st.read(8, saved.storageKey), IntegrityError, "lecture depuis une autre organisation refusée");
    await assert.rejects(st.read(7, saved.storageKey, 'f'.repeat(64)), IntegrityError);
    onDisk[onDisk.length - 1] ^= 1;
    fs.writeFileSync(path.join(dir, saved.storageKey), onDisk);
    await assert.rejects(st.read(7, saved.storageKey), 'altération détectée par GCM');
    await assert.rejects(st.read(7, '7/../../etc/passwd'), /Clé de stockage invalide/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('mots de passe : scrypt et politique', async () => {
  const h = await hashPassword('une-phrase-de-passe-longue');
  assert.equal(await verifyPassword('une-phrase-de-passe-longue', h), true);
  assert.equal(await verifyPassword('autre', h), false);
  assert.throws(() => checkPasswordPolicy('court'), /au moins 12/);
  assert.throws(() => checkPasswordPolicy('fatoumata-2026!', { email: 'fatoumata@kalaya.demo' }), /identifiant/);
});

test('périmètre et périodes', () => {
  const ents = [{ id: 1, parent_id: null }, { id: 2, parent_id: 1 }, { id: 3, parent_id: 2 }, { id: 4, parent_id: 1 }];
  assert.deepEqual([...subtree(ents, 2)].sort(), [2, 3]);
  assert.equal(previousPeriod('2026-Q1'), '2025-Q4');
  assert.equal(isPeriod('2026-Q5'), false);
});
