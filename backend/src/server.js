// Point d'entrée : configuration, migrations éventuelles, API.
import { loadConfig } from './config.js';
import { createLogger } from './core/logger.js';
import { createPool } from './db/pool.js';
import { migrate } from './db/migrate.js';
import { createStorage } from './storage/index.js';
import { createApp } from './app.js';
import { seedDemo, DEMO_PASSWORD } from './seed.js';

let config;
try {
  config = loadConfig();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const log = createLogger(config.logLevel);

if (config.migrateOnStart) {
  if (!config.migrationDatabaseUrl) throw new Error('DATABASE_MIGRATION_URL requis pour migrer au démarrage');
  await migrate(config.migrationDatabaseUrl, { log: (m) => log.info(m) });
}
if (config.seed) {
  const ownerPool = createPool(config.migrationDatabaseUrl ?? config.databaseUrl, { max: 2 });
  if (await seedDemo(ownerPool, config)) log.info('demo_seeded', { password: DEMO_PASSWORD });
  await ownerPool.end();
}

const pool = createPool(config.databaseUrl, { max: config.dbPoolMax });
const storage = createStorage(config);
const app = createApp({ config, pool, storage, log });

// Purge horaire des sessions expirées.
const purge = setInterval(() => {
  pool.query('SELECT app_purge_sessions($1) AS n', [config.session.idleSeconds])
    .then(({ rows }) => rows[0].n && log.info('sessions_purged', { count: rows[0].n }))
    .catch((err) => log.error('sessions_purge_failed', { err }));
}, 3600 * 1000);
purge.unref();

const server = app.listen(config.port, () => log.info('started', { port: config.port, env: config.env }));

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    log.info('stopping', { signal: sig });
    server.close(() => pool.end().then(() => process.exit(0)));
  });
}
