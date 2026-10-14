# ADR-017 · Row-Level Security et deux rôles PostgreSQL

**Contexte.** ADR-002 : isolation logique par `org_id`, avec RLS prévue en défense en profondeur.
docs-dev/07 : rôle applicatif sans `UPDATE`/`DELETE`/`TRUNCATE` sur `audit_log`.

**Décision.**
- `trivalink_owner` possède le schéma et exécute les migrations ; l'API ne l'utilise jamais.
- `trivalink_app` est le rôle de l'API : non propriétaire, sans `BYPASSRLS`, sans `DELETE` métier,
  `SELECT`/`INSERT` seulement sur `audit_log`, pas d'écriture sur `organizations` (hors `mfa_required`).
- Chaque table client a une politique `org_id = app_current_org()`. L'API pose
  `set_config('app.org_id', …, true)` (portée transaction) avant toute requête métier. Sans
  contexte, aucune ligne n'est visible.
- Le filtre applicatif `org_id = $1` reste **obligatoire** dans chaque requête : la RLS est un
  filet, pas une excuse.
- Les seules lectures hors organisation (connexion par e-mail, résolution du jeton, comptage des
  échecs, purge des sessions) passent par quatre fonctions `SECURITY DEFINER` qui ne renvoient
  que le strict nécessaire.

**Conséquences.** Un oubli de filtre ne fuit plus de données d'un autre client (testé dans
`database.test.js`). Une violation de politique (code 42501) est journalisée en erreur et renvoie
404. Le provisionnement d'une organisation exige le rôle propriétaire (console d'exploitation à
venir). Base dédiée par client (offre Institution) toujours possible avec le même schéma.
