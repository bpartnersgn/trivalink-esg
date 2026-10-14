# 00 · Brief de démarrage développeur · TRIVALINK ESG

| | |
|---|---|
| **Produit** | TRIVALINK ESG, *ESG Management Platform* |
| **Signature** | Structurer la responsabilité. Piloter la performance. |
| **Version du brief** | 1.0 · 13 octobre 2026 |
| **Code de référence** | `trivalink/app/` (MVP fonctionnel, 6 tests sur 6 au vert le 13/10/2026) |
| **Public** | Tout développeur, humain ou assistant IA, qui rejoint le projet |
| **Temps de lecture** | 20 minutes |

Ce brief est la **porte d'entrée unique**. Il vous dit ce qu'on construit, pour qui, avec quoi, quelles règles ne jamais enfreindre, et quoi faire pendant votre première semaine. Les détails sont dans les livrables 01 à 09 et dans le dossier `trivalink/docs-dev/`.

---

## 1. Le produit en une page

**TRIVALINK est une plateforme SaaS multi-clients de management ESG** (environnement, social, gouvernance). Elle permet à une organisation de structurer, suivre et améliorer sa performance ESG en centralisant ses **données, risques, obligations, actions et preuves**.

TRIVALINK **n'est pas un outil de reporting**. Le rapport est une sortie. La raison d'être est la boucle de management :

```
objectif  →  mesure  →  écart  →  action  →  résultat mesuré
                 (avec la preuve attachée à chaque chiffre)
```

**Client cible du MVP** : grandes entreprises, **sociétés minières** et groupes industriels, d'abord en **Guinée**, puis Côte d'Ivoire et Sénégal. Ils doivent rendre compte à leurs **prêteurs** (IFC, BAD, Proparco) selon les **Normes de performance IFC**, tenir un **plan d'action E&S (ESAP)**, publier selon **GRI** (dont GRI 14 secteur minier), et suivre leurs engagements envers les communautés riveraines.

**Pourquoi ils achètent** : aujourd'hui, le rapport prêteur se reconstruit à la main à partir de fichiers Excel de chaque site, les écarts d'audit vivent dans un autre tableur, et personne n'a de vue consolidée fiable. Une non-conformité non traitée peut **bloquer un décaissement**.

**Ce qu'on leur promet** : « Vos engagements ESG, vos risques et vos plans d'action pilotés au même endroit, avec la preuve prête pour vos prêteurs et auditeurs. »

### Les quatre piliers et leur traduction technique

| Pilier | Promesse | Ce que vous codez |
|---|---|---|
| Structurer | Engagements, objectifs, indicateurs reliés | `commitments`, `objectives`, `indicators` |
| Prouver | Chaque donnée a sa preuve, son validateur, son historique | `evidence` chiffrée, validation à 2 niveaux, `audit_log` chaîné |
| Maîtriser | Un écart déclenche une action suivie jusqu'au résultat | `incidents`, `obligations`, `risks`, `actions` |
| Piloter | Consolidation groupe → filiale → site, rapports multi-référentiels | `metrics.js`, `reporting.js` |

### Les utilisateurs (6 rôles)

| Rôle (code) | Qui | Ce qu'il fait |
|---|---|---|
| `org_admin` | Administrateur client | Entités, utilisateurs, accès auditeur |
| `esg_manager` | Directrice RSE / HSE | Campagnes, validation, risques, actions, rapports |
| `contributor` | Responsable HSE de site | Saisie, preuves, déclaration d'écarts, **souvent hors ligne** |
| `action_owner` | Porteur d'action | Met à jour ses actions |
| `executive` | DG, DAF | Lecture, tableaux de bord |
| `auditor` | Auditeur externe, chargé E&S du prêteur | Lecture, accès **limité dans le temps** |

---

## 2. Les 10 règles qu'on ne casse jamais

Elles sont la valeur du produit. Un auditeur ou un prêteur qui trouve une faille ici ne revient pas.

1. **Isolation entre clients** : toute requête SQL métier filtre `org_id = req.user.org_id`. L'`org_id` vient de la session, **jamais** de la requête. Un objet d'un autre client répond **404**.
2. **Périmètre** : un utilisateur rattaché à un site ne voit que ce site (et ses descendants). `assertInScope(req.scope, entity_id)` à chaque accès.
3. **Droits côté serveur** : `requireRole(...)`. Le front masque, le serveur décide.
4. **Tout est tracé** : chaque écriture appelle `audit()` avec avant/après. Le journal est en ajout seul et chaîné par SHA-256.
5. **Rien ne se supprime** : pas de `DELETE` métier ; une donnée validée et une action clôturée sont figées.
6. **Pas de donnée sans preuve** : la soumission exige une pièce justificative (si l'indicateur l'exige, ce qui est le cas par défaut).
7. **Trois personnes distinctes** saisissent, revoient et valident une donnée.
8. **Seules les données validées** sont consolidées, publiées et utilisées pour mesurer un résultat. Absence de donnée = `null`, jamais `0`.
9. **Tout écart mène à une action** ; un écart ne se clôt pas sans action terminée ; une action avec indicateur de résultat ne se clôt pas sans mesure validée postérieure.
10. **Bilingue FR/EN** partout ; textes d'interface en `t('…')`.

---

## 3. La pile technique

| Couche | Choix MVP | Cible production |
|---|---|---|
| Serveur | Node.js ≥ 22.13, Express 4, ESM | Identique (monolithe modulaire) |
| Base | SQLite intégré (`node:sqlite`) | PostgreSQL 16 managé + RLS |
| Fichiers de preuve | Disque local, AES-256-GCM | Stockage objet S3 compatible + KMS |
| Front | React 18 + Vite 5, sans autre dépendance | Identique, TypeScript progressif, PWA |
| Rapports | pdfkit (PDF), exceljs (Excel) | Identique + signature numérique |
| Tests | `node:test` + `fetch` | + Vitest, Playwright, tests de charge |
| Auth | Jeton opaque 12 h, scrypt | + MFA TOTP, SSO pour grands comptes |

**Architecture** : un seul processus, **un module par domaine fonctionnel** :

```
server/src/
  app.js, core.js, db.js, metrics.js, storage.js, catalog.js, seed.js
  modules/
    org.js         auth, entités, utilisateurs, politiques
    strategy.js    engagements, objectifs              (01 Strategy)
    collection.js  indicateurs, campagnes, données     (02-04 E/S/G)
    risk.js        risques, obligations, écarts, griefs, programmes (05)
    actions.js     plans d'action, résultat mesuré     (07 Actions)
    reporting.js   tableau de bord, rapports, journal  (06 Reporting)
web/src/
  App.jsx, api.js (dont file hors ligne), i18n.js, ui.jsx, pages/
```

Pourquoi un monolithe alors que le DAT d'origine décrit des microservices : voir livrable 06, ADR-001. Résumé : on sert 3 pilotes avec une petite équipe ; les modules préparent le découpage futur.

---

## 4. Démarrer en 10 minutes

```bash
cd trivalink/app
node -v                 # doit afficher v22.13 ou plus
npm run setup           # dépendances serveur et web
npm run build           # compile le front
npm start               # http://localhost:3000
npm test                # 6 tests, tous verts
```

Mode développement : `npm run dev:api` (port 3000) et `npm run dev:web` (port 5173, proxy `/api`).

Comptes de démonstration, mot de passe `demo1234` (organisation fictive Kalaya Mining Group, 3 sites en Guinée) :

| Compte | Rôle |
|---|---|
| `rse@kalaya.demo` | Responsable ESG (valideuse niveau 2) |
| `hse@kalaya.demo` | Responsable ESG (relecteur niveau 1) |
| `site.boke@kalaya.demo` | Contributeur, site de Boké-Nord |
| `site.siguiri@kalaya.demo` | Contributeur, site de Siguiri-Est |
| `env.bauxite@kalaya.demo` | Responsable d'action |
| `dg@kalaya.demo` | Direction |
| `auditeur@cabinet-es.demo` | Auditeur (accès qui expire) |
| `admin@kalaya.demo` | Administrateur |
| `admin@sil.demo` | Administrateur d'un **autre client** : ne doit rien voir de Kalaya |

`npm run reset-demo` puis `npm start` remet la démo à zéro.

---

## 5. Le scénario de référence (à connaître par cœur)

C'est ce que la démo commerciale montre et ce que le test `boucle complète` rejoue. **Toute PR doit le laisser fonctionnel.**

1. La responsable RSE lance la campagne trimestrielle ; chaque site reçoit ses indicateurs à fournir.
2. Le responsable HSE du site saisit ses valeurs, **même hors ligne**, joint une preuve, soumet.
3. Une valeur dépasse un seuil (matières en suspension > 50 mg/L) : **un écart est créé automatiquement**.
4. La responsable RSE crée une **action corrective** : responsable, échéance, budget, **indicateur de résultat** et cible.
5. Un second responsable revoit la donnée (niveau 1), la responsable RSE la valide (niveau 2).
6. Au trimestre suivant, la nouvelle mesure validée passe sous le seuil : l'action peut être clôturée, son résultat est **atteint**, l'écart peut être clos.
7. La responsable génère le **rapport de suivi E&S IFC** en PDF (avec empreinte SHA-256) et ouvre un **accès auditeur** pour 60 jours.

Faites-le à la main avec les comptes de démo pendant votre premier jour.

---

## 6. Comment on travaille

### Flux de développement

1. Prendre une story dans le backlog (livrable 02 §11 et `docs-dev/14-roadmap-backlog.md`).
2. Lire la spécification fonctionnelle concernée (livrable 03) et les règles (`docs-dev/06-regles-metier.md`, identifiants `RG-xx`).
3. Écrire d'abord les tests (`server/test/api.test.js`).
4. Implémenter selon l'anatomie de route : `h()` → `requireRole` → chargement par `id` + `org_id` + périmètre → validation → règle métier → écriture → `audit()` → réponse.
5. Front : composants de `ui.jsx`, textes en `t()` + traduction anglaise dans `i18n.js`.
6. `npm test` vert, vérification manuelle avec le bon rôle, un rôle refusé, l'autre client, en anglais, à largeur de tablette.
7. PR courte avec la checklist de revue, documentation mise à jour.

### Avec un assistant IA

- Copier `trivalink/docs-dev/CLAUDE.md` à la racine du dépôt (Claude Code le lit seul ; copies possibles pour Cursor et Copilot).
- Suivre `docs-dev/15-guide-vibe-coding.md` : plan avant code, tests d'abord, une intention par session, revue humaine obligatoire sur `core.js`, `db.js`, `storage.js`, `metrics.js`, `app.js`.
- Signaux d'alerte : `req.body.org_id`, une requête sans `org_id`, un `DELETE`, un changement de statut sans `audit()`, une consolidation qui inclut des données non validées, une assertion de test modifiée.

### Définition de « terminé »

- [ ] Critères d'acceptation de la story vérifiés.
- [ ] Tests ajoutés (nominal, rôle refusé, autre client, chaque règle) ; `npm test` vert.
- [ ] Isolation, périmètre, audit vérifiés (checklist livrable 04 §6).
- [ ] Interface en FR et EN, utilisable sur tablette.
- [ ] Livrables et `docs-dev/` à jour (données, API, règles).
- [ ] Revue par un pair approuvée.

---

## 7. Votre première semaine

| Jour | Objectif | Livrable de fin de journée |
|---|---|---|
| J1 | Installer, jouer le scénario de référence avec chaque rôle | Liste de 5 questions sur le produit |
| J2 | Lire 02 (PRD), 03 (SFD), 04 (rôles) ; lire `core.js`, `app.js`, `db.js` | Schéma du cycle de vie d'une donnée refait de mémoire |
| J3 | Lire `collection.js`, `actions.js`, `metrics.js`, le test `boucle complète` | Un test ajouté parmi la liste P0 du livrable 08 |
| J4 | Lire le front (`App.jsx`, `api.js`, `Collection.jsx`) ; tester le mode hors ligne | Un libellé ou un défaut d'interface corrigé |
| J5 | Première story « bonne première tâche » (ci-dessous) | PR ouverte |

**Bonnes premières tâches** (petites, utiles, sans risque) :
- Ajouter les tests manquants marqués P0 dans le livrable 08 (obligation conforme sans preuve, accès auditeur expiré, rejet avec motif).
- Ajouter la section NP6 (biodiversité, indicateurs E17 et E18) au rapport IFC.
- Permettre aux rôles en lecture seule d'enregistrer leur langue (`PATCH /me`).
- Restreindre les champs renvoyés par `GET /users` pour les rôles non administrateurs.

---

## 8. Ce qui manque avant le premier vrai client

Le MVP est démontrable, **pas encore exploitable avec des données réelles**. Les priorités P0 :

1. Base PostgreSQL et **migrations versionnées** (aucune migration aujourd'hui).
2. Clé de chiffrement des preuves obligatoire en production (une valeur par défaut existe aujourd'hui).
3. HTTPS, limitation des tentatives de connexion, en-têtes de sécurité.
4. Double authentification (MFA) pour les offres Entreprise et Institution.
5. Sauvegardes testées, supervision, intégration continue.
6. Invitations et réinitialisation de mot de passe par e-mail ; relances de collecte.

Détail dans le livrable 06 (DAT) et le livrable 02 (backlog).

---

## 9. Vocabulaire minimal

| Terme | Sens |
|---|---|
| Entité | Groupe, filiale ou site (arbre) |
| Campagne | Demande de collecte d'une période (trimestre `2026-Q3`) |
| Donnée | Valeur d'un indicateur pour une entité et une période |
| Écart | Incident, écart d'audit, non-conformité ou dépassement de seuil |
| Obligation | Exigence applicable (ESAP du prêteur, Code minier, permis) |
| ESAP | Plan d'action environnemental et social exigé par le prêteur |
| NP1 à NP8 | Normes de performance IFC |
| GRI | Référentiel international de reporting de durabilité |
| Consolidation | Agrégation des données validées d'un sous-arbre d'entités |
| Empreinte | Hachage SHA-256 qui prouve qu'un fichier ou un rapport n'a pas été modifié |

Glossaire complet : `docs-dev/02-glossaire.md`.

---

## 10. Où trouver quoi

| Besoin | Document |
|---|---|
| Liste de tous les livrables | 01 · Index des livrables |
| Pourquoi et pour qui | 02 · PRD |
| Comportement exact des écrans et règles | 03 · SFD du MVP |
| Qui peut faire quoi | 04 · Matrice des rôles et permissions |
| Tables et champs | 05 · Modèle et dictionnaire des données |
| Architecture, sécurité, déploiement, décisions | 06 · DAT détaillé |
| Les 44 indicateurs | 07 · Référentiel des indicateurs |
| Tests et recette | 08 · Plan de tests et de recette |
| Prix, coûts, budget | 09 · Budget et modèle économique |
| API route par route | `docs-dev/05-api-reference.md` |
| Front-end | `docs-dev/08-frontend.md` |
| Conventions et recettes de code | `docs-dev/12-conventions-code.md` |
| Travailler avec une IA | `docs-dev/15-guide-vibe-coding.md`, `docs-dev/CLAUDE.md` |
| Identité visuelle | `docs-dev/18-design-system.md` |

Note : les documents du dossier `knowledge/` (PRD, DAT, CdC) ont été écrits sous l'ancien nom **ORCHEA**. Seul **TRIVALINK** doit apparaître dans le code, l'interface et les documents produits.
