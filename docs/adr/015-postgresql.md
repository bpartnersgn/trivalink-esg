# ADR-015 · PostgreSQL 16 partout

**Contexte.** ADR-003 (SQLite) était temporaire ; ADR-015 du MVP proposait PostgreSQL et laissait
ouverte la question du développement local. ADR-007 (pas de migrations) devait être remplacé avant
le premier client.

**Décision.**
- PostgreSQL 16 en production, en CI et en développement (Docker Compose). Plus de SQLite dans le
  backend de production : un seul dialecte SQL, les mêmes contraintes et la même RLS partout.
- Migrations versionnées `backend/db/migrations/NNN_nom.sql`, appliquées dans l'ordre, chacune dans
  sa transaction, sous verrou consultatif ; empreinte SHA-256 vérifiée (une migration livrée est
  immuable). Remplace ADR-007.
- Types du livrable 05 §9.2 : `bigint identity`, `timestamptz`, `date`, `numeric(20,6)` pour les
  valeurs, `numeric(14,2)` pour les montants, `boolean`, `jsonb`, période `char(7)` + `CHECK`.
- Pilote `pg`. `bigint` et `numeric` sont convertis en `Number` côté Node ; `date` reste une chaîne
  `AAAA-MM-JJ`. Les connexions travaillent en UTC.

**Conséquences.** Accès asynchrone : tout le code d'accès aux données devient `async` (les modules
du MVP seront portés en conséquence). Un développeur a besoin de Docker ou d'un PostgreSQL local.
Les valeurs `numeric` au-delà de 15 chiffres significatifs perdent en précision en `Number` : à
revoir si un indicateur l'exige.
