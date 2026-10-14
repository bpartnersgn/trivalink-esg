// Jeu de démonstration (développement et recette uniquement, jamais en production).
// Socle : organisations, hiérarchie d'entités et comptes des six rôles. Les données métier
// (indicateurs, campagnes, risques, actions) arriveront avec le portage des modules.
import { withTx } from './db/pool.js';
import { audit } from './core/audit.js';
import { hashPassword } from './core/passwords.js';

export const DEMO_PASSWORD = 'trivalink-demo-2026';

export async function seedDemo(ownerPool, { production = false } = {}) {
  if (production) throw new Error('Le jeu de démonstration ne peut pas être créé en production');
  const { rows: [{ n }] } = await ownerPool.query('SELECT count(*)::int AS n FROM organizations');
  if (n > 0) return false;
  const pw = await hashPassword(DEMO_PASSWORD);

  async function provision(name, build) {
    const { rows: [{ id: orgId }] } = await ownerPool.query('INSERT INTO organizations (name) VALUES ($1) RETURNING id', [name]);
    await withTx(ownerPool, async (q) => {
      const sys = { org_id: orgId, id: null, name: 'Initialisation' };
      await audit(q, sys, 'provision', 'organization', orgId, { name });
      const ent = async (parent, entName, code, type, country) => (await q.get(
        `INSERT INTO entities (org_id, parent_id, name, code, type, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        orgId, parent, entName, code, type, country)).id;
      const user = async (email, userName, role, scope = null, expires = null) => {
        const u = await q.get(`INSERT INTO users (org_id, email, name, password_hash, role, scope_entity_id, access_expires_at)
                               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`, orgId, email, userName, pw, role, scope, expires);
        await audit(q, sys, 'create', 'user', u.id, { after: { email, role, scope_entity_id: scope } });
        return u.id;
      };
      await build({ ent, user });
    }, { orgId });
    return orgId;
  }

  await provision('Kalaya Mining Group (démo)', async ({ ent, user }) => {
    const grp = await ent(null, 'Kalaya Mining Group', 'GRP', 'group', 'GN');
    const bx = await ent(grp, 'Kalaya Bauxite SA', 'KBX', 'subsidiary', 'GN');
    const boke = await ent(bx, 'Site de Boké-Nord', 'BKN', 'site', 'GN');
    const port = await ent(bx, 'Terminal portuaire de Kamsar', 'KMS', 'site', 'GN');
    const au = await ent(grp, 'Kalaya Gold SARL', 'KAU', 'subsidiary', 'GN');
    const sig = await ent(au, 'Site aurifère de Siguiri-Est', 'SGE', 'site', 'GN');
    await user('admin@kalaya.demo', 'Mamadou Camara', 'org_admin');
    await user('rse@kalaya.demo', 'Fatoumata Bah', 'esg_manager');
    await user('hse@kalaya.demo', 'Ibrahima Sow', 'esg_manager');
    await user('site.boke@kalaya.demo', 'Mariama Barry', 'contributor', boke);
    await user('site.kamsar@kalaya.demo', 'Lansana Kouyaté', 'contributor', port);
    await user('site.siguiri@kalaya.demo', 'Ousmane Keita', 'contributor', sig);
    await user('env.bauxite@kalaya.demo', 'Kadiatou Sylla', 'action_owner', bx);
    await user('dg@kalaya.demo', 'Thierno Baldé', 'executive');
    const expiry = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    await user('auditeur@cabinet-es.demo', 'Claire Martin (cabinet E&S)', 'auditor', null, expiry);
  });

  // Second client : sert à prouver l'isolation.
  await provision('Société Industrielle du Littoral (démo)', async ({ ent, user }) => {
    const g = await ent(null, 'SIL Groupe', 'GRP', 'group', 'CI');
    await ent(g, 'Usine d’Abidjan', 'ABJ', 'site', 'CI');
    await user('admin@sil.demo', 'Awa Kone', 'org_admin');
  });
  return true;
}
