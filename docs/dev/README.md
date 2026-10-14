# TRIVALINK ESG · Documentation développeurs

**ESG MANAGEMENT PLATFORM** · *Structurer la responsabilité. Piloter la performance.*

Version de la documentation : 1.0 · 13 octobre 2026
Code de référence : `trivalink/app/` (MVP, monolithe modulaire Node.js + React)
Documents produit de référence : `trivalink/trivalink-product-foundation.md`, `strategie/plan-produit-marque.md`, `knowledge/` (PRD, DAT, CdC rédigés sous l'ancien nom ORCHEA)

Cette documentation est écrite pour une équipe qui développe TRIVALINK **avec des assistants de code IA** (Claude Code, Cursor, Copilot…). Chaque fichier est autonome, factuel et vérifié contre le code du MVP : un assistant peut en recevoir un seul en contexte et produire du code juste.

---

## Par où commencer

| Vous êtes… | Lisez dans cet ordre |
|---|---|
| Nouveau dans l'équipe | 01 → 03 → 11 → 06 → 15 |
| Développeur back-end | 03 → 04 → 05 → 06 → 07 → 12 |
| Développeur front-end | 08 → 05 → 18 → 12 |
| Product owner / chef de projet | 01 → 06 → 14 → 17 |
| DevOps / sécurité | 07 → 16 → 13 |
| Vous allez coder avec une IA | 15 → `CLAUDE.md` (à copier à la racine du dépôt) → la fiche du domaine concerné |

## Sommaire

| # | Fichier | Contenu |
|---|---|---|
| 01 | [01-vision-produit.md](01-vision-produit.md) | Problème, positionnement, segment d'entrée, personas, cas d'usage, principes produit, périmètre MVP |
| 02 | [02-glossaire.md](02-glossaire.md) | Vocabulaire métier ESG / IFC / GRI et correspondance avec les noms du code |
| 03 | [03-architecture.md](03-architecture.md) | Architecture du MVP (monolithe modulaire), flux d'une requête, architecture cible (DAT), trajectoire |
| 04 | [04-modele-de-donnees.md](04-modele-de-donnees.md) | Les 18 tables, colonnes, contraintes, diagramme entité-relation, cycles de vie des statuts |
| 05 | [05-api-reference.md](05-api-reference.md) | Les 55 routes REST : rôles, paramètres, corps, réponses, erreurs |
| 06 | [06-regles-metier.md](06-regles-metier.md) | Toutes les règles métier appliquées par le serveur, avec leur emplacement dans le code et leur test |
| 07 | [07-securite-multitenant.md](07-securite-multitenant.md) | Isolation des clients, rôles et périmètres, piste d'audit chaînée, chiffrement des preuves, écarts à combler |
| 08 | [08-frontend.md](08-frontend.md) | Application React : structure, routage, session, i18n, file hors ligne, composants, styles |
| 09 | [09-referentiel-indicateurs.md](09-referentiel-indicateurs.md) | Les 44 indicateurs, leurs correspondances GRI / IFC, seuils, agrégation |
| 10 | [10-reporting.md](10-reporting.md) | Tableau de bord consolidé, rapport IFC, index GRI, exports PDF / Excel, empreinte SHA-256 |
| 11 | [11-installation-dev.md](11-installation-dev.md) | Installer, lancer, comptes de démonstration, variables d'environnement, dépannage |
| 12 | [12-conventions-code.md](12-conventions-code.md) | Conventions, recettes « ajouter une route / une table / une page », checklists de revue |
| 13 | [13-tests-qualite.md](13-tests-qualite.md) | Tests existants, comment en écrire, plan de tests à ajouter, critères d'acceptation |
| 14 | [14-roadmap-backlog.md](14-roadmap-backlog.md) | Écarts MVP, backlog priorisé en user stories avec critères d'acceptation, phases 2 et 3 |
| 15 | [15-guide-vibe-coding.md](15-guide-vibe-coding.md) | Méthode de travail avec une IA, garde-fous, modèles de prompts prêts à l'emploi |
| 16 | [16-deploiement-production.md](16-deploiement-production.md) | Passage en production : PostgreSQL, stockage objet, secrets, sauvegardes, supervision |
| 17 | [17-decisions-architecture.md](17-decisions-architecture.md) | Registre des décisions (ADR) déjà prises et décisions ouvertes |
| 18 | [18-design-system.md](18-design-system.md) | Identité visuelle, jetons CSS, composants, règles UX terrain et accessibilité |
| — | [CLAUDE.md](CLAUDE.md) | Fichier d'instructions à placer à la racine du dépôt pour les assistants IA |

## TRIVALINK en 60 secondes

TRIVALINK est une **plateforme de management ESG** multi-clients (SaaS). Elle ne se contente pas de produire un rapport : elle relie dans un même système

```
stratégie → données → risques → conformité → actions correctives → mesure de la performance
```

La boucle centrale, que tout le code sert, est : **objectif → mesure → écart → action → résultat mesuré**, avec **la preuve attachée à chaque chiffre**.

Le segment d'entrée retenu : **grandes entreprises, mines et groupes industriels**, d'abord en Guinée, puis Côte d'Ivoire et Sénégal. Les référentiels prioritaires : **Normes de performance IFC**, **GRI (dont GRI 14 secteur minier)**, plans d'action E&S des prêteurs (**ESAP**).

Le MVP couvre les 7 domaines fonctionnels :

| # | Domaine | Module serveur |
|---|---|---|
| 01 | Strategy | `modules/strategy.js` |
| 02-04 | Environment / Social / Governance | `modules/collection.js` (+ `org.js` pour les politiques, `risk.js` pour griefs et programmes) |
| 05 | Risk & Compliance | `modules/risk.js` |
| 06 | Reporting | `modules/reporting.js` |
| 07 | Actions | `modules/actions.js` |
| — | Socle (organisation, rôles, audit) | `core.js`, `db.js`, `storage.js`, `metrics.js`, `modules/org.js` |

## État du code au 13 octobre 2026

- 6 tests d'API de bout en bout, **6/6 au vert** (exécutés le 13/10/2026 avec Node 22.22).
- Démarrage local en 3 commandes, aucune base à installer (SQLite intégré à Node ≥ 22.13).
- Choix assumés pour aller vite, **à lever avant la production** (voir 07 et 16) : SQLite au lieu de PostgreSQL, pas de MFA, preuves sur disque local, pas d'e-mails de relance, pas de limitation de débit.

## Règles d'or (à rappeler à toute IA qui touche au code)

1. **Toute requête SQL métier filtre sur `org_id = req.user.org_id`.** L'organisation vient de la session, jamais du client.
2. **Tout objet rattaché à une entité passe par `assertInScope(req.scope, entity_id)`** ou un filtre `req.scope.has(...)`.
3. **Toute écriture appelle `audit(...)`.** La table `audit_log` est en ajout seul (triggers).
4. **Seules les données `validated` sont consolidées et publiées.**
5. **Une règle métier vit dans le serveur**, l'interface ne fait que la refléter.
6. **Chaque nouvelle règle a son test** dans `server/test/`.
7. **Tout texte affiché est en français dans le code et traduit dans `web/src/i18n.js`.**

## Conventions de cette documentation

- Les chemins sont relatifs à `trivalink/app/` sauf mention contraire.
- `fichier.js:NN` renvoie à une ligne du code au 13/10/2026 ; les numéros peuvent dériver, la fonction citée fait foi.
- **[MVP]** = existe dans le code. **[À FAIRE]** = prévu mais absent. **[CIBLE]** = architecture visée à 12-24 mois.
- Les montants et volumes commerciaux sont des hypothèses de travail, pas des chiffres vérifiés.
- Le nom ORCHEA, présent dans les documents `knowledge/`, désigne l'ancien nom du produit. Seul TRIVALINK doit apparaître dans le code et l'interface.
