# Backend de production · socle

Ce document décrit ce qui est en place dans `backend/` et comment y ajouter un module.
Le comportement fonctionnel de référence reste celui du MVP (`docs/dev/`, livrables 03 à 08).

## 1. Ce qui est en place

| Chantier (docs/dev/14) | État |
|---|---|
| TL-PROD-1 PostgreSQL + migrations | ✅ 18 tables du MVP portées (001), sécurité d'authentification (002), runner versionné |
| TL-PROD-3 Configuration et secrets | ✅ `src/config.js` validé au démarrage ; refus en production sans clé ou avec la démo |
| TL-PROD-4 MFA TOTP | ✅ enrôlement, connexion en deux étapes, codes de secours, MFA obligatoire par client, réinitialisation |
| TL-PROD-5 Sessions durcies | ✅ jeton haché, expiration glissante 2 h et absolue 12 h, purge, jeton en URL refusé, 5 échecs / 15 min |
| TL-PROD-7 Intégration continue | ✅ GitHub Actions sur PostgreSQL 16 (tests, `npm audit`) ; déploiement staging à faire |
| TL-PROD-8 Observabilité | 🟡 journaux JSON avec identifiant de requête, `/api/health` (base + stockage) ; métriques à faire |
| TL-PROD-2 Stockage objet | 🟡 interface et pilote disque chiffré (clé par organisation, empreinte revérifiée) ; pilote S3 à faire |
| TL-PROD-6 Invitation et mot de passe oublié | ❌ dépend d'un service d'e-mail |
| RLS PostgreSQL (ADR-017) | ✅ sur toutes les tables client, testée |
| Modules métier | 🟡 `org` (entités, utilisateurs, politiques, paramètres) et journal d'audit portés ; strategy, collection, risk, actions, reporting à porter |

## 2. Arborescence

```
backend/
├── db/init/              rôles PostgreSQL (trivalink_owner, trivalink_app) et base de dev
├── db/migrations/        NNN_nom.sql, immuables une fois livrées
├── scripts/              migrate.js, seed.js
├── src/
│   ├── server.js         démarrage : config, migrations, démo, API, purge des sessions
│   ├── app.js            Express : corrélation, en-têtes, authentification, lecture seule, erreurs
│   ├── config.js         toutes les variables d'environnement
│   ├── seed.js           démonstration Kalaya + SIL (jamais en production)
│   ├── db/pool.js        pool pg, q.all/get/run, withTx, withTenant
│   ├── db/migrate.js     runner de migrations
│   ├── core/             errors, http (tenantRoute), rbac, audit, crypto, passwords, totp, sessions, validate, periods, logger
│   ├── storage/          preuves chiffrées (pilote disque)
│   └── modules/          auth, org, audit (+ modules métier à porter)
└── test/                 node:test, une base jetable par fichier
```

## 3. Routes du socle

| Route | Rôles | Notes |
|---|---|---|
| `GET /api/health` | ouvert | 503 si la base ou le stockage est indisponible |
| `POST /api/auth/login` | ouvert | `{ token, user }` ou `{ mfa_required, mfa_token }` ; 429 après 5 échecs / 15 min |
| `POST /api/auth/mfa` | ouvert | `{ mfa_token, code }` ou `{ mfa_token, recovery_code }` |
| `POST /api/auth/logout` | tous | |
| `GET /api/me`, `PATCH /api/me` | tous | `PATCH` : langue, permis aux rôles en lecture seule |
| `POST /api/me/password` | tous | ferme les autres sessions |
| `POST /api/me/mfa/setup`, `/confirm`, `/disable` | tous | `confirm` renvoie les 10 codes de secours |
| `GET /api/organization` / `PATCH` | tous / A | `PATCH { mfa_required }` |
| `GET /api/entities` / `POST` | tous (périmètre) / A | |
| `GET /api/users` / `POST` / `PATCH /:id` | tous / A / A | e-mails visibles de A seulement ; `PATCH { mfa_reset: true }` |
| `GET /api/policies` / `POST` | tous / A, M | |
| `GET /api/audit-log`, `/audit-log/verify` | A, M, E, Au | pagination `?before=<id>&limit=` |

Erreurs : toujours `{ error, code }` (`bad_request`, `unauthorized`, `expired`, `mfa_invalid`,
`forbidden`, `mfa_enrollment_required`, `not_found`, `conflict`, `too_many_requests`, `internal`).

## 4. Porter un module du MVP

1. Lire le module du MVP et ses règles (`docs/dev/06`, livrable 04 pour les droits).
2. Ajouter une migration si le schéma change (jamais modifier 001 ou 002).
3. Écrire chaque route avec l'anatomie suivante :

```js
api.patch('/risks/:id', tenantRoute(pool, async (req, q) => {
  requireRole(req.user, MANAGERS);                                   // rôle
  const r = await q.get('SELECT * FROM risks WHERE id = $1 AND org_id = $2',
    id(req.params.id), req.user.org_id);                             // organisation (filtre explicite)
  if (!r) throw notFound('Risque');
  assertInScope(req.scope, r.entity_id);                             // périmètre
  const likelihood = num(req.body?.likelihood);                      // validation
  if (likelihood != null && (likelihood < 1 || likelihood > 5)) throw bad('Probabilité entre 1 et 5');
  await q.run('UPDATE risks SET likelihood = COALESCE($1, likelihood) WHERE id = $2', likelihood, r.id);
  await audit(q, req.user, 'update', 'risk', r.id, { before: r, after: req.body }); // même transaction
  return { ok: true };                                               // réponse envoyée après COMMIT
}));
```

4. Tests : nominal, rôle refusé, autre client (404 ou liste vide), règle métier.
5. Mettre à jour ce document et `docs/dev/04`, `05`, `06` si le contrat change.

Différences avec le MVP à garder en tête : placeholders `$1, $2…` ; tout est `async` ;
`RETURNING id` au lieu de `lastInsertRowid` ; booléens natifs ; la route **renvoie** sa réponse.
