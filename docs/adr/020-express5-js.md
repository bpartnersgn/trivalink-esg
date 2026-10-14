# ADR-020 · Express 5 et JavaScript ESM

**Décision.** Express 5 (gestion native des promesses rejetées) au lieu d'Express 4. JavaScript
ESM conservé (ADR-014) pour porter les modules du MVP sans réécriture ; la migration vers
TypeScript (`// @ts-check` + JSDoc, puis `.ts`) reste recommandée et commencera par `core/`.
Dépendances d'exécution : `express`, `pg`. Les en-têtes de sécurité, les journaux JSON et la
limitation des connexions sont écrits dans le socle plutôt qu'ajoutés en dépendances.
