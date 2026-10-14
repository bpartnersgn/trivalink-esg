# TRIVALINK ESG · Instructions pour les assistants de code

TRIVALINK est une plateforme SaaS **multi-clients de management ESG** pour grandes entreprises, mines
et groupes industriels en Afrique (Guinée d'abord). Boucle centrale : **objectif → mesure → écart →
action → résultat mesuré**, avec la preuve attachée à chaque chiffre. Les chiffres sont montrés à des
auditeurs et des prêteurs (IFC) : exactitude, isolation et traçabilité priment sur tout.

- Spécifications : `docs/livrables/` (00 à 09). Documentation développeur du MVP : `docs/dev/`.
- Socle de production : `docs/backend.md`. Décisions : `docs/adr/` (et `docs/dev/17` pour 001-016).

## Pile et commandes (backend)

Node.js ≥ 22.13, ESM, Express 5, PostgreSQL 16 (`pg`). Aucune autre dépendance sans justification.

```bash
docker compose up -d db          # PostgreSQL 16 avec les rôles trivalink_owner / trivalink_app
cp .env.example .env
cd backend && npm ci
npm run dev                      # migrations + démonstration + API sur :3000
npm test                         # base jetable par fichier (TEST_DATABASE_ADMIN_URL)
npm run migrate                  # migrations seules (rôle propriétaire)
```

Comptes de démonstration, mot de passe `trivalink-demo-2026` : `admin@kalaya.demo`, `rse@kalaya.demo`,
`hse@kalaya.demo`, `site.boke@kalaya.demo`, `env.bauxite@kalaya.demo`, `dg@kalaya.demo`,
`auditeur@cabinet-es.demo`, `admin@sil.demo` (second client, preuve d'isolation).

## Règles impératives

1. **Isolation** : chaque route métier passe par `tenantRoute` (RLS) **et** filtre `org_id = req.user.org_id`.
   L'organisation ne vient jamais du client. Objet d'un autre client → 404.
2. **Périmètre** : objet rattaché à une entité → `assertInScope(req.scope, entity_id)` ou filtre par `req.scope`.
   Tout id reçu dans le corps est revérifié.
3. **Rôles côté serveur** : `requireRole(req.user, [...])`. Lecture seule globale pour `executive`/`auditor`.
4. **Audit** : toute écriture appelle `await audit(q, req.user, action, objectType, objectId, { before, after })`
   dans la même transaction. `audit_log` est en ajout seul.
5. **Immutabilité** : pas de `DELETE` métier ; donnée `validated`, action `done`/`cancelled` non modifiables.
6. **Consolidation** : données `validated` uniquement ; absence = `null`, jamais `0`.
7. **SQL paramétré** uniquement (`$1, $2…`).
8. **Anatomie d'une route** : `tenantRoute` → `requireRole` → chargement par id + org_id + périmètre →
   validation (`str`, `num`, `id`, `date`, `bad`) → règle métier → écriture → `audit()` → `return`.
   Création = `return created(id)` (201).
9. **Erreurs** : `bad()`, `forbidden()`, `notFound()` avec un message **en français** qui explique la règle.
10. **Schéma** : une nouvelle migration `NNN_nom.sql` ; ne jamais modifier une migration livrée ;
    activer la RLS et accorder les droits à `trivalink_app` sur toute nouvelle table client.
11. **Tests** : toute route ou règle a ses tests (nominal, rôle refusé, autre client, règle).
    Ne jamais affaiblir une assertion. `npm test` vert avant de dire que c'est fini.
12. **Docs** : mettre à jour `docs/backend.md` et, si le contrat change, `docs/dev/04`, `05`, `06`.

## Style

ESM, 2 espaces, guillemets simples, points-virgules. Identifiants en anglais, `snake_case` pour SQL et
JSON d'API, commentaires et messages en français. Imiter le module existant le plus proche. Petits diffs.

## Façon de travailler

- Schéma, droits, consolidation ou rapports : proposer un plan avant d'écrire du code.
- Signaler toute incohérence entre `docs/` et le code plutôt que de deviner.
- Ne jamais utiliser les anciens noms ORCHEA, TRIVANCE ou XEYRO.
