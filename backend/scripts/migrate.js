// npm run migrate : applique les migrations avec le rôle propriétaire.
import { migrate } from '../src/db/migrate.js';

const url = process.env.DATABASE_MIGRATION_URL;
if (!url) {
  console.error('DATABASE_MIGRATION_URL est obligatoire (rôle trivalink_owner)');
  process.exit(1);
}
const applied = await migrate(url, { log: console.log });
console.log(applied.length ? `${applied.length} migration(s) appliquée(s)` : 'Schéma à jour');
