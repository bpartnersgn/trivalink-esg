# 17 · Registre des décisions d'architecture (ADR)

Format court : contexte, décision, conséquences, statut. Une nouvelle décision structurante (dépendance majeure, changement de base, découpage en services, nouveau framework) **doit** ajouter un ADR ici avant d'être implémentée. Un assistant IA ne doit pas contredire un ADR « Acceptée » sans qu'un nouvel ADR le remplace.

| # | Décision | Statut |
|---|---|---|
| 001 | Monolithe modulaire organisé par domaine | Acceptée |
| 002 | Isolation multi-tenant logique par `org_id` | Acceptée (évolution prévue : RLS, puis hybride) |
| 003 | SQLite intégré à Node pour le MVP | Acceptée, temporaire |
| 004 | Piste d'audit chaînée par SHA-256 et en ajout seul | Acceptée |
| 005 | Preuves chiffrées AES-256-GCM hors base | Acceptée |
| 006 | Validation à deux niveaux par trois personnes distinctes | Acceptée |
| 007 | Schéma idempotent sans migrations | Acceptée, **à remplacer avant le premier client** |
| 008 | Front React sans framework de routage, d'état ni de composants | Acceptée |
| 009 | Bilinguisme avec le français comme clé | Acceptée, à revoir au-delà de ~500 libellés |
| 010 | File hors ligne côté navigateur pour la saisie | Acceptée |
| 011 | Rapports calculés à la volée avec empreinte | Acceptée |
| 012 | Référentiel d'indicateurs copié par organisation | Acceptée |
| 013 | Période trimestrielle unique | Acceptée, à étendre |
| 014 | JavaScript sans TypeScript dans le MVP | Acceptée, à revoir |
| 015 | Choix de PostgreSQL pour la production | Proposée |
| 016 | Hébergement des pilotes | Ouverte |

---

### ADR-001 · Monolithe modulaire organisé par domaine
**Contexte.** Le DAT et le CdC décrivent des microservices sur Kubernetes. Le PRD cite « complexité excessive du MVP » comme premier risque ; l'équipe est petite ; le MVP sert 3 pilotes.
**Décision.** Un seul processus Node ; un module par domaine fonctionnel (`modules/*.js`) ; socle partagé (`core.js`, `metrics.js`) ; dépendances entre modules limitées à des fonctions exportées.
**Conséquences.** Déploiement et transactions simples ; vitesse de développement. Le découpage futur suivra les frontières de modules. Extraire un service exige un nouvel ADR (déclencheurs : charge, équipe > 8 personnes, besoin d'un langage différent comme Python pour l'IA).

### ADR-002 · Isolation multi-tenant logique par `org_id`
**Contexte.** Exigence : « zéro fuite multi-tenant », « isolation prouvée ». Le DAT recommande une architecture hybride (logique pour PME, base dédiée pour grands comptes).
**Décision.** Toutes les tables métier portent `org_id` ; l'organisation vient de la session ; filtrage dans chaque requête ; test d'isolation dédié.
**Conséquences.** Coût faible ; risque d'oubli d'un filtre → checklist de revue, test de balayage à ajouter, puis **RLS PostgreSQL** en défense en profondeur. Base dédiée possible plus tard pour l'offre Institution.

### ADR-003 · SQLite intégré à Node pour le MVP
**Contexte.** Démarrer en 3 commandes, sans serveur de base, y compris sur un poste de démonstration.
**Décision.** `node:sqlite` (`DatabaseSync`), WAL, clés étrangères, schéma écrit pour être portable vers PostgreSQL.
**Conséquences.** Une seule instance ; accès synchrone (le portage vers un pilote asynchrone touchera toutes les fonctions d'accès) ; fonctionnalité marquée expérimentale dans Node. Remplacé en production par PostgreSQL (ADR-015).

### ADR-004 · Piste d'audit chaînée et en ajout seul
**Contexte.** CdC : « journal audit infalsifiable », « logs immuables » ; promesse « Prouver ».
**Décision.** Table `audit_log` ; chaque ligne contient le hash de la précédente (par organisation) ; triggers interdisant `UPDATE`/`DELETE` ; route de vérification.
**Conséquences.** Détection de toute altération intermédiaire ; écriture séquentielle par organisation (à sérialiser explicitement en PostgreSQL) ; ancrage externe à ajouter pour couvrir la réécriture complète de la fin de chaîne.

### ADR-005 · Preuves chiffrées hors base
**Contexte.** CdC : stockage documentaire chiffré AES-256 et versionné.
**Décision.** Fichier haché (SHA-256 du clair) puis chiffré AES-256-GCM (IV aléatoire), stocké par organisation ; métadonnées en base ; pas de suppression.
**Conséquences.** Clé unique dérivée d'une variable d'environnement dans le MVP → KMS et clé par organisation en production ; stockage objet S3 compatible.

### ADR-006 · Validation à deux niveaux par trois personnes distinctes
**Contexte.** PRD : « validation hiérarchique » ; plan produit : « circuit de validation à deux niveaux » ; exigence d'auditeurs : séparation des tâches.
**Décision.** `submitted → reviewed → validated` ; relecteur ≠ contributeur ; validateur ≠ contributeur et ≠ relecteur.
**Conséquences.** Un client doit avoir au moins deux valideurs. Option future : paramétrage par organisation (un niveau pour l'offre Essentiel) via un nouvel ADR.

### ADR-007 · Schéma idempotent sans migrations
**Contexte.** Itérations rapides sur une base de démonstration recréable.
**Décision.** `CREATE TABLE IF NOT EXISTS` au démarrage ; réinitialisation par `npm run reset-demo`.
**Conséquences.** Impossible de faire évoluer une table contenant des données client. **À remplacer par des migrations versionnées avant tout client réel** (TL-PROD-1).

### ADR-008 · Front React minimal
**Contexte.** Lisibilité totale par l'équipe et par les assistants IA ; peu d'écrans.
**Décision.** React 18 + Vite ; routage par hash maison ; contexte React pour la session et la langue ; composants maison (`ui.jsx`) ; CSS à variables.
**Conséquences.** Aucune dépendance front hors React. À reconsidérer (React Router, TanStack Query) si le nombre d'écrans ou la complexité des données en cache augmente fortement. Next.js non retenu (pas de besoin de rendu serveur).

### ADR-009 · Bilinguisme, le français comme clé
**Décision.** `t('texte français')` ; dictionnaire EN ; données métier bilingues en base (`name_fr`, `name_en`).
**Conséquences.** Écriture rapide, repli lisible. Risque de clés orphelines au-delà de ~500 libellés → passage à des clés neutres et à un test de complétude.

### ADR-010 · File hors ligne côté navigateur
**Contexte.** Sites miniers à connectivité faible.
**Décision.** Saisie, preuve et soumission mises en file dans `localStorage`, rejouées dans l'ordre au retour du réseau ; le serveur reste l'arbitre des règles.
**Conséquences.** Limite de taille (3 Mo par preuve en file) ; lectures non disponibles hors ligne. Évolution : PWA + IndexedDB (TL-COLL-5).

### ADR-011 · Rapports calculés à la volée avec empreinte
**Décision.** Pas de stockage des rapports ; génération depuis les données validées ; empreinte SHA-256 du contenu (hors date) ; journalisation.
**Conséquences.** Reproductibilité ; une correction de donnée validée (TL-COLL-2) changera l'empreinte des rapports suivants, ce qui est voulu. Archivage des rapports diffusés à envisager pour la signature numérique.

### ADR-012 · Référentiel d'indicateurs copié par organisation
**Décision.** `installCatalog` copie les 44 indicateurs dans chaque organisation ; chaque client ajuste seuils et activation.
**Conséquences.** Personnalisation simple ; la mise à jour du catalogue maître exige une migration pour les organisations existantes. Évolution : catalogue maître versionné + surcharges par client.

### ADR-013 · Période trimestrielle unique
**Décision.** Format `AAAA-Qn`, comparable lexicographiquement.
**Conséquences.** Simple et suffisant pour les rapports prêteurs trimestriels ; extension mensuelle et annuelle prévue (TL-COLL-7) en conservant l'ordre lexicographique.

### ADR-014 · JavaScript sans TypeScript dans le MVP
**Contexte.** Le CdC recommande TypeScript.
**Décision.** JavaScript ESM pour la vitesse du MVP.
**Conséquences.** Migration progressive recommandée (`// @ts-check` + JSDoc, puis `.ts`), en commençant par `core.js`, `metrics.js` et les types d'API générés depuis OpenAPI.

### ADR-015 · PostgreSQL pour la production (proposée)
**Contexte.** CdC et DAT : PostgreSQL, partitionnement par tenant, RLS possible.
**Proposition.** PostgreSQL 16 managé ; types `numeric`, `timestamptz`, `boolean` ; RLS sur `org_id` ; verrou consultatif par organisation pour la chaîne d'audit ; migrations versionnées ; pilote `pg`.
**À décider.** Conserver SQLite pour le développement local ou utiliser PostgreSQL partout (Docker Compose).

### ADR-016 · Hébergement des pilotes (ouverte)
Voir 16 §8 : cloud international, régional ou hybride. Dépend des pilotes, de la loi guinéenne sur les données personnelles et des exigences des clients publics.
