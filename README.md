# TRIVALINK ESG

Plateforme SaaS multi-clients de **management ESG** pour les grandes entreprises, mines et groupes
industriels en Afrique. Boucle centrale : objectif → mesure → écart → action → résultat mesuré,
avec la preuve attachée à chaque chiffre.

## Contenu du dépôt

| Dossier | Contenu |
|---|---|
| `backend/` | API de production : Node 22, Express 5, PostgreSQL 16 avec Row-Level Security, MFA TOTP, piste d'audit chaînée |
| `docs/backend.md` | Socle backend : état, routes, comment porter un module |
| `docs/adr/` | Décisions d'architecture du socle (015, 017 à 020) |
| `docs/livrables/` | Les 10 livrables : brief, index, PRD, SFD, rôles, données, DAT, indicateurs, recette, budget |
| `docs/dev/` | Documentation développeur du MVP de référence (comportement fonctionnel attendu) |

## Démarrer

Prérequis : Node.js 22.13+, Docker (ou un PostgreSQL 16 local).

```bash
docker compose up -d db
cp .env.example .env
cd backend
npm ci
npm run dev        # http://localhost:3000/api/health
npm test
```

Ou tout en conteneurs : `docker compose up --build`.

Comptes de démonstration (mot de passe `trivalink-demo-2026`) : voir `CLAUDE.md`.

## Sécurité en bref

- Isolation des clients à deux niveaux : filtre applicatif `org_id` et politiques RLS PostgreSQL ;
  l'API tourne avec un rôle sans `BYPASSRLS` ni droit de suppression.
- Sessions : jeton opaque haché en base, expiration glissante (2 h) et absolue (12 h).
- MFA TOTP avec codes de secours, obligatoire par organisation si le client le demande.
- Anti force brute : 5 échecs / 15 min par compte (20 par adresse IP).
- Journal d'audit chaîné SHA-256, en ajout seul (droits + triggers), vérifiable par route.
- Preuves chiffrées AES-256-GCM avec une clé dérivée par organisation, empreinte revérifiée à la lecture.
- Refus de démarrer en production sans clé de chiffrement ou avec la démonstration.
