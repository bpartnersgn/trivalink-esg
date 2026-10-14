// Configuration centralisée, validée au démarrage (TL-PROD-3).
// Toute variable d'environnement est lue ici et nulle part ailleurs.

export const DEV_STORAGE_KEY = 'trivalink-dev-only-key-change-me';

export class ConfigError extends Error {}

function int(v, def, name) {
  if (v == null || v === '') return def;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new ConfigError(`${name} doit être un entier positif`);
  return n;
}

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const production = nodeEnv === 'production';
  const errors = [];

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) errors.push('DATABASE_URL est obligatoire (rôle trivalink_app)');

  const storageKey = env.TRIVALINK_STORAGE_KEY || DEV_STORAGE_KEY;
  if (production && (storageKey === DEV_STORAGE_KEY || storageKey.length < 32)) {
    errors.push('TRIVALINK_STORAGE_KEY doit être défini (32 caractères minimum) en production');
  }

  const seed = env.TRIVALINK_SEED === '1';
  if (production && seed) errors.push('TRIVALINK_SEED=1 est interdit en production');

  const storageDriver = env.TRIVALINK_STORAGE_DRIVER || 'disk';
  if (storageDriver !== 'disk') errors.push(`TRIVALINK_STORAGE_DRIVER=${storageDriver} : seul "disk" est disponible (S3 : TL-PROD-2)`);

  let config;
  try {
    config = {
      env: nodeEnv,
      production,
      port: int(env.PORT, 3000, 'PORT'),
      databaseUrl,
      // Rôle propriétaire pour les migrations ; par défaut on ne migre pas au démarrage en production.
      migrationDatabaseUrl: env.DATABASE_MIGRATION_URL || null,
      migrateOnStart: env.TRIVALINK_MIGRATE_ON_START
        ? env.TRIVALINK_MIGRATE_ON_START === '1'
        : !production && Boolean(env.DATABASE_MIGRATION_URL),
      dbPoolMax: int(env.DATABASE_POOL_MAX, 10, 'DATABASE_POOL_MAX'),
      storageKey,
      storageDriver,
      storageDir: env.TRIVALINK_STORAGE_DIR || 'data/evidence',
      seed,
      trustProxy: env.TRUST_PROXY ? int(env.TRUST_PROXY, 1, 'TRUST_PROXY') : false,
      logLevel: env.LOG_LEVEL || (production ? 'info' : 'debug'),
      session: {
        idleSeconds: int(env.SESSION_IDLE_SECONDS, 2 * 3600, 'SESSION_IDLE_SECONDS'),
        absoluteSeconds: int(env.SESSION_ABSOLUTE_SECONDS, 12 * 3600, 'SESSION_ABSOLUTE_SECONDS'),
        mfaSeconds: 5 * 60,
      },
      login: {
        windowSeconds: int(env.LOGIN_WINDOW_SECONDS, 15 * 60, 'LOGIN_WINDOW_SECONDS'),
        maxFailuresPerAccount: int(env.LOGIN_MAX_FAILURES_ACCOUNT, 5, 'LOGIN_MAX_FAILURES_ACCOUNT'),
        // Plus large que par compte : un site minier sort souvent par une seule adresse IP.
        maxFailuresPerIp: int(env.LOGIN_MAX_FAILURES_IP, 20, 'LOGIN_MAX_FAILURES_IP'),
      },
      mfaIssuer: env.MFA_ISSUER || 'TRIVALINK ESG',
    };
  } catch (e) {
    if (e instanceof ConfigError) errors.push(e.message);
    else throw e;
  }

  if (errors.length) throw new ConfigError(`Configuration invalide :\n- ${errors.join('\n- ')}`);
  return Object.freeze(config);
}
