# 15 · Guide de vibe coding sur TRIVALINK

Comment développer TRIVALINK vite **avec** un assistant de code IA (Claude Code, Cursor, Copilot Chat, Windsurf…) sans sacrifier ce qui fait la valeur du produit : l'isolation entre clients, la preuve et la traçabilité.

> Le vibe coding est rapide pour produire du code plausible. TRIVALINK vend de la **confiance** à des auditeurs et des prêteurs : une fuite entre clients ou une donnée validée modifiable tuerait le produit. La méthode ci-dessous garde la vitesse et ajoute des garde-fous systématiques.

## 1. Mise en place (une fois)

1. **Copier `docs-dev/CLAUDE.md` à la racine du dépôt** (`trivalink/app/CLAUDE.md`). Claude Code le lit automatiquement. Pour Cursor : le copier aussi en `.cursor/rules/trivalink.mdc` (ou `.cursorrules`). Pour Copilot : `.github/copilot-instructions.md`. Pour les autres outils : `AGENTS.md`.
2. Copier `docs-dev/` dans le dépôt (`trivalink/app/docs-dev/` ou `docs/dev/`) pour que l'assistant puisse lire les fiches.
3. Vérifier que `npm test` passe : c'est le filet de sécurité de chaque session.
4. Configurer l'assistant pour qu'il **demande avant** d'exécuter des commandes destructrices (`rm -rf`, `git push --force`, suppression de `data/`).

## 2. La boucle de travail

```
1. Cadrer      → une user story (14) ou un bug, avec critères d'acceptation
2. Charger     → CLAUDE.md + 1 à 3 fiches docs-dev pertinentes + les fichiers de code concernés
3. Planifier   → demander un plan AVANT le code ; le relire ; corriger
4. Tester d'abord → faire écrire les tests qui échouent
5. Implémenter → petits pas, un module à la fois
6. Vérifier    → npm test ; lancer l'app ; tester en FR et EN ; rôle refusé ; autre client
7. Relire      → checklist de revue (12 §7) — par vous, puis par une seconde passe IA
8. Documenter  → mettre à jour 04 / 05 / 06 dans la même PR
```

Règles d'or de la session :
- **Une intention par session.** Nouvelle fonctionnalité = nouvelle conversation, contexte propre.
- **Plan d'abord pour tout ce qui touche au schéma, aux droits ou à la consolidation.**
- **Ne jamais accepter un diff que vous ne comprenez pas** dans `core.js`, `db.js`, `storage.js`, `metrics.js`, `app.js`.
- **Les tests ne se modifient pas pour faire passer le code.** Si l'IA veut changer une assertion existante, c'est un signal d'alerte : demander pourquoi.
- **Commiter souvent** (après chaque étape verte) : on peut revenir en arrière à bas coût.

## 3. Quel contexte donner selon la tâche

| Tâche | Fiches docs-dev | Fichiers de code |
|---|---|---|
| Nouvelle route ou nouvel objet métier | 04, 05, 06, 07, 12 | module concerné, `core.js`, `db.js`, `api.test.js` |
| Règle de validation / workflow | 06, 04 §4 | `collection.js`, `api.test.js` |
| Consolidation, tableau de bord | 10, 09, 06 §7 | `metrics.js`, `reporting.js` |
| Nouveau rapport | 10, 09 | `reporting.js` |
| Écran front | 08, 18, 05 | `App.jsx`, `ui.jsx`, `i18n.js`, page la plus proche |
| Hors ligne | 08 §6 | `api.js`, `App.jsx`, `Collection.jsx` |
| Sécurité / auth | 07, 16 | `app.js`, `core.js`, `org.js` |
| Indicateurs | 09 | `catalog.js`, `seed.js` |
| Migration PostgreSQL | 04 §5, 16, 17 | `db.js`, tous les modules |

Astuce : citer les règles par leur identifiant (« respecte RG-24 et RG-70 ») ; l'IA retrouve la définition dans 06.

## 4. Modèles de prompts

Remplacer les `<…>`. Ils supposent que `CLAUDE.md` est chargé.

### 4.1 Implémenter une user story

```
Lis docs-dev/14-roadmap-backlog.md (story <TL-XXX-n>), docs-dev/04-modele-de-donnees.md,
docs-dev/06-regles-metier.md et le module server/src/modules/<module>.js.

Objectif : implémenter <TL-XXX-n>.

Étape 1, plan uniquement (pas de code) :
- tables / colonnes ajoutées ou modifiées ;
- routes (méthode, chemin, rôles, corps, réponses, erreurs) ;
- nouvelles règles métier, avec un identifiant RG-xx proposé ;
- impacts : tableau de bord, rapports, preuves, actions, front, i18n ;
- liste des tests à écrire (nominal, rôle refusé, autre client, chaque règle).
Attends ma validation avant d'écrire du code.
```

Puis :

```
Plan validé avec ces corrections : <…>.
Étape 2 : écris d'abord les tests dans server/test/api.test.js (ils doivent échouer), lance npm test et montre-moi les échecs.
Étape 3 : implémente côté serveur en suivant l'anatomie de route de docs-dev/12 §2. Relance npm test jusqu'au vert.
Étape 4 : implémente le front (FR + EN). Ne touche à aucun autre module.
Étape 5 : mets à jour docs-dev/04, 05 et 06.
```

### 4.2 Corriger un bug

```
Bug : <comportement observé> ; attendu : <comportement attendu> ; reproduction : <compte de démo, étapes>.
1. Écris un test qui reproduit le bug et échoue.
2. Trouve la cause (cite le fichier et la ligne), explique-la en 3 lignes.
3. Corrige au plus petit diff possible, sans modifier les assertions existantes.
4. npm test doit être vert.
```

### 4.3 Revue de sécurité d'un diff

```
Agis comme auditeur sécurité de TRIVALINK. Relis le diff de la branche courante (git diff main)
avec docs-dev/07-securite-multitenant.md §1 (checklist) et docs-dev/12 §7.
Pour chaque route ajoutée ou modifiée, réponds :
- org_id vient-il de la session et est-il dans chaque requête ?
- chaque objet chargé par id est-il vérifié dans le périmètre ?
- chaque id reçu dans le corps est-il revérifié ?
- l'écriture est-elle auditée avec avant/après ?
- une donnée validée, une action close ou le journal peuvent-ils être modifiés ?
Liste les problèmes avec fichier:ligne et un correctif proposé. Ne modifie rien.
```

### 4.4 Ajouter un écran

```
Lis docs-dev/08-frontend.md, docs-dev/18-design-system.md et web/src/pages/<page la plus proche>.jsx.
Crée la page <Nom> qui <objectif>, accessible aux rôles <…>, en réutilisant uniquement les composants de ui.jsx
et les classes de styles.css. Tous les textes en t('…') avec leur traduction anglaise dans i18n.js.
Utilisable sur tablette. Affiche les erreurs serveur telles quelles. Pas de nouvelle dépendance.
Montre-moi ensuite la liste des libellés ajoutés.
```

### 4.5 Nouveau rapport ou nouveau référentiel

```
Lis docs-dev/10-reporting.md et docs-dev/09-referentiel-indicateurs.md, puis server/src/modules/reporting.js.
Ajoute le type de rapport '<type>' (<structure souhaitée, sections>) en réutilisant buildDashboard et kpiTable.
Seules les données validées. Empreinte SHA-256 conservée. Test JSON + PDF + XLSX.
Génère un PDF sur la démo (période 2026-Q2) et décris-moi sa mise en page page par page.
```

### 4.6 Migration de schéma

```
Lis docs-dev/04-modele-de-donnees.md et docs-dev/17-decisions-architecture.md (ADR-007).
Écris la migration <NNN_nom>.sql qui <changement>. Elle doit être idempotente si possible, ne jamais supprimer
de données, ne pas toucher à audit_log. Mets à jour db.js / le système de migrations, le seed, et docs-dev/04.
Explique comment la migration se comporte sur une base existante contenant la démo.
```

### 4.7 Contrat OpenAPI

```
Lis docs-dev/05-api-reference.md et tous les fichiers server/src/modules/*.js.
Génère server/openapi.yaml (OpenAPI 3.1) couvrant toutes les routes réellement enregistrées, avec schémas
de requête et de réponse, rôles en description, codes d'erreur. Ajoute un test qui liste les routes Express
(api.stack) et échoue si une route manque dans le contrat.
```

### 4.8 Expliquer du code

```
Explique-moi <fonction / fichier> comme à un nouveau développeur : rôle, entrées, sorties, règles métier
appliquées (identifiants RG de docs-dev/06), cas limites, et ce qui casserait si on la modifiait.
```

## 5. Garde-fous non négociables (à rappeler dans le prompt si l'IA dérive)

1. `org_id` **toujours** depuis `req.user`, **jamais** depuis le corps, l'URL ou la query.
2. `assertInScope` / filtre `req.scope` pour tout objet rattaché à une entité.
3. `audit()` pour toute écriture ; jamais d'`UPDATE` / `DELETE` sur `audit_log`.
4. Aucune route `DELETE` métier ; pas de modification d'une donnée `validated` ni d'une action `done`/`cancelled`.
5. Consolidation et rapports : statut `validated` uniquement.
6. Requêtes SQL paramétrées ; un nom de table interpolé ne vient que d'un dictionnaire interne.
7. Pas de nouvelle dépendance sans justification ; pas de framework (ORM, state manager, UI kit) sans ADR.
8. Messages d'erreur utilisateur en français, explicites ; textes UI en `t()` + traduction EN.
9. Ne pas affaiblir un test existant.
10. Ne pas committer de secret, de base `data/`, ni de vraie donnée client.

## 6. Signaux d'alerte dans une proposition d'IA

| Signal | Pourquoi c'est dangereux |
|---|---|
| `req.body.org_id`, `req.query.org_id` | Fuite entre clients |
| `SELECT * FROM x WHERE id = ?` sans `org_id` | Lecture d'un objet d'un autre client |
| Liste renvoyée sans `.filter(req.scope.has…)` | Contributeur qui voit les autres sites |
| `DELETE FROM` sur une table métier | Perte de traçabilité |
| Changement de `status` sans `audit()` | Piste d'audit trouée |
| `status IN ('submitted','validated')` dans une consolidation | Publication de données non validées |
| Une valeur `0` par défaut pour une donnée absente | Faux chiffre dans un rapport prêteur |
| Logique de droit uniquement dans le front | Contournable par un appel direct |
| `try { … } catch {}` silencieux côté serveur | Erreurs masquées |
| Ajout de `lodash`, `moment`, `axios`, un ORM… | Dépendances inutiles |
| Modification de `previousPeriod`, `aggregate`, `auditHash` « pour simplifier » | Casse les chiffres ou la chaîne existante |
| Assertion de test modifiée | Le code s'adapte au bug au lieu de l'inverse |

## 7. Vérifications après chaque session

```bash
npm test                       # vert
npm run build && npm start     # l'app démarre
git diff --stat                # le périmètre du diff correspond à l'intention
grep -rn "org_id" server/src/modules/<module>.js   # chaque requête nouvelle est filtrée
```

Puis à la main, 5 minutes :
- le parcours concerné avec le bon rôle ;
- avec un rôle qui ne doit pas pouvoir (bouton absent **et** 403 si on force l'appel) ;
- avec `admin@sil.demo` (rien de Kalaya) ;
- en anglais ;
- sur une largeur de tablette (DevTools 820 px).

## 8. Organisation d'équipe

- **Un pilote humain par fonctionnalité**, responsable du résultat, quelle que soit la part de code écrite par l'IA.
- **Revue humaine obligatoire** sur `core.js`, `db.js`, `storage.js`, `metrics.js`, `app.js`, les migrations et tout ce qui touche aux droits.
- **Seconde passe IA en revue** (prompt 4.3) avant la revue humaine : elle attrape les oublis d'`org_id` et d'`audit()`.
- Les fiches `docs-dev/` sont **le contexte partagé** de l'équipe et des assistants : une PR qui change le comportement met à jour la fiche. Une doc fausse produit du code faux.
- Garder les sessions courtes et ciblées : au-delà de ~1 heure ou si l'IA commence à tourner en rond, repartir d'une conversation neuve avec un résumé.
