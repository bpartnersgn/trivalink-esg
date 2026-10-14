# 12 · Conventions de code et recettes

Objectif : que chaque nouveau fichier ressemble au code existant, qu'il soit écrit par un humain ou par une IA. **En cas de doute, imiter le module le plus proche.**

## 1. Conventions générales

| Sujet | Règle |
|---|---|
| Langage | JavaScript moderne, **ESM** (`import`/`export`, `"type": "module"`), Node ≥ 22.13 |
| Style | 2 espaces, guillemets simples, points-virgules, virgule finale en multiligne, lignes ≤ 160 car. environ |
| Nommage | `camelCase` pour variables et fonctions ; `PascalCase` pour composants React ; `UPPER_SNAKE` pour constantes ; **`snake_case` pour les colonnes SQL et les champs JSON de l'API** |
| Langue du code | Identifiants en anglais (`datapoint`, `obligation`) ; **commentaires, messages d'erreur et textes d'interface en français** |
| Commentaires | Rares, en tête de fichier (rôle du module) et sur les règles non évidentes. Pas de commentaire qui paraphrase le code. |
| Dépendances | **Minimum.** Toute nouvelle dépendance npm doit être justifiée dans la PR (pourquoi pas `node:*` ?), maintenue, sans dépendance native si possible. |
| Fichiers | Un module serveur par domaine ; une page front par écran. Un fichier > 600 lignes doit être découpé. |
| Formatage des dates | ISO 8601 ; `new Date().toISOString()` pour un horodatage ; `.slice(0, 10)` pour une date |

[À FAIRE] Ajouter ESLint (flat config, `eslint:recommended` + `plugin:react-hooks`) et Prettier avec ces règles, et un `npm run lint` en CI.

## 2. Anatomie d'une route serveur

Toujours dans cet ordre : **rôle → chargement scopé → règles → écriture → audit → réponse**.

```js
api.patch('/obligations/:id', h((req, res) => {
  requireRole(req.user, MANAGERS);                          // 1. rôle
  const o = one(req, 'obligations', 'Obligation');          // 2. chargement : org_id + périmètre, sinon 404
  const status = req.body?.status;                          // 3. validation des entrées
  if (!['not_started', 'in_progress', 'compliant', 'non_compliant'].includes(status)) throw bad('Statut invalide');
  if (status === 'compliant') {                             // 4. règle métier
    const ev = q.get("SELECT COUNT(*) AS n FROM evidence WHERE org_id = ? AND object_type = 'obligation' AND object_id = ?", req.user.org_id, o.id).n;
    if (!ev) throw bad('Joignez une preuve avant de déclarer cette obligation conforme');
  }
  q.run('UPDATE obligations SET status = ? WHERE id = ?', status, o.id);   // 5. écriture
  audit(q, req.user, 'update', 'obligation', o.id, { before: o.status, after: status }); // 6. audit avant/après
  res.json({ ok: true });                                   // 7. réponse
}));
```

Règles :
- Envelopper **chaque** gestionnaire dans `h(...)`.
- Lever des `HttpError` via `bad()`, `forbidden()`, `notFound()` ; jamais `res.status(400)` à la main (sauf `/auth/login`).
- Lire les champs avec `str(v, 'libellé', { required })` et `num(v)` ; convertir les ids avec `Number(...)`.
- Plusieurs écritures liées → `q.tx(() => { … })`.
- Une création renvoie `res.status(201).json({ id })`.
- L'`audit()` contient assez de détails pour reconstituer l'avant/après sans autre table.
- Les messages d'erreur disent **la règle et la sortie** (« Créez au moins une action corrective avant de clore cet écart »).

## 3. Recette : ajouter une entité métier (ex. « contrôles internes »)

1. **Schéma** (`db.js`) : `CREATE TABLE IF NOT EXISTS controls (id INTEGER PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id), entity_id INTEGER NOT NULL REFERENCES entities(id), …, created_at TEXT NOT NULL DEFAULT (datetime('now')))`. Énumérations en `CHECK`. Index `(org_id, entity_id)`.
   - ⚠️ Sur une base existante, `CREATE TABLE IF NOT EXISTS` suffit pour une **nouvelle** table, mais pas pour ajouter une colonne : il faut une migration (voir §6).
2. **Module** : soit dans le module du domaine (`risk.js` pour un contrôle), soit un nouveau `modules/controls.js` exportant `default function controlsModule(api, { q })`, monté dans `app.js`.
3. **Routes** : `GET` liste filtrée par `org_id` puis `req.scope` ; `POST` avec `requireRole`, `assertInScope(req.scope, b.entity_id)`, `ownerIn()` ; `PATCH` avec `one()` ; audit partout.
4. **Preuves** : si l'objet porte des preuves, ajouter le type à `CHECK (object_type IN (…))` de `evidence`, à `objectEntity()` (collection.js) et à `ENTITY_TABLES` (reporting.js, pour le filtrage du journal).
5. **Actions** : si l'objet peut déclencher une action, ajouter le type à `actions.source_type` (`CHECK`) et à `SOURCES` (actions.js).
6. **Tableau de bord / rapports** : ajouter le bloc dans `buildDashboard()` et les sections concernées de `buildReport()`.
7. **Front** : onglet ou page, formulaire (`FormModal` dans Risks.jsx est un modèle générique), libellés FR + EN dans `i18n.js`, couleurs de statut dans `TONE` (ui.jsx).
8. **Tests** : isolation (autre client → 404 / liste vide), périmètre, rôles, chaque règle métier.
9. **Documentation** : 04 (table), 05 (routes), 06 (règles RG-xx), 02 (glossaire).

## 4. Recette : ajouter une règle métier

1. Lui donner un identifiant `RG-xx` dans 06-regles-metier.md.
2. L'implémenter **dans la route serveur**, avant l'écriture, avec un message utilisateur explicite.
3. Écrire le test qui échoue sans la règle (statut + message).
4. Optionnel : la refléter dans le front (bouton désactivé, avertissement) **sans** la dupliquer en logique bloquante.

## 5. Recette : ajouter une page front

```jsx
// pages/Controls.jsx
import { api } from '../api.js';
import { useSession, isManager } from '../session.js';
import { useT } from '../i18n.js';
import { useLoad, Badge, Loading, ErrorBox, Empty } from '../ui.jsx';

export default function Controls() {
  const session = useSession();
  const { t } = useT();
  const { data, error, reload } = useLoad(() => api('/controls'), []);
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  return (
    <div>
      <div className="page-head"><div><h1>{t('Contrôles internes')}</h1></div></div>
      <section className="card">
        {!data.length ? <Empty /> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>{t('Titre')}</th><th>{t('Statut')}</th></tr></thead>
            <tbody>{data.map((c) => <tr key={c.id}><td>{c.title}</td><td><Badge status={c.status} /></td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
```

Puis : import + entrée `NAV` + branche de routage dans `App.jsx`, traductions dans `EN` (`'Contrôles internes': 'Internal controls'`).

## 6. Évolution du schéma (migrations)

Le MVP n'a pas de système de migrations (ADR-007). Tant que seules des bases de démonstration existent, `npm run reset-demo` suffit. **Avant le premier client réel**, mettre en place :

```
server/migrations/
  001_init.sql            le schéma actuel
  002_indicator_mappings.sql
  …
```

- Table `schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT)`.
- Au démarrage, appliquer dans une transaction les fichiers non appliqués, dans l'ordre.
- Une migration n'est **jamais modifiée** une fois fusionnée ; on en ajoute une nouvelle.
- Avec PostgreSQL : node-pg-migrate, Knex migrations ou équivalent, au choix de l'équipe (une seule).

## 7. Git et revue

| Sujet | Règle |
|---|---|
| Branches | `main` toujours déployable ; branches `feat/…`, `fix/…`, `docs/…`, `chore/…` |
| Commits | Impératif, en français ou anglais mais cohérent : `feat(actions): exiger une preuve à la clôture` |
| PR | Petite (< 400 lignes hors tests), une intention ; description Avant / Après / Comment ; règles RG-xx citées ; captures si UI |
| CI [À FAIRE] | `npm ci`, `npm test`, `npm run build`, lint, `npm audit --omit=dev` |
| Fusion | Après revue humaine, CI verte |

### Checklist de revue (à coller dans le modèle de PR)

**Sécurité / multi-tenant**
- [ ] Chaque requête filtre `org_id` depuis la session.
- [ ] Chaque objet par id est vérifié dans le périmètre (`assertInScope` / `one()`).
- [ ] Chaque id du corps est revérifié.
- [ ] Aucun champ utilisateur n'est interpolé dans du SQL.
- [ ] Les rôles sont vérifiés côté serveur.

**Traçabilité**
- [ ] Chaque écriture appelle `audit()` avec avant/après.
- [ ] Aucune route ne supprime ni ne modifie une donnée validée, une action clôturée, une ligne d'audit.

**Métier**
- [ ] Les règles RG-xx concernées sont respectées et testées.
- [ ] Les consolidations n'utilisent que des données `validated`.
- [ ] Une absence de valeur reste `null` (pas 0).

**Front**
- [ ] Textes en `t('…')` et traduits en EN.
- [ ] Utilisable sur tablette ; saisie hors ligne non cassée.
- [ ] Erreurs serveur affichées telles quelles.

**Qualité**
- [ ] `npm test` vert ; nouveaux tests ajoutés.
- [ ] Documentation `docs-dev/` mise à jour (04, 05, 06 au minimum si concernés).
