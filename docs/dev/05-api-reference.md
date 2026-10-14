# 05 · Référence de l'API REST

Base : `/api`. Format : JSON (UTF-8), sauf uploads (`multipart/form-data`) et exports (PDF, XLSX, fichiers de preuve).
Version : non versionnée dans le MVP. [À FAIRE] préfixe `/api/v1` avant toute intégration externe.

## Conventions communes

### Authentification

```
Authorization: Bearer <token>
```

- Jeton obtenu par `POST /api/auth/login`, valable **12 heures**.
- Le jeton est aussi accepté en paramètre `?token=` (utile pour un lien de téléchargement). ⚠️ À supprimer en production : le jeton finit dans les journaux d'accès (voir 07).
- Seules `/auth/login` et `/health` sont publiques.
- Un utilisateur désactivé, une session expirée ou un accès auditeur expiré → **401**.

### Règle globale de lecture seule

Rôles `executive` et `auditor` : toute méthode autre que `GET` (sauf `/auth/logout`) → **403** « Accès en lecture seule ».

### Erreurs

```json
{ "error": "Message lisible en français", "code": "bad_request" }
```

| Statut | code | Quand |
|---|---|---|
| 400 | `bad_request` | Règle métier, champ manquant ou invalide, contrainte SQL `CHECK`/`FOREIGN` |
| 401 | `unauthorized`, `expired` | Pas de session, session invalide, accès expiré |
| 403 | `forbidden` | Rôle insuffisant ; séparation des tâches |
| 404 | `not_found` | Introuvable, **autre organisation ou hors périmètre** |
| 409 | `conflict` | Doublon (contrainte `UNIQUE`) |
| 500 | `internal` | Erreur inattendue |

### Créations

Une création réussie renvoie **201** `{ "id": <nouvel id> }` (plus quelques champs selon la route). Une mise à jour renvoie **200** `{ "ok": true }`.

### Légende des rôles

`A` org_admin · `M` esg_manager · `C` contributor · `O` action_owner · `E` executive · `Au` auditor · `Tous` = tout utilisateur connecté.
« Périmètre » signifie : filtré sur les entités de `req.scope` (entité de rattachement de l'utilisateur et ses descendantes).

---

## 1. Organisation, authentification, utilisateurs (`modules/org.js`)

### `GET /api/health` — public
`200 { "ok": true }`

### `POST /api/auth/login` — public
```json
{ "email": "rse@kalaya.demo", "password": "demo1234" }
```
`200`
```json
{ "token": "9f2c…64 hex", "user": { "id": 2, "org_id": 1, "email": "rse@kalaya.demo", "name": "Fatoumata Bah", "role": "esg_manager", "scope_entity_id": null, "access_expires_at": null, "lang": "fr", "active": 1, "created_at": "…" } }
```
Erreurs : `401 unauthorized` « Identifiants incorrects » ; `401 expired` « Votre accès a expiré ».
Audit : `login`.

### `POST /api/auth/logout` — Tous
Supprime la session. `200 { ok: true }`.

### `GET /api/me` — Tous
```json
{ "user": { … }, "org": { "id": 1, "name": "Kalaya Mining Group (démo)" }, "scope": [1,2,3,4,5,6] }
```

### `PATCH /api/me` — Tous (sauf E/Au, lecture seule)
`{ "lang": "fr" | "en" }`. ⚠️ La règle de lecture seule empêche aujourd'hui `executive` et `auditor` d'enregistrer leur langue côté serveur (l'interface la garde en `localStorage`).

### `GET /api/entities` — Tous, périmètre
Liste des entités visibles, triées par `id` : `[{ id, org_id, parent_id, name, code, type, country }]`.

### `POST /api/entities` — A
```json
{ "name": "Site de Fria", "code": "FRI", "type": "site", "parent_id": 2, "country": "GN" }
```
Règles : `type` ∈ group/subsidiary/site ; parent obligatoire sauf groupe ; parent de la même organisation ; un site ne peut pas être parent. Doublon de `code` → 409.

### `GET /api/users` — Tous
Tous les utilisateurs de l'organisation (sans `password_hash`), triés par nom. ⚠️ Non filtré par périmètre (nécessaire pour les listes de responsables) ; à restreindre aux champs utiles pour les rôles non administrateurs [À FAIRE].

### `POST /api/users` — A
```json
{ "email": "auditeur2@cabinet.com", "name": "Jean Dupont", "role": "auditor", "password": "motdepasse8+", "scope_entity_id": 3, "access_expires_at": "2026-12-31", "lang": "en" }
```
Règles : rôle valide ; mot de passe ≥ 8 caractères ; périmètre dans celui de l'administrateur ; **`access_expires_at` obligatoire pour `auditor`**. E-mail existant (même dans un autre client) → 409.

### `PATCH /api/users/:id` — A
`{ "role"?, "active"?: boolean, "access_expires_at"? }`. Un administrateur ne peut pas se désactiver ni retirer son propre rôle `org_admin`. `active: false` supprime toutes les sessions de l'utilisateur.

### `GET /api/policies` — Tous
`[{ id, title, owner_id, owner_name, approved_at, review_due }]` (non filtré par périmètre : les politiques sont de niveau organisation).

### `POST /api/policies` — A, M
`{ "title": "Politique HSE groupe", "owner_id": 2, "approved_at": "2026-01-15", "review_due": "2027-01-15" }`

---

## 2. Strategy (`modules/strategy.js`)

### `GET /api/commitments` — Tous
Engagements avec leurs objectifs **du périmètre**, chaque objectif enrichi :
```json
[{
  "id": 1, "title": "Réduire l'intensité carbone", "domain": "E", "source": "Politique climat", "owner_name": "Fatoumata Bah",
  "objectives": [{
    "id": 1, "commitment_id": 1, "indicator_id": 5, "entity_id": 1, "entity_name": "Kalaya Mining Group",
    "title": "-10 % de scope 1 d'ici fin 2027", "baseline_value": 5360, "baseline_period": "2025-Q4", "target_value": 4824, "target_period": "2027-Q4",
    "indicator_code": "E05", "indicator_name_fr": "…", "indicator_name_en": "…", "unit": "tCO2e",
    "current_value": 5102.4, "current_period": "2026-Q2", "progress": 48, "met": false
  }]
}]
```

### `POST /api/commitments` — A, M
`{ "title", "description"?, "domain": "E"|"S"|"G", "source"?, "owner_id"? }`

### `POST /api/objectives` — A, M
```json
{ "commitment_id": 1, "indicator_id": 11, "entity_id": 5, "title": "MES < 50 mg/L", "baseline_value": 64, "baseline_period": "2026-Q3", "target_value": 50, "target_period": "2027-Q2" }
```
Règles : engagement et indicateur de l'organisation ; entité dans le périmètre ; `target_period` au format `AAAA-Qn` ; `target_value` obligatoire.

---

## 3. Collecte : indicateurs, campagnes, données, preuves, import (`modules/collection.js`)

### `GET /api/indicators` — Tous
Catalogue complet de l'organisation (actifs et inactifs), trié par domaine puis code.

### `PATCH /api/indicators/:id` — A, M
`{ "threshold_min"?, "threshold_max"?, "evidence_required"?: boolean, "active"?: boolean }` — seuls ces champs sont modifiables. Une valeur `""` ou `null` efface le seuil. Audit avec avant/après.

### `GET /api/campaigns` — Tous
Campagnes triées par période décroissante, avec compteurs **sur le périmètre de l'utilisateur** :
```json
[{ "id": 3, "name": "Collecte trimestrielle T3 2026", "period": "2026-Q3", "deadline": "2026-10-31", "status": "open",
   "created_by_name": "Fatoumata Bah", "total": 125, "requested": 40, "submitted": 30, "reviewed": 25, "validated": 30 }]
```
`requested` regroupe `requested` + `draft` + `rejected` (« reste à fournir »).

### `POST /api/campaigns` — A, M
```json
{ "name": "Collecte T4 2026", "period": "2026-Q4", "deadline": "2027-01-20",
  "entity_ids": [4, 5, 6], "domains": ["E", "S"], "indicator_ids": [] }
```
- `entity_ids` : au moins une, toutes dans le périmètre.
- Sélection des indicateurs actifs : `indicator_ids` si fourni, sinon `domains`, sinon tous.
- **Indicateurs `level=site` demandés aux sites ; `level=group` aux groupes et filiales.**
- Crée une donnée `requested` par couple (indicateur, entité) ; ignore les couples déjà existants pour la période (`INSERT OR IGNORE`).

`201 { "id": 4, "requests": 74 }` — audit `launch`.

### `PATCH /api/campaigns/:id` — A, M
`{ "status": "open" | "closed" }`.

### `GET /api/datapoints` — Tous, périmètre
Filtres (query) : `period`, `status`, `domain`, `campaign_id`, `entity_id`, `indicator_id`, et `queue` :
- `queue=todo` → `requested`, `draft`, `rejected` ;
- `queue=validation` → `submitted`, `reviewed`.

Chaque ligne contient la donnée et des champs joints : `indicator_code, name_fr, name_en, unit, domain, category, evidence_required, threshold_min, threshold_max, gri, ifc, entity_name, entity_type, evidence_count, submitted_by_name, reviewed_by_name, validated_by_name`. Tri : entité, domaine, code.

### `GET /api/datapoints/:id` — Tous, périmètre
La donnée + `evidence[]` (id, filename, mime, size, sha256, uploaded_at, uploaded_by_name) + `history[]` (journal d'audit de la donnée) + `incidents[]` liés.

### `PATCH /api/datapoints/:id` — A, M, C, périmètre
`{ "value": 64, "comment": "Fortes pluies" }` — statut requis : `requested`, `draft` ou `rejected`. Passe en `draft`, `version + 1`. `value` peut être `null` ou `""` (efface).

### `POST /api/datapoints/:id/submit` — A, M, C, périmètre
Préconditions : statut `draft` ou `rejected` ; valeur non nulle ; **au moins une preuve si `evidence_required`**.
Effets (transaction) : statut `submitted`, `submitted_by/at`, revue remise à zéro, `breach` calculé ; **si hors seuil et aucun écart ouvert sur cette donnée → création d'un incident `threshold_breach`, gravité `high`**.
`200 { "ok": true, "breach": true, "incident_id": 57 }`

### `POST /api/datapoints/:id/review` — A, M, périmètre
Statut `submitted` → `reviewed`. **403 si le relecteur est celui qui a soumis.**

### `POST /api/datapoints/:id/validate` — A, M, périmètre
Statut `reviewed` → `validated`. **403 si le validateur est le contributeur ou le relecteur.** 400 si la donnée n'a pas été revue.

### `POST /api/datapoints/:id/reject` — A, M, périmètre
`{ "reason": "Valeur incohérente avec le relevé de compteur" }` — statut `submitted` ou `reviewed` → `rejected`. Motif obligatoire.

### `POST /api/evidence` — multipart, périmètre
Champs : `object_type` (`datapoint` | `action` | `obligation` | `incident`), `object_id`, `file` (≤ 20 Mo).

| object_type | Qui | Condition |
|---|---|---|
| datapoint | A, M, C | Donnée en `requested`, `draft` ou `rejected` (la preuve s'ajoute **avant** soumission) |
| action | A, M, ou le responsable de l'action | — |
| obligation, incident | A, M, C | — |

Le fichier est haché (SHA-256), chiffré (AES-256-GCM) et stocké hors base. `201 { "id": 812, "sha256": "…" }` — audit `attach_evidence` sur l'objet.

### `GET /api/evidence` — Tous, périmètre
Bibliothèque des preuves (plus récentes d'abord) avec `entity_name` et `object_label` (titre de l'objet, ou `E11 Matières… · 2026-Q3` pour une donnée). Filtre optionnel : `object_type` + `object_id`.

### `GET /api/evidence/:id/download` — Tous, périmètre
Renvoie le fichier déchiffré (`Content-Disposition: attachment; filename*=UTF-8''…`). Audit `download_evidence` (l'auditeur laisse une trace de ce qu'il consulte).

### `POST /api/import` — multipart, A, M, C
Champ `file` : `.csv` (séparateur `;` ou `,`, détecté sur l'en-tête, BOM toléré) ou `.xlsx` (première feuille).
Colonnes (en-têtes insensibles à la casse) :

| indicator_code | entity_code | period | value | comment |
|---|---|---|---|---|
| E01 | SGE | 2026-Q3 | 30500 | relevé compteurs |

- Décimales `,` ou `.` ; espaces ignorés dans les nombres.
- Chaque ligne valide : crée la donnée en `draft` (hors campagne) ou met à jour une donnée `requested`/`draft`/`rejected` existante.
- Lignes refusées (sans bloquer les autres) : indicateur inconnu, entité inconnue ou hors périmètre, période invalide, valeur invalide, donnée déjà soumise ou validée.

`200 { "imported": 1, "errors": [ { "line": 3, "error": "Indicateur inconnu : E99" } ] }` — numéros de ligne du fichier (en-tête = ligne 1). L'import **ne soumet pas** : le contributeur joint les preuves puis soumet.

---

## 4. Risk & Compliance, griefs, programmes (`modules/risk.js`)

Toutes les listes sont filtrées par périmètre et enrichies d'un compteur `actions: { total, closed }` (actions liées par `source_type`/`source_id`, `closed` = terminées ou annulées).

### Risques
| Méthode | Route | Rôles | Corps / notes |
|---|---|---|---|
| GET | `/api/risks` | Tous | + `entity_name`, `owner_name`, `score` (= probabilité × impact) ; tri score décroissant |
| POST | `/api/risks` | A, M | `{ entity_id, title, category, domain, likelihood 1-5, impact 1-5, mitigation?, owner_id? }` |
| PATCH | `/api/risks/:id` | A, M | `{ likelihood?, impact?, status?: open\|mitigated\|closed, mitigation? }` |

### Obligations
| Méthode | Route | Rôles | Corps / notes |
|---|---|---|---|
| GET | `/api/obligations` | Tous | + `evidence_count`, `entity_name`, `owner_name` ; tri source, référence |
| POST | `/api/obligations` | A, M | `{ entity_id, source, reference?, title, due_date?, owner_id? }` |
| PATCH | `/api/obligations/:id` | A, M | `{ status }` ; **`compliant` exige ≥ 1 preuve** sur l'obligation |

### Écarts (incidents)
| Méthode | Route | Rôles | Corps / notes |
|---|---|---|---|
| GET | `/api/incidents` | Tous | + `entity_name`, `created_by_name` ; ouverts d'abord, puis plus récents |
| POST | `/api/incidents` | A, M, C | `{ entity_id, type: incident\|audit_finding\|non_conformity, severity?: low\|medium\|high\|critical (défaut medium), title, description?, occurred_at? (défaut aujourd'hui), obligation_id? }` — `threshold_breach` est réservé au système |
| PATCH | `/api/incidents/:id` | A, M | `{ status: open\|closed }` ; **clôture : ≥ 1 action liée et toutes terminées/annulées** |

### Griefs
| Méthode | Route | Rôles | Corps / notes |
|---|---|---|---|
| GET | `/api/grievances` | Tous | Tri date de réception décroissante |
| POST | `/api/grievances` | A, M, C | `{ entity_id, channel, category, description, received_at? }` |
| PATCH | `/api/grievances/:id` | A, M, C | `{ status, resolution? }` ; `resolved`/`closed` exigent une résolution (fournie ou existante) |

### Programmes communautaires
| Méthode | Route | Rôles | Corps / notes |
|---|---|---|---|
| GET | `/api/programs` | Tous | |
| POST | `/api/programs` | A, M | `{ entity_id, name, budget?, spent?, beneficiaries_target?, beneficiaries_actual? }` |
| PATCH | `/api/programs/:id` | A, M | `{ spent?, beneficiaries_actual?, status?: planned\|active\|completed }` |

---

## 5. Actions (`modules/actions.js`)

### `GET /api/actions` — Tous, périmètre
Filtres : `mine=1` (mes actions), `overdue=1`, `source_type` + `source_id`. Tri : échéance.
Chaque action est enrichie :
```json
{
  "id": 12, "title": "Renforcer la décantation", "status": "in_progress", "progress": 50, "due_date": "2026-12-31",
  "budget": 10000, "spent": 4000, "entity_name": "Site aurifère de Siguiri-Est", "owner_name": "Ousmane Keita",
  "source_type": "incident", "source_id": 57, "source_title": "Dépassement de seuil : …",
  "overdue": false,
  "baseline_value": 64, "target_value": 50,
  "result": { "indicator_code": "E11", "unit": "mg/L", "direction": "lower",
              "measured_value": 42, "measured_period": "2026-Q4", "progress": 100, "achieved": true }
}
```

### `GET /api/actions/:id` — Tous, périmètre
Action enrichie + `evidence[]` + `history[]`.

### `POST /api/actions` — A, M
```json
{ "entity_id": 6, "title": "Renforcer la décantation", "description": "…",
  "source_type": "incident", "source_id": 57,
  "owner_id": 6, "due_date": "2026-12-31", "budget": 10000,
  "result_indicator_id": 11, "baseline_value": null, "target_value": 50 }
```
- `source_type` ∈ incident, obligation, risk, objective ; la source doit appartenir à l'organisation.
- Si `result_indicator_id` est fourni sans `baseline_value`, **la valeur de départ = dernière valeur validée** de l'indicateur sur l'entité et ses descendantes.
- `due_date` et `title` obligatoires.

### `PATCH /api/actions/:id` — A, M, ou responsable de l'action
`{ "status"?, "progress"? (0-100), "spent"?, "due_date"? (A/M), "owner_id"? (A/M), "note"? }`
- Action `done` ou `cancelled` : non modifiable (400).
- `cancelled` : A/M uniquement.
- `done` : progress forcé à 100 ; **si indicateur de résultat, il faut une mesure validée d'une période ≥ trimestre de création de l'action**, sinon 400 ; `result_value`/`result_period` sont figés.
- Passage `planned` → `in_progress` sans avancement fourni : progress = 10.

`200 { "ok": true, "result_value": 42, "result_period": "2026-Q4" }` — audit `close` ou `update`, avec `note`.

---

## 6. Reporting et audit (`modules/reporting.js`)

### `GET /api/periods` — Tous
Périodes connues (données et campagnes), décroissantes : `["2026-Q4","2026-Q3","2026-Q2","2026-Q1"]`.

### `GET /api/dashboard?entity_id=&period=` — Tous
- `entity_id` absent : racine du périmètre (groupe pour un utilisateur sans périmètre).
- `period` absent : dernière campagne close, sinon dernière période avec données validées, sinon trimestre courant.

Réponse (structure complète dans 10-reporting.md) :
```
{ period, previous_period, entity, entity_count,
  kpis[]: { id, code, domain, category, name_fr, name_en, unit, direction, gri, ifc, threshold_min, threshold_max,
            value, previous, validated, expected, pending, evidenced, breach },
  completion: { total, validated, in_validation, todo, rejected, evidence_rate },
  objectives[], incidents{ open, closed, open_list, all }, actions{ total, open, done, overdue, budget, spent, overdue_list, all },
  obligations{ total, compliant, non_compliant, in_progress, not_started, all },
  risks{ total, high, matrix[5][5], all }, grievances{ total, open, resolved, by_category }, programs[] }
```

### `GET /api/reports/:type?entity_id=&period=&format=` — A, M, E, Au
- `type` : `ifc` (rapport de suivi E&S, Normes de performance) ou `gri` (index de contenu GRI). Autre → 400.
- `format` : `json` (défaut), `pdf`, `xlsx`.
- Contributeur et responsable d'action → 403.
- Audit `generate_report` avec type, entité, période, format, **empreinte**.

### `GET /api/audit-log?limit=&object_type=&object_id=` — A, M, E, Au
Plus récentes d'abord, `limit` ≤ 1000 (défaut 200). Un utilisateur à périmètre restreint ne voit que les événements des objets de son périmètre (les événements sans entité, comme `login` ou `generate_report`, sont exclus).

### `GET /api/audit-log/verify` — A, M, E, Au
Recalcule toute la chaîne de l'organisation : `{ "ok": true, "count": 4182 }` ou `{ "ok": false, "count": 4182, "broken_at": 1033 }`.

---

## 7. Matrice rôles × routes d'écriture

| Route | A | M | C | O | E | Au |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| POST entities, users ; PATCH users | ✅ | | | | | |
| POST policies, commitments, objectives | ✅ | ✅ | | | | |
| PATCH indicators ; POST/PATCH campaigns | ✅ | ✅ | | | | |
| PATCH datapoints, submit, import | ✅ | ✅ | ✅ | | | |
| review, validate, reject | ✅ | ✅ | | | | |
| POST evidence (datapoint, obligation, incident) | ✅ | ✅ | ✅ | | | |
| POST evidence (action) | ✅ | ✅ | si responsable | si responsable | | |
| POST/PATCH risks, obligations, programs | ✅ | ✅ | | | | |
| POST incidents ; POST/PATCH grievances | ✅ | ✅ | ✅ | | | |
| PATCH incidents | ✅ | ✅ | | | | |
| POST actions | ✅ | ✅ | | | | |
| PATCH actions | ✅ | ✅ | si responsable | si responsable | | |
| GET reports | ✅ | ✅ | | | ✅ | ✅ |
| GET audit-log, verify | ✅ | ✅ | | | ✅ | ✅ |

## 8. Exemples `curl`

```bash
# Connexion
TOKEN=$(curl -s localhost:3000/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"site.siguiri@kalaya.demo","password":"demo1234"}' | jq -r .token)

# Mes données à fournir pour le T3
curl -s "localhost:3000/api/datapoints?queue=todo&period=2026-Q3" -H "authorization: Bearer $TOKEN" | jq '.[0]'

# Saisir, joindre une preuve, soumettre
curl -s -X PATCH localhost:3000/api/datapoints/123 -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"value":64,"comment":"Bassin B2 saturé"}'
curl -s localhost:3000/api/evidence -H "authorization: Bearer $TOKEN" \
  -F object_type=datapoint -F object_id=123 -F file=@analyse-labo.pdf
curl -s -X POST localhost:3000/api/datapoints/123/submit -H "authorization: Bearer $TOKEN"

# Rapport IFC du T2 en PDF (compte responsable ESG)
curl -s "localhost:3000/api/reports/ifc?period=2026-Q2&format=pdf" -H "authorization: Bearer $TOKEN_RSE" -o rapport-ifc.pdf
```

## 9. Contrat OpenAPI [À FAIRE]

Le CdC exige une documentation Swagger. Recommandation : écrire `server/openapi.yaml` (OpenAPI 3.1) à partir de ce fichier, le servir sur `/api/docs` en développement, et ajouter un test qui vérifie que chaque route enregistrée dans Express figure dans le contrat. Voir le prompt prêt à l'emploi dans 15-guide-vibe-coding.md.
