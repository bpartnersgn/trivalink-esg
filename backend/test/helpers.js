// Banc d'essai : une base PostgreSQL jetable par fichier de test, migrée avec le rôle
// propriétaire, servie par l'API avec le rôle applicatif (RLS active), comme en production.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { loadConfig } from '../src/config.js';
import { createPool } from '../src/db/pool.js';
import { migrate } from '../src/db/migrate.js';
import { createStorage } from '../src/storage/index.js';
import { createLogger } from '../src/core/logger.js';
import { createApp } from '../src/app.js';
import { seedDemo, DEMO_PASSWORD } from '../src/seed.js';

export { DEMO_PASSWORD };
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

function urlFor(user, password, database) {
  const u = new URL(ADMIN_URL);
  u.username = user;
  u.password = password;
  u.pathname = `/${database}`;
  return u.toString();
}

export async function createTestDb() {
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(fs.readFileSync(path.join(ROOT, 'db/init/00-roles.sql'), 'utf8'));
  const name = `trivalink_test_${crypto.randomBytes(5).toString('hex')}`;
  await admin.query(`CREATE DATABASE ${name} OWNER trivalink_owner`);
  await admin.end();
  return {
    name,
    ownerUrl: urlFor('trivalink_owner', 'trivalink_owner_dev', name),
    appUrl: urlFor('trivalink_app', 'trivalink_app_dev', name),
    async drop() {
      const c = new pg.Client({ connectionString: ADMIN_URL });
      await c.connect();
      await c.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await c.end();
    },
  };
}

// Démarre une API complète sur un port libre, avec la démonstration chargée.
export async function startTestApp(env = {}) {
  const db = await createTestDb();
  await migrate(db.ownerUrl);
  const ownerPool = createPool(db.ownerUrl, { max: 3 });
  await seedDemo(ownerPool);
  const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trivalink-evidence-'));
  const config = loadConfig({
    NODE_ENV: 'test', DATABASE_URL: db.appUrl, TRIVALINK_STORAGE_DIR: storageDir,
    LOGIN_MAX_FAILURES_IP: '1000', ...env,
  });
  const pool = createPool(db.appUrl, { max: 10 });
  const log = createLogger(process.env.TEST_LOG_LEVEL || 'silent');
  const app = createApp({ config, pool, storage: createStorage(config), log });
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api`;

  async function call(token, method, url, body, headers = {}) {
    const res = await fetch(base + url, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { json = text; }
    return { status: res.status, body: json, headers: res.headers };
  }

  const tokens = new Map();
  async function login(email, password = DEMO_PASSWORD) {
    const r = await call(null, 'POST', '/auth/login', { email, password });
    if (r.status !== 200 || !r.body.token) throw new Error(`Connexion impossible pour ${email} : ${r.status} ${JSON.stringify(r.body)}`);
    return r.body.token;
  }
  // as('rse@kalaya.demo') : jeton mis en cache par compte.
  async function as(email) {
    if (!tokens.has(email)) tokens.set(email, await login(email));
    return tokens.get(email);
  }

  return {
    base, call, login, as, config, pool, ownerPool, db,
    async close() {
      await new Promise((r) => server.close(r));
      await pool.end();
      await ownerPool.end();
      await db.drop();
      fs.rmSync(storageDir, { recursive: true, force: true });
    },
  };
}
