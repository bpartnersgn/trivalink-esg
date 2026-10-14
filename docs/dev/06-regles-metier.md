# 06 · Règles métier

Toutes les règles sont **appliquées par le serveur**. L'interface peut les anticiper (désactiver un bouton, afficher un avertissement) mais ne les remplace jamais. Chaque règle a un identifiant `RG-xx` à citer dans les PR, tickets et tests.

Légende de la colonne Test : ✅ couverte par `server/test/api.test.js` · ⚠️ non couverte (à ajouter, voir 13).

## 1. Isolation et accès

| ID | Règle | Code | Test |
|---|---|---|---|
| RG-01 | Toute lecture/écriture est limitée à l'organisation de la session (`org_id`). Un objet d'un autre client répond 404. | Toutes les requêtes `WHERE … org_id = ?` | ✅ isolation |
| RG-02 | Un utilisateur avec `scope_entity_id` ne voit et ne modifie que son entité et ses descendantes. Hors périmètre → 404. | `scopeEntityIds`, `assertInScope`, filtres `req.scope.has` | ✅ périmètre |
| RG-03 | `executive` et `auditor` sont en lecture seule (toute méthode ≠ GET → 403). | `app.js` middleware | ✅ auditeur |
| RG-04 | Un accès auditeur a obligatoirement une date d'expiration ; passé cette date, connexion et sessions refusées. | `org.js` POST users, `core.js userFromToken` | ⚠️ |
| RG-05 | Un administrateur ne peut pas se désactiver ni se retirer le rôle administrateur. | `org.js` PATCH users | ⚠️ |
| RG-06 | Désactiver un utilisateur supprime ses sessions. | `org.js` PATCH users | ⚠️ |
| RG-07 | Un responsable désigné (`owner_id`) doit appartenir à la même organisation. | `ownerIn()` | ⚠️ |
| RG-08 | Les rapports sont interdits aux contributeurs et responsables d'action. | `reporting.js` | ✅ rapports |

## 2. Organisation

| ID | Règle | Code | Test |
|---|---|---|---|
| RG-10 | Hiérarchie : un groupe n'a pas de parent obligatoire ; filiale et site ont un parent ; un site n'a pas d'enfant. | `POST /entities` | ⚠️ |
| RG-11 | Code d'entité unique par organisation ; e-mail unique sur toute la plateforme. | `UNIQUE` SQL → 409 | ⚠️ |
| RG-12 | Mot de passe ≥ 8 caractères, haché scrypt avec sel aléatoire. | `hashPassword` | ⚠️ |

## 3. Collecte et validation

| ID | Règle | Code | Test |
|---|---|---|---|
| RG-20 | Une campagne demande les indicateurs `level=site` aux sites et les indicateurs `level=group` aux groupes/filiales. | `POST /campaigns` | ✅ (T4 : 1 demande) |
| RG-21 | Une seule donnée par (indicateur, entité, période) ; relancer une campagne sur la même période n'écrase rien. | `UNIQUE` + `INSERT OR IGNORE` | ⚠️ |
| RG-22 | Une donnée n'est modifiable (valeur, preuve, import) qu'en `requested`, `draft` ou `rejected`. | `PATCH datapoints`, `POST evidence`, `POST import` | ✅ import |
| RG-23 | **Pas de soumission sans valeur ni, si l'indicateur l'exige, sans pièce justificative.** | `submit` | ✅ boucle |
| RG-24 | **Validation à deux niveaux par trois personnes distinctes** : le relecteur ≠ contributeur ; le validateur ≠ contributeur et ≠ relecteur. | `review`, `validate` | ✅ boucle |
| RG-25 | La validation exige une revue préalable (`reviewed`). | `validate` | ✅ boucle |
| RG-26 | Le rejet exige un motif ; la donnée revient au contributeur, qui peut corriger et resoumettre. Le motif est effacé à la resoumission. | `reject`, `submit` | ⚠️ |
| RG-27 | Chaque modification de valeur incrémente `version` et est tracée avec avant/après. | `PATCH datapoints`, import | ✅ (historique) |
| RG-28 | **Une donnée validée est définitive** (aucune route ne la modifie). | absence de route | ⚠️ |
| RG-29 | L'import ne soumet jamais : il crée ou met à jour des brouillons, ligne par ligne, et renvoie les erreurs par ligne sans bloquer les lignes valides. | `POST /import` | ✅ import |

## 4. Seuils et écarts

| ID | Règle | Code | Test |
|---|---|---|---|
| RG-30 | Une valeur est **hors seuil** si `value > threshold_max` ou `value < threshold_min` (bornes incluses = conforme). | `isBreach()` | ✅ |
| RG-31 | **À la soumission d'une valeur hors seuil, un écart `threshold_breach` de gravité `high` est créé automatiquement**, sauf s'il existe déjà un écart ouvert sur cette donnée. Il est tracé `auto_create`. | `submit` | ✅ boucle |
| RG-32 | Le drapeau `breach` est recalculé à chaque soumission. | `submit` | ✅ |
| RG-33 | `threshold_breach` ne peut pas être déclaré manuellement. | `POST /incidents` | ⚠️ |
| RG-34 | **Un écart ne peut être clos que s'il a au moins une action et que toutes ses actions sont terminées ou annulées.** (« Tout écart mène à une action. ») | `PATCH /incidents` | ✅ boucle |

## 5. Conformité, griefs, programmes

| ID | Règle | Code | Test |
|---|---|---|---|
| RG-40 | **Une obligation ne peut être déclarée conforme sans au moins une preuve attachée.** | `PATCH /obligations` | ⚠️ |
| RG-41 | Un grief résolu ou clos doit avoir une résolution ; la date de résolution est posée une fois. | `PATCH /grievances` | ⚠️ |
| RG-42 | Score de risque = probabilité × impact (1-25). Risque élevé = score ≥ 15 et non clos. | SQL `likelihood * impact`, `buildDashboard` | ⚠️ |

## 6. Actions et résultat mesuré

| ID | Règle | Code | Test |
|---|---|---|---|
| RG-50 | Une action a obligatoirement un titre, une entité et une échéance. Son origine (écart, obligation, risque, objectif) doit appartenir à l'organisation. | `POST /actions` | ✅ isolation |
| RG-51 | Si un indicateur de résultat est donné sans valeur de départ, **la valeur de départ = dernière valeur validée** sur l'entité et ses descendantes. | `POST /actions` | ✅ (64) |
| RG-52 | Seuls le responsable de l'action et les responsables ESG la modifient ; seuls les responsables ESG changent échéance et responsable ou l'annulent. | `PATCH /actions` | ⚠️ partiel |
| RG-53 | **Une action avec indicateur de résultat ne peut être clôturée qu'avec une mesure validée d'une période ≥ trimestre de création de l'action.** La valeur et la période sont alors figées dans l'action. | `PATCH /actions` | ✅ boucle |
| RG-54 | Une action terminée ou annulée n'est plus modifiable. | `PATCH /actions` | ⚠️ |
| RG-55 | À la clôture, l'avancement est forcé à 100 %. Passer de `planned` à `in_progress` sans avancement donne 10 %. | `PATCH /actions` | ⚠️ |
| RG-56 | Une action est **en retard** si elle n'est ni terminée ni annulée et que son échéance est passée (comparaison de dates `AAAA-MM-JJ` en UTC). | `enrichAction` | ⚠️ |
| RG-57 | Résultat **atteint** : si la valeur de départ est supérieure à la cible ou si l'indicateur est `lower`, `mesure ≤ cible` ; sinon `mesure ≥ cible`. | `enrichAction` | ✅ |

## 7. Consolidation et indicateurs calculés

| ID | Règle | Code | Test |
|---|---|---|---|
| RG-60 | **Seules les données `validated` sont consolidées et publiées** (tableau de bord, objectifs, rapports, résultats d'actions). | `consolidated()` statuts par défaut | ✅ (implicite) |
| RG-61 | Consolidation = agrégation (`sum`, `avg`, `max`) des valeurs validées de l'entité racine et de toutes ses descendantes **dans le périmètre de l'utilisateur**. Aucune valeur → `null` (« Non disponible »), jamais 0. | `consolidationSet`, `consolidated`, `aggregate` | ⚠️ |
| RG-62 | `avg` est une moyenne simple des entités (non pondérée). ⚠️ Pour des ratios (LTIFR, % de femmes), c'est une approximation : voir §9. | `aggregate` | — |
| RG-63 | Objectif : valeur actuelle = dernière période validée de l'indicateur sur le périmètre de l'objectif ; atteint si `current ≤ cible` (indicateur `lower`, ou `neutral` avec départ > cible), sinon `current ≥ cible`. | `objectiveStatus` | ⚠️ |
| RG-64 | Avancement vers une cible = `(actuel - départ) / (cible - départ)`, borné 0-100 ; sans départ, 100 si actuel = cible, sinon non calculable. | `progressTowards` | ⚠️ |
| RG-65 | Période par défaut du tableau de bord et des rapports : dernière campagne close, sinon dernière période avec données validées, sinon trimestre courant. | `defaultPeriod` | ⚠️ |
| RG-66 | Taux de preuve = données validées appuyées par ≥ 1 preuve / données validées de la période. | `buildDashboard` | ⚠️ |

## 8. Traçabilité

| ID | Règle | Code | Test |
|---|---|---|---|
| RG-70 | **Toute écriture métier produit une ligne d'audit** (qui, quand, quoi, détails avant/après). Les lectures sensibles aussi : connexion, téléchargement de preuve, génération de rapport. | `audit()` | ✅ |
| RG-71 | Le journal est en ajout seul (triggers) et chaîné par SHA-256 par organisation ; `GET /audit-log/verify` détecte toute altération. | `db.js`, `verifyAuditChain` | ✅ |
| RG-72 | Chaque rapport porte une empreinte SHA-256 de son contenu (hors date de génération), imprimée sur chaque page PDF et dans l'onglet Excel. | `buildReport` | ✅ |
| RG-73 | Chaque preuve porte l'empreinte SHA-256 du fichier en clair, consultable dans la bibliothèque. | `POST /evidence` | ✅ |

## 9. Points métier ouverts (à trancher avec le produit)

| # | Sujet | Situation actuelle | Proposition |
|---|---|---|---|
| Q1 | Ratios consolidés (LTIFR, taux de gravité, % femmes, % nationaux) | Moyenne simple des sites | Calculer les ratios à partir de leurs composantes (ex. LTIFR = Σ accidents avec arrêt × 10⁶ / Σ heures travaillées). Introduire des **indicateurs calculés** (`formula`). |
| Q2 | Correction d'une donnée validée | Impossible | Route `POST /datapoints/:id/reopen` (A/M, motif obligatoire) → nouvelle version `draft`, ancienne valeur conservée dans l'historique, revalidation complète. |
| Q3 | Clôture de campagne avec données manquantes | Autorisée | Avertissement + liste des manquants ; option de clôture forcée tracée. |
| Q4 | Relances avant échéance | Absentes | E-mail J-7, J-1, J+1 aux contributeurs ayant des données `requested`/`draft`/`rejected`. |
| Q5 | Granularité temporelle | Trimestre uniquement | Ajouter `frequency` (mensuel, trimestriel, annuel) à l'indicateur et étendre le format de période (`2026-M07`, `2026-Y`). |
| Q6 | Devise | Implicite (USD) | Colonne `currency` sur programmes et actions ; conversion au taux de la période pour la consolidation. |
| Q7 | Délégation de saisie | Non | Permettre à un contributeur d'avoir plusieurs périmètres (table `user_scopes`). |
| Q8 | Seuils par entité | Seuils par indicateur pour tout le client | Table `indicator_thresholds (indicator_id, entity_id, min, max, source)` : les permis diffèrent d'un site à l'autre. |
