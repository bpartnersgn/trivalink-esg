# 11 · Installation et environnement de développement

## 1. Prérequis

| Outil | Version | Pourquoi |
|---|---|---|
| **Node.js** | **≥ 22.13** (testé en 22.22) | `node:sqlite` intégré (aucune base à installer), `node:test`, `fetch` natif |
| npm | celui livré avec Node | |
| Git | récent | |
| Éditeur | VS Code, Cursor, ou autre | Extensions conseillées : ESLint, Prettier, SQLite Viewer, Mermaid preview |
| Assistant IA (optionnel) | Claude Code, Cursor, Copilot | Voir 15-guide-vibe-coding.md et `CLAUDE.md` |

Vérifier : `node -v` → `v22.13.0` ou plus. Avec nvm : `nvm install 22 && nvm use 22`.

## 2. Installer et lancer

Depuis `trivalink/app/` :

```bash
npm run setup     # npm install dans server/ puis web/
npm run build     # compile l'interface dans web/dist
npm start         # API + interface sur http://localhost:3000
npm test          # 6 tests d'API (≈ 3 s)
```

Au premier démarrage, la base `data/trivalink.db` et le dossier `data/evidence/` sont créés et la **démonstration** est chargée. Le serveur affiche :

```
Données de démonstration créées (mot de passe des comptes : demo1234).
TRIVALINK démarré sur http://localhost:3000
```

### Mode développement (rechargement à chaud du front)

```bash
# terminal 1
npm run dev:api          # API sur :3000 (redémarrer à la main après un changement serveur,
                         # ou : cd server && node --watch --disable-warning=ExperimentalWarning src/server.js)
# terminal 2
npm run dev:web          # Vite sur :5173, proxy /api → :3000
```

Ouvrir http://localhost:5173.

## 3. Scripts

| Script (racine `app/`) | Effet |
|---|---|
| `setup` | Installe les dépendances serveur et web |
| `build` | `vite build` → `web/dist` |
| `start` / `dev:api` | `node src/server.js` (serveur + statiques si `web/dist` existe) |
| `dev:web` | Vite en mode dev |
| `test` | `node --test test/*.test.js` dans `server/` |
| `reset-demo` | Supprime `data/` ; le prochain `npm start` recrée la démo |

## 4. Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `3000` | Port HTTP |
| `TRIVALINK_DATA_DIR` | `app/data` | Dossier de la base SQLite et des preuves |
| `TRIVALINK_STORAGE_KEY` | `trivalink-dev-only-key-change-me` | Secret dont dérive la clé AES-256 des preuves. **Changer en production. Le changer sur une base existante rend les preuves illisibles.** |
| `TRIVALINK_SEED` | (actif) | `0` pour ne pas créer la démonstration |

Exemple de fichier `.env` (non lu automatiquement : utiliser `node --env-file=.env src/server.js`) :

```dotenv
PORT=3000
TRIVALINK_DATA_DIR=./data
TRIVALINK_STORAGE_KEY=remplacer-par-un-secret-long-et-aleatoire
TRIVALINK_SEED=1
```

## 5. Comptes de démonstration

Mot de passe commun : `demo1234`. Organisation fictive **Kalaya Mining Group** (Guinée) :

```
Kalaya Mining Group (GRP, groupe)
├── Kalaya Bauxite SA (KBX, filiale)
│   ├── Site de Boké-Nord (BKN, site)
│   └── Terminal portuaire de Kamsar (KMS, site)
└── Kalaya Gold SARL (KAU, filiale)
    └── Site aurifère de Siguiri-Est (SGE, site)
```

| E-mail | Nom (fictif) | Rôle | Périmètre | Pour tester |
|---|---|---|---|---|
| `rse@kalaya.demo` | Fatoumata Bah | Responsable ESG | Groupe | Pilotage, validation niveau 2, rapports |
| `hse@kalaya.demo` | Ibrahima Sow | Responsable ESG | Groupe | Second valideur (revue niveau 1) |
| `site.boke@kalaya.demo` | Mariama Barry | Contributeur | Boké-Nord | Saisie de site |
| `site.kamsar@kalaya.demo` | Lansana Kouyaté | Contributeur | Kamsar | Saisie de site |
| `site.siguiri@kalaya.demo` | Ousmane Keita | Contributeur | Siguiri-Est | Saisie T3 non commencée, hors ligne |
| `env.bauxite@kalaya.demo` | Kadiatou Sylla | Responsable d'action | Kalaya Bauxite | Mise à jour d'actions |
| `dg@kalaya.demo` | Thierno Baldé | Direction | Groupe | Lecture, tableau de bord |
| `auditeur@cabinet-es.demo` | Claire Martin | Auditeur | Groupe, expire dans 60 jours | Lecture, preuves, journal |
| `admin@kalaya.demo` | Mamadou Camara | Administrateur | Groupe | Utilisateurs, entités, seuils |
| `admin@sil.demo` | Awa Kone | Administrateur d'un **autre client** (SIL, Côte d'Ivoire) | — | Preuve d'isolation |

Données : T1 et T2 2026 validés (avec preuves), T3 en cours, obligations ESAP, risques, écarts, actions, griefs, programmes, politiques, engagements et objectifs. Voir 09 §4 pour le scénario.

### Parcours de démo en 10 minutes

1. `site.boke@…` → Collecte › Mes saisies : statut soumis, MES à 78 mg/L hors seuil.
2. `hse@…` → Collecte › À valider : revoir une donnée de Boké (niveau 1).
3. `rse@…` → valider la même donnée (niveau 2) ; essayer de revoir puis valider soi-même une autre donnée : refus.
4. `rse@…` → Risques et conformité › Écarts : l'écart MES et son action ; essayer de clore l'écart : refus.
5. `rse@…` → Tableau de bord groupe, puis filiale, puis site ; changer de période.
6. `rse@…` → Rapports › IFC › T2 2026 › PDF : vérifier l'empreinte en pied de page.
7. `site.siguiri@…` → couper le réseau (DevTools › Network › Offline), saisir E11 avec une preuve, soumettre → bandeau hors ligne ; rétablir → synchronisation.
8. `auditeur@…` → Journal d'audit › Vérifier la chaîne ; télécharger une preuve.
9. `admin@sil.demo` → aucune donnée Kalaya visible.

## 6. Explorer la base

```bash
sqlite3 data/trivalink.db   # si sqlite3 est installé
.tables
SELECT code, name_fr, threshold_max FROM indicators WHERE org_id = 1 AND domain = 'E';
SELECT status, COUNT(*) FROM datapoints WHERE org_id = 1 AND period = '2026-Q3' GROUP BY status;
SELECT id, at, user_name, action, object_type, object_id FROM audit_log WHERE org_id = 1 ORDER BY id DESC LIMIT 20;
```

⚠️ Ne jamais modifier `audit_log` à la main : les triggers l'interdisent, et la vérification de chaîne échouerait.

Les fichiers de `data/evidence/` sont chiffrés : les lire via l'API (`GET /api/evidence/:id/download`).

## 7. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Cannot find module 'node:sqlite'` / `No such built-in module` | Node < 22.13 | Mettre à jour Node |
| `ExperimentalWarning: SQLite is an experimental feature` | Normal sur certaines versions | Les scripts passent déjà `--disable-warning=ExperimentalWarning` |
| `EADDRINUSE :3000` | Port occupé | `PORT=3001 npm start` |
| Page blanche sur :3000 | `web/dist` absent | `npm run build` |
| Toutes les requêtes en 401 après redémarrage | Base réinitialisée, jeton périmé | Se reconnecter (le front revient seul au login) |
| `Unsupported state or unable to authenticate data` au téléchargement d'une preuve | `TRIVALINK_STORAGE_KEY` changée | Remettre l'ancienne clé ou `npm run reset-demo` |
| Démo incohérente après des essais | | `npm run reset-demo && npm start` |
| `database is locked` | Deux serveurs sur le même `data/` | Un seul processus par dossier de données |

## 8. Captures de référence

`docs/captures/` : `02-contributeur-depassement.png`, `03-hors-ligne-file-attente.png`, `05-tableau-de-bord.png`, `07-action-creee.png`, `09-rapport-ifc.png`. Un changement d'interface qui les rend obsolètes doit les regénérer (Playwright, voir 13).
