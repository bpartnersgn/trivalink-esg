# 13 · Tests et qualité

## 1. Tests existants

`server/test/api.test.js`, runner `node:test`, assertions `node:assert/strict`. Chaque exécution crée une base SQLite et un dossier de preuves **temporaires**, charge la démonstration, démarre le serveur sur un port libre et l'appelle avec `fetch`.

```bash
cd trivalink/app && npm test
# tests 6 · pass 6 · fail 0   (13/10/2026, Node 22.22, ≈ 2,5 s)
```

| Test | Ce qu'il prouve | Règles |
|---|---|---|
| isolation entre clients | Un autre client ne voit, ne lit, ne modifie, ne télécharge rien ; ne peut pas créer d'action sur une entité étrangère ; journal limité à son organisation | RG-01 |
| périmètre | Un contributeur de site ne voit que son site ; une donnée d'un autre site → 404 | RG-02 |
| auditeur lecture seule et chaîne | POST → 403 ; tableau de bord lisible ; chaîne intègre ; `UPDATE`/`DELETE` sur `audit_log` impossibles | RG-03, RG-71 |
| boucle complète | Saisie → refus sans preuve → preuve → soumission hors seuil → écart auto → séparation revue/validation → clôture d'écart refusée sans action → action avec valeur de départ automatique → clôture refusée sans mesure postérieure → nouvelle campagne T4 → mesure validée → clôture avec résultat atteint → écart clos → historique complet → chaîne intègre | RG-23, 24, 25, 31, 34, 51, 53, 57, 70, 71 |
| rapports | IFC et GRI en JSON (≥ 5 sections, empreinte 64 hex), PDF (`%PDF`), XLSX (`PK`) ; contributeur → 403 | RG-08, RG-72 |
| import CSV | 1 ligne importée, 2 erreurs (indicateur inconnu, entité hors périmètre) | RG-29 |

Helpers disponibles dans le fichier : `call(who, method, url, body, { form })`, `login(who, email)`, `evidenceForm(type, id, name)`, `tokens`, `ctx` (accès direct à la base pour simuler le temps, ex. reculer `created_at`).

## 2. Écrire un test

```js
test('une obligation ne peut pas être déclarée conforme sans preuve', async () => {
  const o = (await call('rse', 'GET', '/api/obligations')).body.find((x) => x.evidence_count === 0);
  const r = await call('rse', 'PATCH', `/api/obligations/${o.id}`, { status: 'compliant' });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /preuve/);
  assert.equal((await call('rse', 'POST', '/api/evidence', undefined, { form: evidenceForm('obligation', o.id) })).status, 201);
  assert.equal((await call('rse', 'PATCH', `/api/obligations/${o.id}`, { status: 'compliant' })).status, 200);
});
```

Bonnes pratiques :
- Les tests partagent la même base (ordre d'exécution séquentiel) : **ne pas dépendre d'un état modifié par un autre test** ou le documenter ; préférer créer ses propres objets.
- Tester le **statut HTTP et le message** (le message est l'interface utilisateur).
- Pour toute nouvelle route : un cas nominal, un cas de rôle refusé, un cas d'isolation, un cas par règle métier.
- Pour le temps : manipuler `created_at` via `ctx.q.run(...)` plutôt que d'attendre.

## 3. Tests à ajouter (backlog qualité, par priorité)

| P | Test | Règle |
|---|---|---|
| P0 | **Balayage d'isolation automatique** : pour chaque route GET de liste, l'utilisateur `other` reçoit `[]` ; pour chaque route par id, 404 avec un id de Kalaya | RG-01 |
| P0 | Accès auditeur expiré : connexion 401 `expired` ; session existante refusée après la date | RG-04 |
| P0 | Obligation conforme sans preuve refusée | RG-40 |
| P0 | Rejet : motif obligatoire, resoumission, motif effacé | RG-26 |
| P1 | Campagne : niveaux site / groupe, absence de doublons au relancement | RG-20, 21 |
| P1 | Actions : droits (non-responsable 403, annulation réservée), action close non modifiable, passage à 10 % | RG-52, 54, 55 |
| P1 | Griefs : résolution obligatoire | RG-41 |
| P1 | Entités : site sans enfant, filiale avec parent | RG-10 |
| P1 | Utilisateurs : auditeur sans expiration refusé, auto-désactivation refusée, désactivation coupe les sessions | RG-04, 05, 06 |
| P1 | Consolidation : somme / moyenne / max sur un sous-arbre, `null` sans donnée, données non validées exclues | RG-60, 61 |
| P1 | Objectifs : `met` et `progress` pour `lower`, `higher`, `neutral` | RG-63, 64 |
| P2 | Altération du journal détectée (copie de la base, modification hors triggers, `verify` → `broken_at`) | RG-71 |
| P2 | Empreinte de rapport stable entre deux générations | RG-72 |
| P2 | Import XLSX (cellules formules, décimales à virgule, séparateur `,`) | RG-29 |
| P2 | Upload > 20 Mo refusé | — |

## 4. Tests unitaires

Les fonctions pures se testent sans serveur : `isBreach`, `aggregate`, `progressTowards`, `previousPeriod`, `isPeriod`, `periodOfDate`, `subtree`, `verifyAuditChain` (base `:memory:`), `saveFile`/`readFile`. Créer `server/test/unit.test.js`.

Exigence CdC : **couverture > 80 %**. Mesure : `node --test --experimental-test-coverage test/*.test.js`.

## 5. Tests front [À FAIRE]

| Outil | Cible |
|---|---|
| Vitest + Testing Library | `api.js` : mise en file hors ligne, rejeu ordonné, arrêt si toujours hors ligne, retrait d'une opération refusée ; `EntryRow` : alerte hors seuil, bouton preuve |
| Playwright (Chromium) | Scénario de référence de bout en bout (01 §5) en FR et en EN, y compris coupure réseau (`context.setOffline(true)`) ; regénération des captures `docs/captures/` |
| axe-core (via Playwright) | Accessibilité WCAG 2.1 AA des pages principales |

## 6. Tests de performance et de charge [À FAIRE]

Critères d'acceptation CdC / PRD :

| Critère | Mesure |
|---|---|
| 100 000 enregistrements sans dégradation | Script de génération (≈ 20 sites × 44 KPI × 8 trimestres × … ) puis chronométrage |
| Tableau de bord < 3 s | `GET /api/dashboard` groupe, période la plus chargée |
| Rapport < 30 s | `GET /api/reports/ifc?format=pdf` |
| 1000 req/s (passerelle) | k6 ou autocannon sur `/api/health` et `/api/datapoints?queue=todo` |
| 50 000+ entrées / an / client | Projection à partir du jeu ci-dessus |

## 7. Critères d'acceptation globaux (CdC §12) et état

| Critère | État MVP |
|---|---|
| Isolation multi-tenant prouvée | ✅ test d'isolation ; à étendre en balayage automatique |
| Export GRI & ISSB fonctionnel | GRI ✅ ; ISSB ❌ (phase 2) |
| 100 000 enregistrements testés sans dégradation | ❌ à mesurer |
| Rapport ESG complet généré | ✅ IFC + GRI, PDF + Excel |
| Journal d'audit infalsifiable | ✅ chaîne + triggers ; ancrage externe à faire |

## 8. Sécurité

- `npm audit --omit=dev` en CI.
- Revue de sécurité avant chaque mise en production (checklist 07 §6 et §8).
- Pentest externe annuel (CdC), le premier avant le passage en abonnement payant des pilotes.
