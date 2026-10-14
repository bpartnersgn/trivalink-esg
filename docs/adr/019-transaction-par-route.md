# ADR-019 · Une transaction par route, réponse après COMMIT

**Contexte.** Avec PostgreSQL et la RLS, chaque requête métier doit s'exécuter avec le contexte
d'organisation. La piste d'audit doit être écrite dans la même transaction que l'écriture qu'elle
trace, sérialisée par organisation (`pg_advisory_xact_lock`).

**Décision.** `tenantRoute(pool, async (req, q) => résultat)` ouvre une transaction, pose
`app.org_id`, calcule `req.scope`, exécute le gestionnaire et ne répond qu'**après** le COMMIT.
Le gestionnaire **renvoie** sa réponse (objet, ou `created(id)` pour un 201) au lieu d'appeler
`res.json`. Toute exception annule la transaction : une écriture et sa ligne d'audit sont
validées ensemble ou pas du tout.

**Conséquences.** Plus de réponse 200 suivie d'un échec de COMMIT. Les écritures d'une même
organisation sont sérialisées au moment de l'audit : acceptable au volume visé (livrable 05 §8),
à surveiller. Les téléchargements de fichiers auront une variante de l'enveloppe.
