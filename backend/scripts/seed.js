// npm run seed : crée le jeu de démonstration (refusé en production).
import { createPool } from '../src/db/pool.js';
import { seedDemo, DEMO_PASSWORD } from '../src/seed.js';

const url = process.env.DATABASE_MIGRATION_URL;
if (!url) {
  console.error('DATABASE_MIGRATION_URL est obligatoire (rôle trivalink_owner)');
  process.exit(1);
}
const pool = createPool(url, { max: 2 });
try {
  const done = await seedDemo(pool, { production: process.env.NODE_ENV === 'production' });
  console.log(done ? `Démonstration créée. Mot de passe des comptes : ${DEMO_PASSWORD}` : 'Base déjà initialisée : rien à faire');
} finally {
  await pool.end();
}
