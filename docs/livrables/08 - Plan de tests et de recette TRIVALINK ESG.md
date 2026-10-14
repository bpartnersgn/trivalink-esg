# 08 · Plan de tests et de recette · TRIVALINK ESG

| | |
|---|---|
| **Version** | 1.0 · 13 octobre 2026 |
| **Statut** | Rédigé. Tests automatisés existants : **6/6 au vert** (Node 22.22, 13/10/2026) |
| **Code des tests** | `app/server/test/api.test.js` (runner `node:test`, `npm test`) |
| **Documents liés** | 02 PRD (exigences EF / ENF), 03 SFD (SF-xxx), 04 Rôles (P-xxx-nn), 05 Données, 06 DAT, 07 Indicateurs, `docs-dev/06-regles-metier.md` (RG-xx), `docs-dev/13-tests-qualite.md` |

Ce plan dit **comment on prouve que TRIVALINK fait ce qu'il promet** : la stratégie de test, le catalogue des cas de test (TC-xxx-nn) reliés aux règles et aux permissions, la recette avec les clients pilotes, la gestion des anomalies et les critères pour passer en production.

---

## 1. Objectifs et périmètre

### 1.1 Ce que les tests doivent garantir, par ordre d'importance

1. **Aucune fuite entre clients** ni hors périmètre (EF-SOC-01, ENF-06).
2. **Aucun chiffre publié sans validation ni preuve** (EF-COL-04, EF-COL-05).
3. **La boucle écart → action → résultat mesuré** se comporte comme spécifié (EF-RSK-04, EF-RSK-06, EF-ACT-04).
4. **Le journal d'audit est complet et inaltérable** (EF-SOC-04).
5. **Les rapports sont justes, reproductibles et empreintés** (EF-REP-03).
6. **La saisie fonctionne sur le terrain**, y compris hors ligne et sur mobile (EF-SOC-06, ENF-14).
7. Performance, disponibilité et sécurité au niveau du CdC (ENF-01 à ENF-13).

### 1.2 Périmètre

| Inclus | Exclu (phase ultérieure) |
|---|---|
| API (55 routes), règles métier RG-01 à RG-73, permissions P-xxx-nn | Intégrations ERP / SIRH / IoT |
| Interface web FR / EN, desktop et mobile | Application mobile native |
| File hors ligne du navigateur | Synchronisation PWA complète |
| Rapports IFC et index GRI (JSON, PDF, Excel) | Rapports ISSB, ESRS |
| Sécurité applicative, isolation, audit | Certification ISO 27001 |
| Performance au volume du CdC | Charge à 10 000 utilisateurs simultanés (cible 24 mois) |

## 2. Stratégie

### 2.1 Niveaux de test

| Niveau | Outil | Ce qu'il couvre | État |
|---|---|---|---|
| Unitaire | `node:test` | Fonctions pures : `isBreach`, `aggregate`, `progressTowards`, `previousPeriod`, `isPeriod`, `subtree`, `verifyAuditChain`, chiffrement | [À FAIRE] `server/test/unit.test.js` |
| API de bout en bout | `node:test` + `fetch` sur serveur réel, base et preuves temporaires | Règles métier, rôles, isolation, rapports | **[MVP] 6 tests** |
| Composants front | Vitest + Testing Library | `api.js` (file hors ligne), saisie, alertes | [À FAIRE] |
| Bout en bout navigateur | Playwright (Chromium préinstallé) | Parcours utilisateurs FR / EN, hors ligne (`context.setOffline(true)`) | [À FAIRE] |
| Accessibilité | axe-core via Playwright | WCAG 2.1 AA des pages principales | [À FAIRE] |
| Performance | Script de volume + autocannon / k6 | ENF-01, 02, 05 | [À FAIRE] |
| Sécurité | `npm audit`, balayage d'isolation, pentest externe | OWASP, isolation | Partiel |
| Recette métier | Scénarios avec les pilotes (§6) | Adéquation au besoin | À planifier |

### 2.2 Pyramide visée

Beaucoup de tests API (rapides, ils couvrent les règles qui comptent), quelques parcours Playwright (les 6 scénarios de recette), des tests unitaires sur les calculs. **Toute règle métier a au moins un test API** ; toute route a un cas nominal, un cas de rôle refusé, un cas d'isolation et un cas par règle.

### 2.3 Environnements et données

| Environnement | Usage | Données |
|---|---|---|
| Poste développeur | `npm test`, développement | Base et preuves temporaires créées par chaque exécution, démo Kalaya + SIL |
| CI | Tests à chaque PR | Idem, `npm ci` propre |
| Staging | Playwright, performance, recette interne, démonstrations | Démo + jeu volumineux synthétique ; **jamais de données client** |
| Pilote (production) | Recette utilisateur | Données réelles du client |

Comptes de test : ceux de la démonstration (04 §3.2), mot de passe `demo1234`. Le second client `admin@sil.demo` sert à tous les tests d'isolation.

### 2.4 Convention des cas de test

`TC-<domaine>-<nn>` : SEC sécurité, ADM administration, STR stratégie, COL collecte, RSK risques et conformité, ACT actions, REP reporting et tableau de bord, OFF hors ligne, UI interface, PERF performance.
Priorité : **P0** bloquant pour un client réel · **P1** avant la fin des pilotes · **P2** amélioration.
État : ✅ automatisé et vert · 🟡 partiellement couvert · ❌ à écrire.

## 3. Tests automatisés existants

```bash
cd trivalink/app && npm test
# tests 6 · pass 6 · fail 0   (13/10/2026, Node 22.22, environ 2,5 s)
```

| Test (`api.test.js`) | Cas couverts | Règles |
|---|---|---|
| isolation entre clients | TC-SEC-01 | RG-01 |
| périmètre | TC-SEC-02 | RG-02 |
| auditeur lecture seule et chaîne d'audit | TC-SEC-03, TC-SEC-05 | RG-03, RG-71 |
| boucle complète | TC-COL-02, 03, 04, 06, 07 · TC-RSK-04 · TC-ACT-01, 04 · TC-SEC-06 | RG-23 à 25, 31, 34, 51, 53, 57, 70, 71 |
| rapports IFC et GRI | TC-REP-01, 02, 03, 04 | RG-08, RG-72 |
| import CSV | TC-COL-10 | RG-29 |

Outils disponibles dans le fichier : `call(who, method, url, body, { form })`, `login(who, email)`, `evidenceForm(type, id, name)`, `ctx` (accès direct à la base pour simuler le temps, par exemple reculer `created_at`).

## 4. Catalogue des cas de test

### 4.1 Sécurité, isolation et audit (TC-SEC)

| ID | Cas | Données / étapes | Résultat attendu | Réf. | P | État |
|---|---|---|---|---|---|---|
| TC-SEC-01 | Isolation entre clients | `admin@sil.demo` liste données, risques, actions, preuves ; lit, modifie, télécharge un objet Kalaya par id ; crée une action sur une entité Kalaya | Listes sans objet Kalaya ; 404 sur chaque accès par id ; création refusée ; journal limité à son client | RG-01, EF-SOC-01 | P0 | ✅ |
| TC-SEC-02 | Périmètre d'un contributeur | `site.siguiri` liste les données ; ouvre une donnée de Boké-Nord | Seul SGE visible ; 404 sur BKN | RG-02 | P0 | ✅ |
| TC-SEC-03 | Auditeur en lecture seule | `auditeur@cabinet-es.demo` fait un POST et un PATCH ; lit le tableau de bord | 403 « Accès en lecture seule » ; lecture 200 | RG-03, P-xxx (Au) | P0 | ✅ |
| TC-SEC-04 | Accès auditeur expiré | Reculer `access_expires_at` à hier ; se connecter ; réutiliser une session ouverte | 401 `expired` « Votre accès a expiré » dans les deux cas | RG-04 | **P0** | ❌ |
| TC-SEC-05 | Chaîne d'audit intègre et protégée | `GET /audit-log/verify` ; tenter `UPDATE` et `DELETE` sur `audit_log` en base | `ok: true` ; les deux requêtes échouent (`append-only`) | RG-71, EF-SOC-04 | P0 | ✅ |
| TC-SEC-06 | Historique complet d'une donnée | Après la boucle complète, lire `GET /datapoints/:id` | `history[]` contient saisie, preuve, soumission, revue, validation avec auteurs | RG-70 | P0 | ✅ |
| TC-SEC-07 | Balayage automatique d'isolation | Pour chaque route GET de liste : `admin@sil.demo` reçoit `[]` ou aucun objet Kalaya ; pour chaque route par id : 404 avec un id Kalaya | Aucune donnée Kalaya renvoyée | RG-01, ENF-06 | **P0** | ❌ |
| TC-SEC-08 | Matrice des rôles | Pour chaque ligne P-xxx-nn du livrable 04, appeler la route avec chaque rôle non autorisé | 403 (ou 404 hors périmètre) partout où la matrice indique ❌ | 04 §4 | P1 | 🟡 |
| TC-SEC-09 | Altération détectée | Copier la base, modifier une ligne d'audit en désactivant les triggers, appeler `verify` | `ok: false`, `broken_at` = id de la ligne modifiée | RG-71 | P2 | ❌ |
| TC-SEC-10 | Téléchargement de preuve tracé | L'auditeur télécharge une preuve | Fichier identique à l'original (même SHA-256) ; ligne `download_evidence` dans le journal | RG-70, RG-73 | P1 | ❌ |
| TC-SEC-11 | Upload trop volumineux | Déposer un fichier de 21 Mo | Refus, aucun fichier écrit | ENF-07 | P2 | ❌ |
| TC-SEC-12 | Session expirée | Reculer `expires_at` de la session | 401, retour à l'écran de connexion côté front | 06 §6.2 | P1 | ❌ |
| TC-SEC-13 | Messages de connexion | E-mail inconnu, puis mauvais mot de passe | Même message « Identifiants incorrects » (pas d'énumération) | 06 §6.2 | P1 | ❌ |
| TC-SEC-14 | Limitation des essais de connexion | 6 essais erronés en 15 min | 429 au 6ᵉ essai | 06 §13 | P0 (après implémentation) | ❌ |
| TC-SEC-15 | Jeton refusé en query string | Appeler une route avec `?token=` | 401 | 06 §13 | P0 (après implémentation) | ❌ |
| TC-SEC-16 | Démarrage production sans clé | `NODE_ENV=production` sans `TRIVALINK_STORAGE_KEY` | Le serveur refuse de démarrer | 06 §6.4 | P0 (après implémentation) | ❌ |

### 4.2 Administration (TC-ADM)

| ID | Cas | Résultat attendu | Réf. | P | État |
|---|---|---|---|---|---|
| TC-ADM-01 | Créer un auditeur sans date d'expiration | 400 | RG-04, P-SOC-07 | P1 | ❌ |
| TC-ADM-02 | Un administrateur se désactive ou se retire le rôle `org_admin` | 400 | RG-05 | P1 | ❌ |
| TC-ADM-03 | Désactiver un utilisateur connecté | Ses sessions sont supprimées, sa requête suivante reçoit 401 | RG-06 | P1 | ❌ |
| TC-ADM-04 | Créer un site sous un site ; une filiale sans parent | 400 dans les deux cas | RG-10 | P1 | ❌ |
| TC-ADM-05 | Créer une entité avec un code déjà pris ; un utilisateur avec un e-mail existant (même d'un autre client) | 409 | RG-11 | P2 | ❌ |
| TC-ADM-06 | Un responsable ESG tente de créer un utilisateur | 403 | P-SOC-07 | P1 | ❌ |
| TC-ADM-07 | Modifier un seuil d'indicateur | Seuil appliqué à la soumission suivante ; journal avec avant / après | P-COL-02 | P1 | ❌ |

### 4.3 Stratégie (TC-STR)

| ID | Cas | Résultat attendu | Réf. | P | État |
|---|---|---|---|---|---|
| TC-STR-01 | Objectif `lower` : départ 64, cible 50, valeur validée 57 | `progress` = 50, `met` = false ; à 48 : `met` = true | RG-63, RG-64 | P1 | ❌ |
| TC-STR-02 | Objectif `higher` et `neutral` | Calcul cohérent avec le sens | RG-63 | P1 | ❌ |
| TC-STR-03 | Objectif sur une entité hors périmètre ; période cible mal formée | 404 ; 400 | P-STR-03 | P2 | ❌ |
| TC-STR-04 | Objectif sans donnée validée | `current_value` null, pas d'avancement inventé | RG-61 | P1 | ❌ |

### 4.4 Collecte (TC-COL)

| ID | Cas | Données / étapes | Résultat attendu | Réf. | P | État |
|---|---|---|---|---|---|---|
| TC-COL-01 | Lancement de campagne | Campagne T4 sur 3 sites, domaines E et S | Indicateurs `site` demandés aux sites seulement ; compteur `requests` exact | RG-20, SF-COL-2 | P1 | 🟡 |
| TC-COL-02 | Saisie en brouillon | Contributeur saisit 64 sur E11 | Statut `draft`, `version` + 1, audit avant / après | RG-22, RG-27 | P0 | ✅ |
| TC-COL-03 | **Soumission refusée sans preuve** | Soumettre sans fichier | 400 « pièce justificative obligatoire » ; après dépôt, 200 | RG-23, SF-COL-4, P-COL-05 | P0 | ✅ |
| TC-COL-04 | **Écart automatique sur dépassement** | Soumettre 64 mg/L sur E11 (seuil 50) | `breach: true`, `incident_id` renvoyé, écart `threshold_breach` gravité `high`, audit `auto_create` | RG-31, SF-COL-5 | P0 | ✅ |
| TC-COL-05 | Pas de doublon d'écart | Rejeter puis resoumettre la même valeur hors seuil | Pas de second écart tant que le premier est ouvert | RG-31 | P1 | ❌ |
| TC-COL-06 | **Revue par le contributeur refusée** | Le soumetteur tente `review` | 403 ; un autre M réussit | RG-24, SF-COL-6, P-COL-06 | P0 | ✅ |
| TC-COL-07 | **Validation : séparation des tâches** | Le relecteur tente `validate` ; validation sans revue | 403 ; 400 ; un troisième utilisateur valide | RG-24, RG-25, P-COL-07 | P0 | ✅ |
| TC-COL-08 | **Rejet motivé et resoumission** | Rejet sans motif, puis avec motif ; correction ; resoumission | 400 sans motif ; motif visible du contributeur ; effacé à la resoumission ; revue remise à zéro | RG-26 | **P0** | ❌ |
| TC-COL-09 | Donnée validée figée | PATCH, import, preuve sur une donnée `validated` | 400 dans les trois cas | RG-22, RG-28 | P0 | 🟡 |
| TC-COL-10 | Import CSV | Fichier de 3 lignes dont un indicateur inconnu et une entité hors périmètre | `imported: 1`, 2 erreurs avec numéro de ligne ; la donnée importée est en `draft` | RG-29, SF-COL-7 | P1 | ✅ |
| TC-COL-11 | Import Excel et formats | `.xlsx`, séparateur `,`, décimales à virgule, BOM | Valeurs lues correctement | RG-29 | P2 | ❌ |
| TC-COL-12 | Relance de campagne sur la même période | Relancer T3 | Aucune donnée écrasée ni dupliquée | RG-21 | P1 | ❌ |
| TC-COL-13 | Bornes de seuil incluses | Soumettre exactement 50 sur E11 ; 6 et 9 sur E12 | Pas d'écart | RG-30 | P1 | ❌ |
| TC-COL-14 | Soumission sans valeur | Soumettre une donnée vide | 400 | RG-23 | P1 | ❌ |

### 4.5 Risques et conformité (TC-RSK)

| ID | Cas | Résultat attendu | Réf. | P | État |
|---|---|---|---|---|---|
| TC-RSK-01 | Un contributeur déclare un écart sur son site | 201, visible dans la liste du M | P-RSK-04 | P1 | ❌ |
| TC-RSK-02 | Déclarer manuellement un écart `threshold_breach` | 400 | RG-33, P-RSK-09 | P1 | ❌ |
| TC-RSK-03 | **Obligation conforme sans preuve** | 400 ; après dépôt d'une preuve sur l'obligation, 200 | RG-40 | **P0** | ❌ |
| TC-RSK-04 | **Clôture d'écart conditionnée** | Sans action : 400 ; avec une action en cours : 400 ; actions terminées ou annulées : 200 | RG-34, SF-RSK-5, P-RSK-06 | P0 | ✅ (cas sans action et terminée) |
| TC-RSK-05 | Grief résolu sans résolution | 400 ; avec résolution : 200, `resolved_at` posé une fois | RG-41 | P1 | ❌ |
| TC-RSK-06 | Score et risques élevés | Risque 4 × 4 = 16 compté « élevé » ; clos : plus compté | RG-42 | P2 | ❌ |
| TC-RSK-07 | Un contributeur tente de clore un écart | 403 | P-RSK-06 | P1 | ❌ |

### 4.6 Actions (TC-ACT)

| ID | Cas | Résultat attendu | Réf. | P | État |
|---|---|---|---|---|---|
| TC-ACT-01 | Création avec indicateur de résultat sans valeur de départ | Valeur de départ = dernière valeur validée sur l'entité et ses descendantes | RG-51 | P0 | ✅ |
| TC-ACT-02 | Un non-responsable (contributeur d'un autre site, autre O) modifie l'action | 403 ou 404 | RG-52, P-ACT-03 | P1 | ❌ |
| TC-ACT-03 | Le responsable annule, réaffecte ou change l'échéance | 403 ; A ou M : 200 | RG-52, P-ACT-04, P-ACT-05 | P1 | ❌ |
| TC-ACT-04 | **Clôture avec résultat mesuré** | Sans mesure validée postérieure à la création : 400 ; après validation d'une mesure T4 : 200, `result_value` et `result_period` figés, résultat atteint | RG-53, RG-57, SF-ACT-4, P-ACT-03 | P0 | ✅ |
| TC-ACT-05 | Action close non modifiable | PATCH sur une action `done` ou `cancelled` → 400 | RG-54, P-ACT-07 | P1 | ❌ |
| TC-ACT-06 | Avancement automatique | `planned` → `in_progress` sans avancement : 10 % ; `done` : 100 % | RG-55 | P2 | ❌ |
| TC-ACT-07 | Retard | Échéance passée, statut non terminal → `overdue: true` | RG-56 | P1 | ❌ |
| TC-ACT-08 | Origine d'un autre client | Créer une action avec `source_id` d'un écart SIL | 400 ou 404 | RG-50, RG-01 | P1 | 🟡 |

### 4.7 Reporting et tableau de bord (TC-REP)

| ID | Cas | Résultat attendu | Réf. | P | État |
|---|---|---|---|---|---|
| TC-REP-01 | Rapport IFC en JSON | ≥ 5 sections, empreinte SHA-256 de 64 caractères hexadécimaux, audit `generate_report` | RG-72, SF-REP-3 | P0 | ✅ |
| TC-REP-02 | Rapport en PDF | Fichier commençant par `%PDF`, empreinte imprimée sur chaque page | RG-72 | P0 | ✅ |
| TC-REP-03 | Rapport en Excel | Fichier commençant par `PK` (xlsx), onglet empreinte | RG-72 | P0 | ✅ |
| TC-REP-04 | Contributeur et responsable d'action | 403 sur `GET /reports/*` | RG-08, P-REP-02 | P0 | ✅ |
| TC-REP-05 | Empreinte stable | Deux générations successives sans changement de données : même empreinte | RG-72 | P1 | ❌ |
| TC-REP-06 | Consolidation | Somme, moyenne, maximum sur un sous-arbre ; `null` sans donnée ; données non validées exclues | RG-60, RG-61 | P0 | ❌ |
| TC-REP-07 | Index GRI | Publications regroupées, « Non disponible » sans donnée | 07 §7.2 | P1 | 🟡 |
| TC-REP-08 | Période par défaut | Sans paramètre : dernière campagne close, sinon dernière période validée | RG-65 | P2 | ❌ |
| TC-REP-09 | Taux de preuve | Données validées avec preuve / données validées | RG-66 | P2 | ❌ |
| TC-REP-10 | Ratios pondérés (après correction) | LTIFR groupe = Σ S05 × 10⁶ / Σ S04 | 07 §5.2 | P1 (après implémentation) | ❌ |

### 4.8 Saisie hors ligne (TC-OFF)

Comportement spécifié dans 03 SF-COL-8 et codé dans `web/src/api.js`. À automatiser avec Playwright (`context.setOffline(true)`).

| ID | Cas | Étapes | Résultat attendu | P | État |
|---|---|---|---|---|---|
| TC-OFF-01 | Saisie mise en attente | Couper le réseau, saisir une valeur | Message « enregistré hors ligne » ; opération `save` dans la file (`trivalink.offlineQueue`) ; compteur visible | P1 | ❌ |
| TC-OFF-02 | Preuve hors ligne | Joindre un fichier de 2 Mo, puis de 4 Mo | 2 Mo : mis en file ; 4 Mo : refus « fichier trop volumineux pour être mis en attente (3 Mo max) » | P1 | ❌ |
| TC-OFF-03 | Rejeu ordonné | Mettre en file saisie, preuve, soumission ; rétablir le réseau | Rejeu dans l'ordre ; donnée `submitted` côté serveur avec sa preuve ; file vide | P1 | ❌ |
| TC-OFF-04 | Refus métier au rejeu | Mettre en file une soumission sans preuve sur un indicateur qui l'exige ; rétablir le réseau | L'opération refusée est retirée de la file et signalée à l'utilisateur ; les suivantes continuent ; si le réseau retombe, la file est conservée | P1 | ❌ |

### 4.9 Interface (TC-UI)

| ID | Cas | Résultat attendu | P | État |
|---|---|---|---|---|
| TC-UI-01 | Navigation par rôle | Chaque rôle voit exactement les écrans de 04 §7 ; une URL non autorisée renvoie à l'accueil | P1 | ❌ |
| TC-UI-02 | Bilinguisme | Toutes les pages sans texte français résiduel en anglais ; dates et nombres au bon format | P1 | ❌ |
| TC-UI-03 | Mobile | Saisie, preuve et soumission utilisables sur un écran de 360 px | P1 | ❌ |
| TC-UI-04 | Accessibilité | axe-core sans violation sérieuse sur Connexion, Tableau de bord, Collecte, Actions | P2 | ❌ |
| TC-UI-05 | Messages d'erreur | Chaque 400 / 403 / 404 affiche le message du serveur, sans écran blanc | P1 | ❌ |

### 4.10 Performance (TC-PERF)

| ID | Cas | Critère | Réf. | P | État |
|---|---|---|---|---|---|
| TC-PERF-01 | Jeu de 100 000 données validées (20 sites × 44 indicateurs × ~110 périodes ou équivalent) | Aucune route > 2× son temps à vide | ENF-05 | P1 | ❌ |
| TC-PERF-02 | Tableau de bord groupe sur la période la plus chargée | p95 < 3 s | ENF-01 | P1 | ❌ |
| TC-PERF-03 | Rapport IFC PDF complet | < 30 s | ENF-02 | P1 | ❌ |
| TC-PERF-04 | Chargement initial de l'interface (connexion 3G simulée) | < 2 s après mise en cache, < 5 s à froid | ENF-03 | P2 | ❌ |
| TC-PERF-05 | Débit API | Mesure de référence sur `/api/health` et `/api/datapoints?queue=todo` | CdC | P2 | ❌ |

### 4.11 Synthèse

| Domaine | Cas | ✅ | 🟡 | ❌ | dont P0 à écrire |
|---|--:|--:|--:|--:|---|
| SEC | 16 | 5 | 1 | 10 | TC-SEC-04, TC-SEC-07 (+ 14, 15, 16 après implémentation) |
| ADM | 7 | 0 | 0 | 7 | — |
| STR | 4 | 0 | 0 | 4 | — |
| COL | 14 | 6 | 2 | 6 | **TC-COL-08** |
| RSK | 7 | 1 | 0 | 6 | **TC-RSK-03** |
| ACT | 8 | 2 | 1 | 5 | — |
| REP | 10 | 4 | 1 | 5 | TC-REP-06 |
| OFF | 4 | 0 | 0 | 4 | — |
| UI | 5 | 0 | 0 | 5 | — |
| PERF | 5 | 0 | 0 | 5 | — |
| **Total** | **80** | **18** | **5** | **57** | |

**Priorité immédiate (P0 à écrire)** : obligation conforme sans preuve (TC-RSK-03), accès auditeur expiré (TC-SEC-04), rejet avec motif (TC-COL-08), balayage d'isolation (TC-SEC-07), consolidation (TC-REP-06).

### 4.12 Exemple : écrire TC-RSK-03

```js
test('TC-RSK-03 une obligation ne peut pas être déclarée conforme sans preuve', async () => {
  const o = (await call('rse', 'GET', '/api/obligations')).body.find((x) => x.evidence_count === 0);
  const r = await call('rse', 'PATCH', `/api/obligations/${o.id}`, { status: 'compliant' });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /preuve/);
  assert.equal((await call('rse', 'POST', '/api/evidence', undefined, { form: evidenceForm('obligation', o.id) })).status, 201);
  assert.equal((await call('rse', 'PATCH', `/api/obligations/${o.id}`, { status: 'compliant' })).status, 200);
});
```

Règles d'écriture : préfixer le nom du test par son identifiant TC ; tester le statut **et** le message (c'est l'interface) ; ne pas dépendre de l'état laissé par un autre test, ou le documenter ; simuler le temps via `ctx.q.run(...)` plutôt qu'attendre.

## 5. Tests de non-régression et intégration continue

| Déclencheur | Tests exécutés | Bloquant |
|---|---|---|
| Chaque commit / PR | `npm test` (API + unitaires), `npm audit --audit-level=high`, build front | Oui |
| Fusion sur la branche principale | + Playwright (parcours de recette), déploiement staging | Oui |
| Avant chaque mise en production | + performance (TC-PERF), recette interne du scénario de référence, checklist sécurité (06 §10.5) | Oui |
| Mensuel | Restauration de sauvegarde sur staging | Alerte |
| Quotidien en production | `GET /audit-log/verify` pour chaque client | Incident de sécurité si `ok: false` |

Couverture : mesure par `node --test --experimental-test-coverage` ; objectif CdC **> 80 %**, atteint progressivement (50 % à la fin du durcissement, 80 % à la fin des pilotes) [HYPOTHÈSE de calendrier].

## 6. Recette utilisateur (pilotes)

### 6.1 Organisation

| Élément | Choix |
|---|---|
| Participants | Par client pilote : 1 responsable ESG (M), 1 administrateur (A), 2 contributeurs de site (C), 1 responsable d'action (O), 1 membre de direction (E), idéalement l'auditeur E&S du prêteur (Au) |
| Environnement | Production pilote avec les données réelles du client, après la recette interne sur staging |
| Données | Organisation, entités, utilisateurs et seuils du client (permis, ESAP) ; une campagne trimestrielle réelle |
| Durée | Un cycle trimestriel complet (collecte, validation, actions, rapport), soit environ 6 à 8 semaines |
| Animation | Session de lancement, point hebdomadaire, canal de remontée unique |
| Remontée | Formulaire d'anomalie (§7), captures d'écran, rôle et page concernés |

### 6.2 Scénarios de recette

| ID | Scénario | Acteurs | Étapes | Critère de réussite |
|---|---|---|---|---|
| UAT-01 | Paramétrer l'organisation | A | Créer filiales et sites, utilisateurs, accès auditeur daté ; ajuster les seuils des permis | Organisation conforme à la réalité du client en moins d'une journée |
| UAT-02 | Lancer et suivre une campagne | M | Lancer la campagne du trimestre sur tous les sites ; suivre l'avancement | Chaque site voit ses demandes ; compteurs justes |
| UAT-03 | Fournir les données d'un site | C | Saisir, importer un fichier, joindre les preuves, soumettre ; une partie hors ligne | 100 % des données du site soumises avec preuve, sans aide extérieure après la formation |
| UAT-04 | Valider et traiter un dépassement | M (deux personnes) | Revoir, valider, rejeter avec motif ; traiter l'écart automatique d'un dépassement ; créer l'action | Aucune donnée validée par celui qui l'a saisie ; écart relié à une action |
| UAT-05 | Faire avancer et clore une action | O, M | Mettre à jour l'avancement, joindre la preuve ; clore avec la mesure du trimestre suivant | Action close avec résultat mesuré ; écart clos |
| UAT-06 | Produire et vérifier le rapport prêteur | M, E, Au | Générer le rapport IFC PDF et Excel ; l'auditeur remonte d'un chiffre à sa preuve et à son historique ; vérifier la chaîne d'audit | Rapport accepté par le responsable ESG comme base de son rapport au prêteur ; l'auditeur retrouve la preuve de chaque chiffre testé |

### 6.3 Indicateurs de réussite du pilote

| Mesure | Cible [HYPOTHÈSE] |
|---|---|
| Taux de données soumises à l'échéance | ≥ 80 % |
| Taux de preuve des données validées | ≥ 95 % |
| Délai moyen soumission → validation | ≤ 10 jours |
| Écarts reliés à au moins une action | 100 % |
| Temps de production du rapport trimestriel par rapport à la méthode actuelle | Divisé par 3 |
| Satisfaction des utilisateurs (note sur 5) | ≥ 4 |
| Anomalies bloquantes ouvertes en fin de pilote | 0 |
| Intention de passer en abonnement | Oui, au moins 2 pilotes sur 3 |

### 6.4 Procès-verbal de recette

À la fin du cycle, un procès-verbal signé par le client indique : scénarios passés, anomalies restantes et leur gravité, réserves, décision (acceptation, acceptation avec réserves, refus).

## 7. Gestion des anomalies

### 7.1 Gravité

| Niveau | Définition | Exemple | Délai de correction cible [HYPOTHÈSE] |
|---|---|---|---|
| **Bloquante** | Fuite de données, perte de données, chiffre publié faux, journal altérable, impossibilité de saisir ou de valider | Un contributeur voit un autre site | Correctif immédiat, < 24 h |
| **Majeure** | Fonction clé inutilisable sans contournement raisonnable | Import Excel impossible | < 5 jours ouvrés |
| **Mineure** | Gêne avec contournement | Libellé non traduit, tri incorrect | Prochaine version |
| **Évolution** | Demande hors spécification | Nouveau rapport | Backlog produit |

### 7.2 Fiche d'anomalie

Identifiant · date · rapporteur · client · rôle · page ou route · étapes pour reproduire · résultat obtenu · résultat attendu · gravité · capture · cas de test ou règle concerné (TC / RG / SF).

### 7.3 Cycle

`Nouvelle` → `Qualifiée` (gravité, reproduction) → `En correction` (branche + **test qui reproduit l'anomalie**) → `Corrigée` (PR revue, CI verte) → `Vérifiée` (par le rapporteur ou le testeur) → `Close`. Une anomalie bloquante ouvre aussi un post-mortem court.

## 8. Critères d'entrée et de sortie

### 8.1 Entrée en recette pilote

- [ ] Tous les cas P0 automatisés et verts (§4.11).
- [ ] Écarts P0 du DAT traités (06 §13) : migrations, clé de chiffrement, HTTPS, limitation de débit, jeton en query string, démo désactivée, sauvegardes.
- [ ] Recette interne du scénario de référence passée sur staging, en FR et en EN.
- [ ] Données du client chargées et vérifiées avec lui.
- [ ] Utilisateurs formés (support d'une page par rôle).

### 8.2 Sortie de recette et passage en abonnement

- [ ] 6 scénarios UAT passés.
- [ ] 0 anomalie bloquante ou majeure ouverte.
- [ ] Cas P1 automatisés et verts.
- [ ] Performance mesurée conforme (TC-PERF-01 à 03).
- [ ] Pentest externe réalisé, vulnérabilités élevées corrigées.
- [ ] Restauration de sauvegarde testée.
- [ ] Procès-verbal de recette signé.

## 9. Critères d'acceptation du cahier des charges

| Critère CdC | Cas de test | État au 13/10/2026 |
|---|---|---|
| Isolation multi-tenant prouvée | TC-SEC-01, 02, 07 | ✅ test d'isolation ; balayage automatique à écrire |
| Journal d'audit infalsifiable | TC-SEC-05, 06, 09 | ✅ chaîne et triggers ; ancrage externe à faire |
| Rapport ESG complet généré | TC-REP-01 à 03 | ✅ IFC et GRI, PDF et Excel |
| Export GRI fonctionnel | TC-REP-07 | ✅ |
| Export ISSB fonctionnel | — | ❌ phase 2 |
| 100 000 enregistrements testés sans dégradation | TC-PERF-01 | ❌ à mesurer |
| Couverture de tests > 80 % | §5 | ❌ non mesurée |
| MFA pour les offres Entreprise et Institution | à créer après implémentation | ❌ |
| Disponibilité 99,5 %, reprise < 4 h | Supervision, test de restauration | ❌ pas encore en production |
| Pentest annuel | Externe | ❌ à planifier avant l'abonnement |

## 10. Traçabilité exigences → tests

| Exigence (02) | Spécification (03) | Permission (04) | Cas de test |
|---|---|---|---|
| EF-SOC-01 Isolation | SF-SOC-1 | toutes | TC-SEC-01, 02, 07 |
| EF-SOC-04 Journal infalsifiable | SF-SOC-4 | P-AUD-01, 02, 03 | TC-SEC-05, 06, 09, 10 |
| EF-SOC-06 Saisie hors ligne | SF-COL-8 | — | TC-OFF-01 à 04 |
| EF-COL-04 Preuve obligatoire | SF-COL-4 | P-COL-05, P-COL-10 | TC-COL-03 |
| EF-COL-05 Validation à deux niveaux | SF-COL-6 | P-COL-06, 07, 08 | TC-COL-06, 07, 08 |
| EF-COL-03 Import | SF-COL-7 | P-COL-09 | TC-COL-10, 11 |
| EF-RSK-04 Écart automatique | SF-COL-5 | P-RSK-09 | TC-COL-04, 05, 13 · TC-RSK-02 |
| EF-RSK-06 Clôture d'écart | SF-RSK-5 | P-RSK-06 | TC-RSK-04, 07 |
| EF-ACT-04 Résultat mesuré | SF-ACT-4 | P-ACT-03 | TC-ACT-01, 04, 05 |
| EF-REP-01 Tableau de bord | SF-REP-1 | P-REP-01 | TC-REP-06, 08, 09 |
| EF-REP-03 Rapports | SF-REP-3 | P-REP-02 | TC-REP-01 à 05, 07 |

## 11. Historique

| Version | Date | Changement |
|---|---|---|
| 1.0 | 13/10/2026 | Création : inventaire des 6 tests existants, catalogue de 80 cas, recette pilote, gestion des anomalies |
