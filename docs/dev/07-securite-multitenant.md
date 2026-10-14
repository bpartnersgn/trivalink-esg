# 07 · Sécurité, multi-tenant et auditabilité

La crédibilité de TRIVALINK devant un auditeur ou un prêteur repose sur trois promesses : **aucune fuite entre clients**, **chaque chiffre traçable**, **aucune modification silencieuse**. Ce fichier décrit comment le MVP les tient, et ce qui manque pour la production.

## 1. Isolation entre clients (multi-tenant)

### Mécanisme actuel : isolation logique applicative

1. Le jeton de session désigne un utilisateur ; l'utilisateur désigne une organisation. **L'`org_id` n'est jamais lu depuis la requête.**
2. Chaque requête SQL métier contient `org_id = ?` alimenté par `req.user.org_id`.
3. Les accès par identifiant utilisent le motif :
   ```js
   const row = q.get('SELECT * FROM risks WHERE id = ? AND org_id = ?', Number(req.params.id), req.user.org_id);
   if (!row) throw notFound('Risque');
   assertInScope(req.scope, row.entity_id);
   ```
4. Les identifiants référencés dans un corps de requête (entité, indicateur, responsable, origine d'une action, obligation liée) sont **revérifiés** comme appartenant à l'organisation (`ownerIn`, `SELECT id … AND org_id = ?`, `assertInScope`).
5. Les fichiers de preuve sont rangés par organisation (`evidence/<org_id>/…`) et ne sont servis qu'après vérification de l'objet et du périmètre.
6. La chaîne d'audit est **par organisation**.

Test de non-régression : `isolation entre clients` (le client SIL ne voit, ne lit, ne modifie, ne télécharge rien de Kalaya, et ne peut pas créer d'action sur une entité de Kalaya).

### Checklist pour toute nouvelle route

- [ ] La requête filtre `org_id = req.user.org_id`.
- [ ] L'objet lu par id est vérifié dans l'organisation **et** dans le périmètre (`assertInScope`).
- [ ] Tout id reçu dans le corps est revérifié (entité, utilisateur, indicateur, objet parent).
- [ ] Une jointure n'introduit pas de ligne d'un autre client (joindre sur des tables déjà filtrées, ou ajouter `AND x.org_id = ?`).
- [ ] Les listes sont filtrées par `req.scope` quand l'objet porte un `entity_id`.
- [ ] Un test d'isolation couvre la route (l'utilisateur `other` reçoit 404 ou une liste vide).

### Cible

- **PostgreSQL Row-Level Security** en plus du filtrage applicatif (défense en profondeur) : `SET LOCAL app.org_id = …` au début de chaque transaction, politiques `USING (org_id = current_setting('app.org_id')::bigint)` sur toutes les tables.
- **Base dédiée** pour l'offre Institution ou sur exigence contractuelle (DAT, option 2).
- Test automatisé qui parcourt **toutes** les routes `GET` avec l'utilisateur d'un autre client et vérifie l'absence de données.

## 2. Rôles et périmètres (RBAC)

Deux dimensions indépendantes :
- **Rôle** (`users.role`) : ce que l'utilisateur peut faire ;
- **Périmètre** (`users.scope_entity_id`) : sur quelles entités. `NULL` = toute l'organisation.

`scopeEntityIds(q, user)` calcule à chaque requête l'ensemble des ids (entité de rattachement + descendants) → `req.scope` (un `Set`).

| Rôle | Peut | Ne peut pas | Navigation front |
|---|---|---|---|
| `org_admin` | Tout ce que fait `esg_manager` + entités, utilisateurs, accès auditeur | — | Toutes les pages |
| `esg_manager` | Campagnes, revue/validation, risques, obligations, écarts, actions, programmes, rapports, seuils | Gérer utilisateurs et entités | Toutes ; la page Administration est visible mais en consultation (création d'utilisateurs et d'entités réservée à A), seuils d'indicateurs modifiables |
| `contributor` | Saisir, importer, joindre des preuves, soumettre ; déclarer écarts et griefs ; mettre à jour ses actions | Valider, rapports, journal d'audit | Tableau de bord, Collecte, Risques, Actions, Preuves |
| `action_owner` | Mettre à jour ses actions et y joindre des preuves | Saisir des données, rapports | Tableau de bord, Risques, Actions, Preuves |
| `executive` | Tout lire, rapports, journal d'audit | Toute écriture | Toutes sauf Collecte et Administration |
| `auditor` | Tout lire dans son périmètre, rapports, journal, preuves | Toute écriture ; au-delà de sa date d'expiration | Toutes sauf Administration |

La page d'accueil dépend du rôle : `contributor` → Collecte, `action_owner` → Actions, autres → Tableau de bord.

**Séparation des tâches** (RG-24) : saisie, revue et validation d'une donnée par trois personnes distinctes. Conséquence opérationnelle : un client doit avoir **au moins deux responsables ESG** (ou un administrateur et un responsable ESG) pour valider des données.

### Rôle manquant

**Administrateur TRIVALINK** (support et exploitation) [À FAIRE] : console séparée, provisionnement des organisations, **aucun accès aux données client** sans autorisation explicite et tracée (« break-glass » horodaté, visible du client dans son journal).

## 3. Authentification

| Élément | MVP | Production |
|---|---|---|
| Mots de passe | scrypt (N par défaut de Node), sel 16 octets, comparaison à temps constant | Conserver ; ajouter politique de complexité, vérification contre listes de mots de passe compromis |
| Session | Jeton opaque 256 bits, stocké en clair, durée 12 h fixe | Stocker `sha256(token)` ; expiration glissante + absolue ; purge des sessions expirées ; liste des sessions actives et révocation |
| MFA | Absente | **Obligatoire offres Entreprise et Institution** (CdC) : TOTP (RFC 6238) + codes de secours ; WebAuthn ensuite |
| SSO | Absent | OIDC/SAML pour les grands comptes (Azure AD, Google Workspace) |
| Anti brute-force | Absent | Limitation par IP et par compte sur `/auth/login` (ex. 5 essais / 15 min), délai progressif |
| Réinitialisation de mot de passe | Absente | Lien à usage unique par e-mail, expiration 30 min |
| Jeton en query string `?token=` | Accepté | **Supprimer** ; pour les téléchargements, utiliser `fetch` + blob (déjà fait par le front) ou des URL signées courtes |

## 4. Chiffrement

| Donnée | MVP | Production |
|---|---|---|
| Preuves au repos | AES-256-GCM, IV 12 octets aléatoire par fichier, tag d'authentification ; clé = SHA-256(`TRIVALINK_STORAGE_KEY`) | Clé gérée par un KMS (AWS KMS, GCP KMS, Vault), **une clé de données par organisation** (enveloppe), rotation |
| Valeur par défaut de la clé | `trivalink-dev-only-key-change-me` | **Refuser de démarrer en production** si la variable n'est pas définie |
| Base de données | Fichier SQLite non chiffré | PostgreSQL managé avec chiffrement au repos ; sauvegardes chiffrées |
| Transit | HTTP en local | **TLS 1.3** obligatoire (reverse proxy), HSTS |
| Intégrité des preuves | SHA-256 du fichier en clair, stocké en base | Conserver ; vérifier l'empreinte à chaque téléchargement |

Format d'un fichier chiffré sur disque : `[IV 12 octets][tag GCM 16 octets][contenu chiffré]`.

## 5. Piste d'audit infalsifiable

Exigence CdC : « Journal audit infalsifiable », « Logs immuables », « Horodatage UTC », « Identifiant unique modification ».

Implémentation (`core.js` `audit()` et `verifyAuditChain()`) :

```
hash_n = SHA-256( org_id | at | user_id | action | object_type | object_id | details | prev_hash )
prev_hash_n = hash_(n-1)   (ou "GENESIS" pour la première ligne de l'organisation)
```

- Insertion seule : triggers SQLite `BEFORE UPDATE` / `BEFORE DELETE` → `RAISE(ABORT)`.
- Vérification : `GET /api/audit-log/verify` recalcule toute la chaîne ; renvoie `broken_at` à la première rupture.
- Ce que cela garantit : toute modification ou suppression d'une ligne intermédiaire est détectée.
- Ce que cela **ne garantit pas** : un attaquant ayant un accès complet à la base pourrait réécrire toute la fin de la chaîne. Parades [CIBLE] :
  1. **ancrage périodique** du dernier hash hors de la base (stockage objet en mode WORM / Object Lock, ou envoi quotidien aux clients qui le souhaitent) ;
  2. rôle SQL applicatif sans droits `UPDATE`/`DELETE`/`TRUNCATE` sur `audit_log` ;
  3. horodatage qualifié (RFC 3161) des ancrages ; option blockchain évoquée par le DAT, non prioritaire.
- Concurrence : en SQLite (un seul processus, accès synchrone) l'ordre est garanti. **En PostgreSQL multi-instances, il faut sérialiser l'écriture par organisation** (`pg_advisory_xact_lock(org_id)`) sinon deux lignes peuvent référencer le même `prev_hash`.

### Événements tracés

| `action` | Déclencheur |
|---|---|
| `provision` | Création d'organisation (seed) |
| `login` | Connexion réussie |
| `create`, `update` | Création / modification de tout objet (détails avant/après) |
| `launch` | Lancement de campagne |
| `submit`, `review`, `validate`, `reject` | Workflow de validation |
| `import` | Ligne importée (fichier source, numéro de ligne) |
| `attach_evidence`, `download_evidence` | Dépôt et consultation de preuve |
| `auto_create` | Écart créé par dépassement de seuil |
| `close` | Clôture d'action (avec résultat mesuré) |
| `generate_report` | Génération de rapport (type, période, format, empreinte) |

[À FAIRE] tracer aussi : `logout`, échecs de connexion (dans un journal de sécurité séparé, sans chaîne client), changement de langue (non nécessaire), exports du journal.

## 6. Protection applicative (OWASP)

| Risque | État MVP | À faire |
|---|---|---|
| Injection SQL | Requêtes paramétrées partout. Les seuls noms de tables interpolés viennent de dictionnaires internes (`SOURCES`, `ENTITY_TABLES`, `objectEntity`) | Garder la règle : **jamais** de valeur utilisateur interpolée dans le SQL |
| Contrôle d'accès cassé | Org + périmètre + rôle à chaque route ; tests | Test automatique de toutes les routes (voir §1) |
| XSS | React échappe le contenu ; aucun `dangerouslySetInnerHTML` | En-têtes CSP |
| CSRF | Jeton porteur dans un en-tête (pas de cookie) → non exposé | Si passage aux cookies : `SameSite=Strict` + jeton CSRF |
| Upload | 20 Mo max, stocké chiffré, servi en `attachment` | Liste blanche de types MIME, analyse antivirus (ClamAV) avant mise à disposition |
| En-têtes de sécurité | `x-powered-by` désactivé | `helmet` (CSP, HSTS, X-Content-Type-Options, frame-ancestors) |
| Limitation de débit | Absente | `express-rate-limit` global (CdC : 1000 req/s plateforme) + strict sur login et upload |
| Divulgation d'erreurs | Erreurs 500 génériques | Journalisation structurée avec identifiant de corrélation |
| Dépendances | 4 dépendances serveur | `npm audit` en CI, Dependabot/Renovate |
| Énumération d'e-mails | Message identique pour e-mail inconnu et mauvais mot de passe | Conserver |
| Données personnelles | Noms, e-mails, griefs (peuvent contenir des données sensibles sur des riverains) | Registre des traitements, durée de conservation, droit d'accès, chiffrement des descriptions de griefs [à étudier] |

## 7. Conformité données personnelles

- **Guinée** : loi sur la protection des données à caractère personnel ; vérifier les exigences de localisation et de déclaration auprès de l'autorité compétente avant le premier pilote.
- **RGPD** : pour les clients ou maisons mères européens.
- **Clients publics** : hébergement local ou régional probablement exigé (voir 16, option d'hébergement).
- Principe de minimisation : les bénéficiaires de programmes sont comptés (`beneficiaries_actual`), **pas nominatifs** dans le MVP. Toute évolution vers un suivi nominatif (segment institutions) exige une analyse d'impact.

## 8. Écarts connus du MVP (à traiter avant le premier client réel)

Classés par priorité :

1. **P0** Clé de chiffrement par défaut acceptée → refuser le démarrage si `NODE_ENV=production` sans `TRIVALINK_STORAGE_KEY`.
2. **P0** Pas de HTTPS natif → reverse proxy TLS obligatoire.
3. **P0** Pas de limitation de débit sur `/auth/login`.
4. **P0** Mot de passe de démo `demo1234` et seed actif par défaut → `TRIVALINK_SEED=0` en production, impossible de créer la démo si `NODE_ENV=production`.
5. **P1** MFA absente (obligatoire Entreprise / Institution).
6. **P1** Jetons stockés en clair, sessions jamais purgées, jeton accepté en query string.
7. **P1** `GET /users` expose toute la liste (e-mails compris) à tous les rôles.
8. **P1** Pas de journal de sécurité (échecs de connexion, 403 répétés).
9. **P2** Pas d'antivirus sur les preuves ; pas de liste blanche MIME.
10. **P2** Pas d'ancrage externe de la chaîne d'audit.
11. **P2** Messages d'erreur uniquement en français.
