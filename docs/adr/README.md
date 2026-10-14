# Décisions d'architecture du socle de production

Les ADR 001 à 016 du MVP sont dans [`../dev/17-decisions-architecture.md`](../dev/17-decisions-architecture.md).
Ce dossier contient les décisions prises en posant le backend de production. Une nouvelle décision
structurante ajoute un fichier ici **avant** d'être implémentée.

| # | Décision | Statut |
|---|---|---|
| [015](015-postgresql.md) | PostgreSQL 16 partout, y compris en développement | Acceptée (remplace la proposition du MVP) |
| [017](017-rls-roles.md) | Row-Level Security et deux rôles PostgreSQL | Acceptée |
| [018](018-mfa-totp.md) | MFA TOTP implémentée sans dépendance | Acceptée |
| [019](019-transaction-par-route.md) | Une transaction par route, réponse après COMMIT | Acceptée |
| [020](020-express5-js.md) | Express 5 et JavaScript ESM conservé | Acceptée |
