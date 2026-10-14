# 04 · Matrice des rôles et permissions · TRIVALINK ESG

| | |
|---|---|
| **Version** | 1.0 · 13 octobre 2026 |
| **Statut** | Rédigé, reflète le code du MVP au 13/10/2026 |
| **Source de vérité** | `app/server/src/core.js` (`requireRole`, `MANAGERS`, `READ_ONLY`, `scopeEntityIds`, `assertInScope`), modules `app/server/src/modules/*.js`, navigation `app/web/src/App.jsx` (`NAV`) |
| **Documents liés** | 02 PRD (EF-SOC-xx), 03 SFD (SF-xxx), 06 DAT §Sécurité, 08 Plan de tests (TC-SEC-xx), `docs-dev/05-api-reference.md`, `docs-dev/07-securite-multitenant.md` |

Ce document dit **qui peut faire quoi, sur quel périmètre, et pourquoi**. Il est la référence pour le développement (chaque route doit s'y conformer), pour les tests (chaque cellule ✅/❌ est un cas de test), et pour les clients (il répond à la question « qui voit nos données ? » posée par tout service conformité ou prêteur).

---

## 1. Principes

Les droits de TRIVALINK combinent **quatre contrôles**, appliqués dans cet ordre à chaque requête :

| # | Contrôle | Question | Où dans le code | Réponse si refus |
|---|---|---|---|---|
| 1 | **Authentification** | La session est-elle valide, l'utilisateur actif, l'accès non expiré ? | `core.js` `authenticate` (jeton 12 h, `active`, `access_expires_at`) | 401 |
| 2 | **Organisation (client)** | L'objet appartient-il au même client que l'utilisateur ? | Filtre `org_id = req.user.org_id` dans toutes les requêtes | 404 (on ne révèle pas l'existence) |
| 3 | **Rôle** | Le rôle autorise-t-il cette action ? | `requireRole(user, roles)`, règle globale de lecture seule | 403 |
| 4 | **Périmètre** | L'objet est-il rattaché à une entité du périmètre de l'utilisateur ? | `scopeEntityIds` → `req.scope`, `assertInScope(req.scope, entity_id)` | 404 |

S'y ajoutent deux **contrôles métier** qui ne dépendent pas seulement du rôle :

- **Séparation des tâches** : une même donnée est saisie, revue et validée par trois personnes distinctes (403).
- **Propriété** : le responsable d'une action peut la mettre à jour même si son rôle ne l'y autorise pas en général.

Règles invariantes :

1. **Le client (org_id) vient toujours de la session**, jamais du corps, de l'URL ou d'un en-tête.
2. **Le moindre privilège** : un compte est créé avec le rôle le plus faible qui permet sa mission et le périmètre le plus étroit.
3. **Hors périmètre = inexistant** : on répond 404 et non 403, pour ne pas confirmer l'existence d'un objet.
4. **Toute écriture est tracée** dans le journal d'audit chaîné, avec l'auteur ; les lectures sensibles (téléchargement de preuve, génération de rapport, connexion) aussi.
5. **L'interface reflète les droits, le serveur les impose.** Masquer un bouton n'est jamais une protection.

## 2. Les six rôles

| Code | Rôle (interface) | Mission | Profil type chez le client | Écriture | Périmètre usuel |
|---|---|---|---|---|---|
| `org_admin` (A) | Administrateur | Paramétrer l'organisation : entités, utilisateurs, accès auditeur. Dispose aussi de tous les droits du responsable ESG | DSI, directeur RSE/HSE groupe | Oui | Toute l'organisation |
| `esg_manager` (M) | Responsable ESG | Piloter la démarche : campagnes, revue et validation, risques, obligations, écarts, actions, rapports, seuils | Responsable RSE/E&S/HSE groupe ou filiale | Oui | Organisation ou filiale |
| `contributor` (C) | Contributeur | Fournir les données et leurs preuves, déclarer écarts et griefs | Responsable environnement d'un site, chef de service, agent de terrain | Oui (limitée) | Un site |
| `action_owner` (O) | Responsable d'action | Faire avancer les actions qui lui sont confiées, y joindre les preuves | Chef de projet, responsable maintenance, ingénieur | Ses actions uniquement | Filiale ou site |
| `executive` (E) | Direction | Consulter la performance, les rapports, le journal | DG, comité de direction, administrateur du conseil | **Non** | Toute l'organisation |
| `auditor` (Au) | Auditeur externe | Vérifier les chiffres et leurs preuves, sur une durée limitée | Cabinet E&S mandaté par un prêteur, auditeur interne | **Non** | Tout ou partie, **avec date d'expiration** |

Constantes du code (`core.js`) : `MANAGERS = ['org_admin', 'esg_manager']`, `READ_ONLY = ['executive', 'auditor']`.

### 2.1 Règle globale de lecture seule

Pour `executive` et `auditor`, **toute méthode autre que `GET` est refusée (403 « Accès en lecture seule »)**, à la seule exception de `POST /auth/logout`. Cette règle est appliquée par un middleware global, avant même la route : elle protège contre l'oubli d'un `requireRole` sur une nouvelle route.

Effet de bord connu : `PATCH /me` (choix de la langue) est aussi bloqué pour ces deux rôles. L'interface conserve la langue dans le navigateur. [À FAIRE] autoriser explicitement `PATCH /me` pour la langue.

### 2.2 Rôle manquant : opérateur TRIVALINK [À FAIRE]

Le MVP n'a pas de rôle « support TRIVALINK ». Cible : une console d'exploitation séparée de l'application client, qui provisionne les organisations sans **aucun accès aux données** du client, sauf accès d'urgence (« break-glass ») demandé, justifié, limité dans le temps, et visible du client dans son propre journal d'audit.

## 3. Périmètres

### 3.1 Définition

Le périmètre d'un utilisateur est fixé par `users.scope_entity_id` :

- `NULL` : **toute l'organisation** ;
- un identifiant d'entité : **cette entité et toutes ses descendantes** (calculées récursivement à chaque requête par `scopeEntityIds`).

Hiérarchie des entités : `group` → `subsidiary` → `site`. Un site n'a jamais d'enfant.

### 3.2 Exemple avec l'organisation de démonstration

```
Kalaya Mining Group (GRP)
├── Kalaya Bauxite SA (KBX)
│   ├── Site de Boké-Nord (BKN)
│   └── Terminal portuaire de Kamsar (KMS)
└── Kalaya Gold SARL (KAU)
    └── Site aurifère de Siguiri-Est (SGE)
```

| Compte de démo | Rôle | Périmètre | Entités visibles |
|---|---|---|---|
| admin@kalaya.demo (Mamadou Camara) | org_admin | Organisation | GRP, KBX, BKN, KMS, KAU, SGE |
| rse@kalaya.demo (Fatoumata Bah) | esg_manager | Organisation | Toutes |
| hse@kalaya.demo (Ibrahima Sow) | esg_manager | Organisation | Toutes |
| site.boke@kalaya.demo (Mariama Barry) | contributor | BKN | BKN |
| site.kamsar@kalaya.demo (Lansana Kouyaté) | contributor | KMS | KMS |
| site.siguiri@kalaya.demo (Ousmane Keita) | contributor | SGE | SGE |
| env.bauxite@kalaya.demo (Kadiatou Sylla) | action_owner | KBX | KBX, BKN, KMS |
| dg@kalaya.demo (Thierno Baldé) | executive | Organisation | Toutes |
| auditeur@cabinet-es.demo (Claire Martin) | auditor | Organisation, expire à J+60 | Toutes, jusqu'à l'expiration |
| admin@sil.demo (Awa Kone) | org_admin | Autre client (SIL) | Aucune entité Kalaya |

Mot de passe de tous les comptes de démonstration : `demo1234` (à ne jamais activer en production).

### 3.3 Ce que le périmètre filtre

| Objet | Rattachement | Filtré par périmètre |
|---|---|---|
| Entités | elles-mêmes | Oui |
| Données (datapoints), preuves de données | `entity_id` | Oui |
| Objectifs | `entity_id` | Oui (les engagements sont affichés avec les seuls objectifs du périmètre) |
| Risques, obligations, écarts, griefs, programmes | `entity_id` | Oui |
| Actions et leurs preuves | `entity_id` | Oui |
| Campagnes | organisation | Non, mais les **compteurs** sont calculés sur le périmètre |
| Indicateurs (catalogue) | organisation | Non (catalogue commun) |
| Politiques, engagements | organisation | Non (niveau groupe) |
| Utilisateurs (`GET /users`) | organisation | **Non** (écart connu, voir §8) |
| Journal d'audit | objet tracé | Oui pour un utilisateur à périmètre restreint ; les événements sans entité (connexion, rapport) lui sont masqués |
| Tableau de bord et rapports | entité demandée | Oui : l'entité demandée doit être dans le périmètre, la consolidation porte sur ses descendantes |

### 3.4 Règles de création de compte liées au périmètre

- Un administrateur ne peut donner qu'un périmètre **inclus dans le sien**.
- Un **auditeur doit avoir une date d'expiration** (`access_expires_at`), sinon 400. Le lendemain de cette date, toute requête renvoie 401 « Votre accès a expiré ».
- Un administrateur ne peut **ni se désactiver, ni se retirer le rôle `org_admin`** (protection contre l'organisation sans administrateur).
- La désactivation d'un compte (`active = 0`) **supprime immédiatement toutes ses sessions**.
- Un e-mail est unique sur toute la plateforme, tous clients confondus (409 sinon).

## 4. Matrice des permissions par fonction

Légende : ✅ autorisé · ❌ refusé · 👁 lecture seule · **R** si responsable de l'action · **P** dans son périmètre seulement · — sans objet.
Chaque ligne porte un identifiant `P-xxx-nn`, repris par les cas de test du livrable 08.

### 4.1 Socle : authentification, organisation, utilisateurs (`modules/org.js`)

| ID | Permission | Route | A | M | C | O | E | Au |
|---|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| P-SOC-01 | Se connecter, se déconnecter | `POST /auth/login`, `/auth/logout` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (avant expiration) |
| P-SOC-02 | Consulter son profil et son périmètre | `GET /me` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| P-SOC-03 | Enregistrer sa langue côté serveur | `PATCH /me` | ✅ | ✅ | ✅ | ✅ | ❌ ¹ | ❌ ¹ |
| P-SOC-04 | Voir les entités | `GET /entities` | P | P | P | P | P | P |
| P-SOC-05 | Créer une entité | `POST /entities` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| P-SOC-06 | Lister les utilisateurs | `GET /users` | ✅ | ✅ | ✅ ² | ✅ ² | ✅ ² | ✅ ² |
| P-SOC-07 | Créer un utilisateur, donner un accès auditeur | `POST /users` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| P-SOC-08 | Changer le rôle, désactiver, prolonger un accès | `PATCH /users/:id` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| P-SOC-09 | Voir les politiques | `GET /policies` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| P-SOC-10 | Créer une politique | `POST /policies` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

¹ Effet de bord de la règle de lecture seule, à corriger. ² Écart connu : la liste complète (e-mails compris) est exposée ; à restreindre (§8).

### 4.2 Strategy (`modules/strategy.js`)

| ID | Permission | Route | A | M | C | O | E | Au |
|---|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| P-STR-01 | Voir les engagements et objectifs avec leur avancement | `GET /commitments` | P | P | P | P | P | P |
| P-STR-02 | Créer un engagement | `POST /commitments` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| P-STR-03 | Créer un objectif chiffré | `POST /objectives` | P | P | ❌ | ❌ | ❌ | ❌ |

Remarque : l'API autorise tous les rôles à lire `GET /commitments`, mais la page Stratégie n'est affichée qu'à A, M, E et Au. Le contributeur et le responsable d'action voient les objectifs à travers le tableau de bord.

### 4.3 Collecte : indicateurs, campagnes, données, preuves, import (`modules/collection.js`)

| ID | Permission | Route | A | M | C | O | E | Au |
|---|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| P-COL-01 | Voir le catalogue d'indicateurs | `GET /indicators` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| P-COL-02 | Modifier seuils, preuve obligatoire, activation d'un indicateur | `PATCH /indicators/:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| P-COL-03 | Lancer, ouvrir ou clore une campagne | `POST /campaigns`, `PATCH /campaigns/:id` | P | P | ❌ | ❌ | ❌ | ❌ |
| P-COL-04 | Saisir ou corriger une valeur (`requested`, `draft`, `rejected`) | `PATCH /datapoints/:id` | P | P | P | ❌ | ❌ | ❌ |
| P-COL-05 | **Soumettre** une donnée (preuve obligatoire si exigée) | `POST /datapoints/:id/submit` | P | P | P | ❌ | ❌ | ❌ |
| P-COL-06 | **Revoir** une donnée soumise (pas la sienne) | `POST /datapoints/:id/review` | P ³ | P ³ | ❌ | ❌ | ❌ | ❌ |
| P-COL-07 | **Valider** une donnée revue (ni contributeur ni relecteur) | `POST /datapoints/:id/validate` | P ³ | P ³ | ❌ | ❌ | ❌ | ❌ |
| P-COL-08 | Rejeter une donnée avec un motif | `POST /datapoints/:id/reject` | P | P | ❌ | ❌ | ❌ | ❌ |
| P-COL-09 | Importer un fichier CSV / Excel | `POST /import` | P | P | P | ❌ | ❌ | ❌ |
| P-COL-10 | Joindre une preuve à une donnée (avant soumission) | `POST /evidence` (datapoint) | P | P | P | ❌ | ❌ | ❌ |
| P-COL-11 | Consulter les données, leur historique et leurs preuves | `GET /datapoints`, `GET /datapoints/:id` | P | P | P | P ⁴ | P ⁴ | P |
| P-COL-12 | Télécharger une preuve (tracé) | `GET /evidence/:id/download` | P | P | P | P | P | P |
| P-COL-13 | Consulter la bibliothèque des preuves | `GET /evidence` | P | P | P | P | P | P |

³ Soumis à la séparation des tâches (§5). ⁴ Autorisé par l'API ; la page Collecte n'est pas affichée à O et E.

### 4.4 Risk & Compliance, griefs, programmes (`modules/risk.js`)

| ID | Permission | Route | A | M | C | O | E | Au |
|---|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| P-RSK-01 | Voir risques, obligations, écarts, griefs, programmes | `GET /risks`, `/obligations`, `/incidents`, `/grievances`, `/programs` | P | P | P | P | P | P |
| P-RSK-02 | Créer et réévaluer un risque | `POST /risks`, `PATCH /risks/:id` | P | P | ❌ | ❌ | ❌ | ❌ |
| P-RSK-03 | Créer une obligation, changer son statut | `POST /obligations`, `PATCH /obligations/:id` | P | P | ❌ | ❌ | ❌ | ❌ |
| P-RSK-04 | Déclarer un écart (incident, constat d'audit, non-conformité) | `POST /incidents` | P | P | P | ❌ | ❌ | ❌ |
| P-RSK-05 | Joindre une preuve à une obligation ou un écart | `POST /evidence` (obligation, incident) | P | P | P | ❌ | ❌ | ❌ |
| P-RSK-06 | **Clore un écart** (≥ 1 action, toutes terminées ou annulées) | `PATCH /incidents/:id` | P | P | ❌ | ❌ | ❌ | ❌ |
| P-RSK-07 | Enregistrer un grief, le traiter, le résoudre | `POST /grievances`, `PATCH /grievances/:id` | P | P | P | ❌ | ❌ | ❌ |
| P-RSK-08 | Créer et suivre un programme communautaire | `POST /programs`, `PATCH /programs/:id` | P | P | ❌ | ❌ | ❌ | ❌ |
| P-RSK-09 | Créer un écart de type `threshold_breach` | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

P-RSK-09 : ce type est **réservé au système**, créé automatiquement à la soumission d'une donnée hors seuil. Aucun humain ne peut le créer à la main.

### 4.5 Actions (`modules/actions.js`)

| ID | Permission | Route | A | M | C | O | E | Au |
|---|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| P-ACT-01 | Voir les actions et leur résultat mesuré | `GET /actions`, `GET /actions/:id` | P | P | P | P | P | P |
| P-ACT-02 | Créer une action (depuis un écart, une obligation, un risque, un objectif) | `POST /actions` | P | P | ❌ | ❌ | ❌ | ❌ |
| P-ACT-03 | **Mettre à jour ou clôturer une action** (avancement, dépenses, statut `done`, note) | `PATCH /actions/:id` | P | P | R | R | ❌ | ❌ |
| P-ACT-04 | Réaffecter une action, changer son échéance | `PATCH /actions/:id` (`owner_id`, `due_date`) | P | P | ❌ | ❌ | ❌ | ❌ |
| P-ACT-05 | Annuler une action | `PATCH /actions/:id` (`status: cancelled`) | P | P | ❌ | ❌ | ❌ | ❌ |
| P-ACT-06 | Joindre une preuve à une action | `POST /evidence` (action) | P | P | R | R | ❌ | ❌ |
| P-ACT-07 | Modifier une action terminée ou annulée | `PATCH /actions/:id` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

P-ACT-03 : la clôture (`done`) d'une action liée à un indicateur de résultat exige une **mesure validée** d'une période au moins égale au trimestre de création de l'action. Le résultat est alors figé (`result_value`, `result_period`). P-ACT-07 : une action close est figée pour tout le monde.

### 4.6 Reporting et audit (`modules/reporting.js`)

| ID | Permission | Route | A | M | C | O | E | Au |
|---|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| P-REP-01 | Voir le tableau de bord consolidé | `GET /dashboard`, `GET /periods` | P | P | P | P | P | P |
| P-REP-02 | **Générer un rapport** IFC ou index GRI (JSON, PDF, Excel), tracé avec empreinte | `GET /reports/:type` | P | P | ❌ | ❌ | P | P |
| P-AUD-01 | **Consulter le journal d'audit** | `GET /audit-log` | ✅ ⁵ | ✅ ⁵ | ❌ | ❌ | ✅ ⁵ | ✅ ⁵ |
| P-AUD-02 | Vérifier l'intégrité de la chaîne d'audit | `GET /audit-log/verify` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| P-AUD-03 | Modifier ou supprimer une ligne du journal | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

⁵ Restreint aux objets du périmètre pour un utilisateur à périmètre limité. P-AUD-03 est impossible par construction : triggers `BEFORE UPDATE` / `BEFORE DELETE` en base.

### 4.7 Synthèse des écritures (vue compacte)

| Domaine | A | M | C | O | E | Au |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Entités, utilisateurs, accès auditeur | ✅ | | | | | |
| Politiques, engagements, objectifs | ✅ | ✅ | | | | |
| Seuils d'indicateurs, campagnes | ✅ | ✅ | | | | |
| Saisie, import, preuves de données, soumission | ✅ | ✅ | ✅ | | | |
| Revue, validation, rejet | ✅ | ✅ | | | | |
| Risques, obligations, programmes | ✅ | ✅ | | | | |
| Écarts (déclaration), griefs | ✅ | ✅ | ✅ | | | |
| Écarts (clôture) | ✅ | ✅ | | | | |
| Actions (création, réaffectation, annulation) | ✅ | ✅ | | | | |
| Actions (avancement, clôture, preuve) | ✅ | ✅ | R | R | | |
| Rapports (génération) | ✅ | ✅ | | | ✅ | ✅ |

## 5. Séparation des tâches et contrôles métier

| Règle | Énoncé | Contrôle | Code de refus | Réf. |
|---|---|---|---|---|
| Trois personnes par donnée | Le relecteur n'est pas celui qui a soumis ; le validateur n'est ni le contributeur ni le relecteur | `collection.js` routes `review`, `validate` | 403 | RG-24, RG-25 |
| Ordre du circuit | On ne valide pas une donnée qui n'a pas été revue | statut `reviewed` exigé | 400 | RG-25 |
| Preuve avant soumission | Si l'indicateur exige une preuve, pas de soumission sans au moins un fichier | `submit` | 400 | RG-23 |
| Gel après soumission | Une donnée `submitted`, `reviewed` ou `validated` n'est plus modifiable ni réimportable | `PATCH`, `import` | 400 | RG-22, RG-28 |
| Motif de rejet | Un rejet porte toujours un motif, visible du contributeur | `reject` | 400 | RG-26 |
| Conformité prouvée | Une obligation ne passe en `compliant` qu'avec au moins une preuve | `PATCH /obligations/:id` | 400 | RG-40 |
| Propriété d'action | Seuls le responsable de l'action et A/M la modifient ; seuls A/M réaffectent, changent l'échéance, annulent | `PATCH /actions/:id` | 403 | RG-52 |
| Clôture d'écart | Au moins une action liée, toutes terminées ou annulées | `PATCH /incidents/:id` | 400 | RG-34 |
| Résultat mesuré | Clôture d'action avec indicateur : mesure validée récente exigée | `PATCH /actions/:id` | 400 | RG-53 |
| Écart automatique | Le type `threshold_breach` n'est créé que par le système | `POST /incidents` | 400 | RG-33 |
| Auditeur limité dans le temps | Accès auditeur avec date de fin obligatoire, refus après | `POST /users`, `authenticate` | 400 / 401 | RG-04 |

**Conséquence opérationnelle** : un client qui veut valider ses données doit disposer d'**au moins deux comptes A ou M** en plus des contributeurs. À rappeler lors de l'intégration de chaque nouveau client (livrable 03, paramétrage).

Les numéros RG-xx renvoient à `docs-dev/06-regles-metier.md`.

## 6. Checklist d'implémentation d'une nouvelle route ou d'un nouvel écran

À vérifier par le développeur et par le relecteur de la PR, et à donner à tout assistant de code IA qui ajoute une route.

**Serveur**

- [ ] La route est enregistrée sous `/api` et protégée par l'authentification (seules `/auth/login` et `/health` sont publiques).
- [ ] Toutes les requêtes SQL filtrent `org_id = req.user.org_id`. Aucun `org_id` n'est lu depuis la requête.
- [ ] Un objet lu par identifiant est cherché avec `AND org_id = ?` ; s'il est introuvable, on répond 404.
- [ ] Si l'objet porte un `entity_id`, on appelle `assertInScope(req.scope, row.entity_id)` ; les listes sont filtrées par `req.scope`.
- [ ] Tout identifiant reçu dans le corps (entité, utilisateur, indicateur, objet source) est revérifié dans l'organisation et, le cas échéant, dans le périmètre.
- [ ] Pour une écriture : `requireRole(req.user, [...])` avec la liste exacte de cette matrice ; la règle de lecture seule couvre E et Au mais ne remplace pas `requireRole`.
- [ ] Les contrôles de propriété (responsable d'action) et de séparation des tâches sont explicites et testés.
- [ ] Toute écriture appelle `audit(...)` avec l'action, le type et l'id de l'objet, et les détails avant/après utiles.
- [ ] Les données personnelles renvoyées sont limitées au nécessaire (pas de `password_hash`, pas d'e-mails inutiles).

**Interface**

- [ ] La page est ajoutée à `NAV` avec la bonne liste de rôles, ou affichée pour tous si elle est en lecture.
- [ ] Les boutons d'écriture sont masqués pour les rôles qui n'y ont pas droit (`MANAGERS`, propriétaire), en sachant que c'est du confort et non de la sécurité.
- [ ] Un 403 ou 404 du serveur produit un message clair, pas un écran blanc.

**Tests (livrable 08)**

- [ ] Un test vérifie le refus pour chaque rôle non autorisé (403).
- [ ] Un test vérifie que l'utilisateur d'un autre client (`admin@sil.demo`) reçoit 404 ou une liste vide.
- [ ] Un test vérifie le refus hors périmètre (contributeur d'un autre site).
- [ ] La ligne `P-xxx-nn` correspondante est ajoutée ou mise à jour dans ce document.

## 7. Visibilité des écrans par rôle (navigation)

Source : constante `NAV` de `app/web/src/App.jsx`.

| Écran | A | M | C | O | E | Au | Contenu selon le rôle |
|---|:-:|:-:|:-:|:-:|:-:|:-:|---|
| Tableau de bord | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Consolidé sur la racine du périmètre |
| Stratégie | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | Création réservée à A, M |
| Collecte | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | C : « à fournir » ; A, M : file de validation et campagnes ; Au : consultation |
| Risques et conformité | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | C : déclarer écarts et griefs ; A, M : tout |
| Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | O, C : « mes actions » mises à jour ; A, M : création, réaffectation |
| Rapports | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | Génération PDF, Excel, empreinte |
| Preuves | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Bibliothèque du périmètre, téléchargements tracés |
| Journal d'audit | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | Vérification de la chaîne |
| Administration | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | A : entités, utilisateurs ; M : consultation et seuils d'indicateurs |

Page d'accueil après connexion : contributeur → Collecte ; responsable d'action → Actions ; autres rôles → Tableau de bord. Un utilisateur qui saisit l'URL d'un écran non autorisé est renvoyé vers sa page d'accueil.

## 8. Écarts connus et évolutions

| # | Écart | Risque | Priorité | Correction proposée |
|---|---|---|---|---|
| 1 | `GET /users` renvoie tous les utilisateurs, e-mails compris, à tous les rôles | Fuite d'annuaire interne, notamment vers l'auditeur externe | P1 | Rôles non A : `id`, `name`, `role` seulement ; filtrer sur le périmètre pour les listes de responsables |
| 2 | `PATCH /me` bloqué pour E et Au | Langue non mémorisée côté serveur | P2 | Exception explicite dans la règle de lecture seule, champ `lang` uniquement |
| 3 | Jeton accepté en paramètre `?token=` | Jeton dans les journaux d'accès | P0 | Supprimer ; téléchargements via `fetch` + blob (déjà fait côté front) |
| 4 | Pas de MFA | Compromission d'un compte administrateur | P1 (obligatoire Entreprise, Institution) | TOTP + codes de secours, puis WebAuthn ; obligatoire pour A et M |
| 5 | Pas de limitation des essais de connexion | Force brute | P0 | 5 essais / 15 min par compte et par IP |
| 6 | Pas de rôle opérateur TRIVALINK | Support sans cadre, ou accès direct en base | P1 | Console séparée, accès break-glass tracé (§2.2) |
| 7 | Pas de délégation temporaire (absence d'un validateur) | Blocage du circuit de validation | P2 | Délégation datée d'un M vers un autre utilisateur, tracée |
| 8 | Rôles figés dans le code | Clients qui veulent des rôles sur mesure | P3 [CIBLE] | Permissions fines `P-xxx-nn` attribuables par profil, en gardant les 6 rôles comme modèles |
| 9 | Pas de SSO | Adoption grands comptes | P2 | OIDC / SAML (Azure AD, Google Workspace) |

## 9. Questions fréquentes des clients

**Le personnel de TRIVALINK peut-il voir nos données ?** Dans le MVP, l'équipe technique a accès à la base. En production : aucun accès par défaut, accès d'urgence uniquement sur demande, limité, et visible dans votre journal d'audit (§2.2).

**Un auditeur peut-il modifier un chiffre ?** Non. Le rôle auditeur est en lecture seule au niveau du serveur, son accès expire à une date fixée, et chaque preuve qu'il télécharge est tracée.

**Un site peut-il voir les données d'un autre site ?** Non. Un contributeur n'accède qu'à son entité ; tout autre objet lui répond « introuvable ».

**Un responsable ESG peut-il valider sa propre saisie ?** Non. Saisie, revue et validation exigent trois personnes différentes.

**Peut-on supprimer une ligne du journal d'audit ?** Non. Le journal est en ajout seul, chaque ligne est chaînée à la précédente par une empreinte SHA-256, et la chaîne peut être vérifiée à tout moment depuis l'écran Journal d'audit.

## 10. Historique

| Version | Date | Changement |
|---|---|---|
| 1.0 | 13/10/2026 | Création à partir du code du MVP (`core.js`, modules, `App.jsx`) |
