# 03 · SFD du MVP · TRIVALINK ESG

**Spécifications fonctionnelles détaillées du MVP**

| | |
|---|---|
| **Version** | 1.0 · 13 octobre 2026 |
| **Périmètre** | MVP tel qu'implémenté dans `trivalink/app/` + évolutions P0/P1 identifiées |
| **Exigences couvertes** | Livrable 02, §8 (EF-xxx-nn) |
| **Règles métier** | Identifiants `RG-xx`, définis dans `docs-dev/06-regles-metier.md` et rappelés ici |
| **Permissions** | Livrable 04 (P-xxx-nn) |
| **Tests** | Livrable 08 (TC-xxx-nn) |

Convention : chaque spécification a un identifiant `SF-<module>-<n>`. Les comportements marqués **[MVP]** existent ; **[À FAIRE]** sont spécifiés mais non implémentés.

---

## 1. Vue d'ensemble

### 1.1 Modules et écrans

| Module | Écran (menu) | Route front | Rôles avec accès au menu |
|---|---|---|---|
| Socle | Connexion | (hors connexion) | tous |
| Socle | Barre supérieure (langue, réseau, utilisateur) | toutes | tous |
| Reporting | Tableau de bord | `#/dashboard` | tous |
| Strategy | Stratégie | `#/strategy` | A, M, E, Au |
| Collecte | Collecte (5 onglets) | `#/collection` | A, M, C, Au |
| Collecte | Fiche d'une donnée | `#/datapoint/:id` | tous (par lien) |
| Risk & Compliance | Risques et conformité (6 onglets) | `#/risks` | tous |
| Actions | Actions (4 onglets) | `#/actions[/:id]` | tous |
| Reporting | Rapports | `#/reports` | A, M, E, Au |
| Reporting | Preuves | `#/evidence` | tous |
| Reporting | Journal d'audit | `#/audit` | A, M, E, Au |
| Socle | Administration (3 onglets) | `#/admin` | A, M |

A = Administrateur, M = Responsable ESG, C = Contributeur, O = Responsable d'action, E = Direction, Au = Auditeur.

### 1.2 Navigation et page d'accueil

- Menu latéral filtré selon le rôle ; sur écran < 760 px, menu en tiroir (bouton ☰).
- Page d'accueil après connexion : Contributeur → Collecte ; Responsable d'action → Actions ; autres → Tableau de bord.
- Une adresse non autorisée pour le rôle affiche le tableau de bord (le serveur refuse de toute façon les appels).

### 1.3 Comportements communs

| ID | Comportement |
|---|---|
| SF-COM-1 | Toute erreur serveur s'affiche en notification rouge avec le message exact du serveur (rédigé pour l'utilisateur). |
| SF-COM-2 | Toute réussite d'enregistrement affiche une notification verte (« Enregistré », « Soumise pour validation »…), 4,5 s. |
| SF-COM-3 | Les montants et nombres sont formatés selon la langue (séparateur de milliers, 0 décimale au-delà de 100, 2 en dessous) ; une valeur absente s'affiche « – ». |
| SF-COM-4 | Les périodes s'affichent « 2026 T3 » (FR) ; format technique `2026-Q3`. |
| SF-COM-5 | Chaque statut est un badge coloré : vert acquis, bleu en traitement, ambre à compléter, rouge problème, gris neutre. |
| SF-COM-6 | Les listes d'entités sont présentées en arbre indenté (groupe › filiale › site), restreintes au périmètre de l'utilisateur. |
| SF-COM-7 | Les fenêtres modales se ferment par Échap, clic extérieur ou bouton ×. |
| SF-COM-8 | Toute session expirée (401) ramène à l'écran de connexion. |

---

## 2. Socle (SOC)

### SF-SOC-1 · Isolation des clients [MVP] (EF-SOC-01)
- Chaque utilisateur appartient à une seule organisation. Aucun écran, aucune liste, aucun téléchargement ne montre d'élément d'une autre organisation.
- Tentative d'accès direct à l'identifiant d'un objet d'une autre organisation : réponse « introuvable » (404), identique à un objet inexistant.
- Règle RG-01.

### SF-SOC-2 · Connexion [MVP]
**Écran** : logo, signature « Structurer la responsabilité. Piloter la performance. », champs Adresse e-mail et Mot de passe, bouton Se connecter, sélecteur FR/EN, liste cliquable des comptes de démonstration (environnement de démo uniquement).

| Cas | Résultat |
|---|---|
| Identifiants corrects | Session de 12 h, chargement de la session (profil, organisation, périmètre, entités, indicateurs, utilisateurs), redirection vers la page d'accueil du rôle |
| E-mail inconnu ou mot de passe faux | « Identifiants incorrects » (même message dans les deux cas) |
| Compte désactivé | « Identifiants incorrects » |
| Accès auditeur expiré | « Votre accès a expiré » |

Journalisation : `login`.
[À FAIRE] Second facteur TOTP (EF-SOC-09) ; limitation à 5 essais / 15 min ; « Mot de passe oublié » (EF-SOC-10).

### SF-SOC-3 · Barre supérieure [MVP]
- Bouton menu (mobile), indicateur réseau (voir SF-COL-8), sélecteur de langue FR/EN, nom et rôle de l'utilisateur, date d'expiration pour un auditeur (« Accès expirant le … »), bouton Déconnexion.
- Changer de langue : effet immédiat, mémorisé dans le navigateur et envoyé au serveur (sauf rôles en lecture seule, limitation connue).

### SF-SOC-4 · Journal d'audit [MVP] (EF-SOC-04, EF-REP-06)
**Écran Journal d'audit** (A, M, E, Au) :
- Tableau des 300 derniers événements : date (UTC), utilisateur, événement, objet (type et numéro), détails lisibles.
- Filtre par type d'objet.
- Bouton « Vérifier la chaîne » : recalcule l'intégrité ; badge vert « Chaîne intègre » + nombre d'événements, ou rouge « Chaîne rompue » + numéro de la première ligne altérée.
- Un utilisateur limité à un périmètre ne voit que les événements des objets de son périmètre.

Événements journalisés : connexion, création, modification (avant/après), lancement de campagne, soumission, revue, validation, rejet, import, dépôt et téléchargement de preuve, création automatique d'écart, clôture d'action, génération de rapport.

Règles : RG-70, RG-71. Le journal ne peut être ni modifié ni supprimé, même par un administrateur.

### SF-SOC-5 · Administration › Utilisateurs [MVP]
**Liste** : nom, e-mail, rôle, périmètre (« Tout le groupe » ou nom de l'entité), expiration, statut (actif / inactif).

**Créer un utilisateur** (A) : nom*, e-mail*, mot de passe* (≥ 8 caractères), rôle*, périmètre (optionnel), expiration (obligatoire si rôle Auditeur), langue.

**Ouvrir un accès auditeur** (A) : même formulaire, rôle fixé à Auditeur, expiration pré-remplie à J+60, modifiable.

**Activer / désactiver** (A) : bascule ; un administrateur ne peut pas se désactiver lui-même ; la désactivation ferme immédiatement toutes les sessions de l'utilisateur.

Règles : RG-04, RG-05, RG-06, RG-11, RG-12.
[À FAIRE] Invitation par e-mail au lieu d'un mot de passe saisi par l'administrateur ; modification du rôle et du périmètre dans l'interface (l'API le permet pour le rôle).

### SF-SOC-6 · Administration › Entités [MVP] (EF-SOC-02)
- Arbre des entités : nom, code, type, pays.
- **Nouvelle entité** (A) : nom*, code* (unique dans l'organisation, utilisé pour l'import), type* (Groupe, Filiale, Site), entité parente (obligatoire pour filiale et site), pays (défaut GN).
- Erreurs : « Une filiale ou un site doit avoir une entité parente », « Un site ne peut pas avoir d'entité fille », « Cet élément existe déjà » (code en double).
- Aucune suppression ni modification d'entité dans le MVP.

### SF-SOC-7 · Administration › Indicateurs [MVP]
- Onglets Environnement / Social / Gouvernance avec compteur.
- Par indicateur : code, nom, unité, seuil min, seuil max, preuve obligatoire (oui/non), actif ; bouton Enregistrer par ligne (A, M).
- Un seuil vide efface la borne. Chaque modification est journalisée avec l'avant/après.
- Désactiver un indicateur l'exclut des nouvelles campagnes et du tableau de bord ; les données existantes sont conservées.

---

## 3. Strategy (STR)

### SF-STR-1 · Engagements [MVP] (EF-STR-01)
**Écran Stratégie** : liste des engagements groupés, chacun avec domaine (badge E/S/G), titre, description, source, responsable, puis ses objectifs.

**Nouvel engagement** (A, M) : titre*, description, domaine* (E/S/G), source (ex. « ESAP IFC », « Politique climat »), responsable.

### SF-STR-2 · Objectifs [MVP] (EF-STR-02, EF-STR-03)
**Nouvel objectif** (A, M), depuis un engagement : titre*, indicateur*, entité* (dans le périmètre), valeur de départ, période de départ, valeur cible*, période cible* (format trimestre).

**Affichage d'un objectif** : indicateur et unité, entité, départ → actuel → cible, période de la dernière mesure, barre d'avancement, badge Atteint / Non atteint.

Calculs (RG-63, RG-64) :
- Valeur actuelle = dernière période disposant d'une valeur **validée**, consolidée sur l'entité de l'objectif et ses descendantes (dans le périmètre de l'utilisateur).
- Sens : « réduire » si l'indicateur est de sens « plus bas = mieux », ou neutre avec départ > cible ; sinon « augmenter ».
- Atteint : actuel ≤ cible (réduire) ou actuel ≥ cible (augmenter) ; avancement alors 100 %.
- Avancement = (actuel − départ) / (cible − départ), borné entre 0 et 100 %. Sans valeur de départ : non calculable (sauf si actuel = cible).
- Aucune mesure validée : « – », pas d'avancement.

---

## 4. Collecte E/S/G (COL)

### SF-COL-1 · Écran Collecte [MVP]
En-tête : titre, rappel « Validation à deux niveaux par trois personnes distinctes. », sélecteur de période (défaut : période de la campagne ouverte).

| Onglet | Visible pour | Contenu |
|---|---|---|
| Mes saisies | A, M, C | Données à fournir (demandées, brouillons, rejetées) de la période, dans le périmètre |
| À valider | A, M | Données soumises ou revues de la période |
| Campagnes | tous ceux qui voient l'écran | Liste et lancement |
| Données de la période | tous ceux qui voient l'écran | Toutes les données avec filtres |
| Importer | A, M, C | Import CSV / Excel |

### SF-COL-2 · Campagnes [MVP] (EF-COL-02, EF-COL-07)
**Liste** : nom, période, échéance, statut (Ouverte / Close), créée par, barre d'avancement et compteurs : demandes, à fournir, en validation, validées (comptés dans le périmètre de l'utilisateur).

**Lancer une campagne** (A, M) :

| Champ | Règle |
|---|---|
| Nom* | Libre |
| Période* | `AAAA-Qn` |
| Échéance* | Date |
| Entités* | Au moins une, dans le périmètre |
| Domaines | E, S, G (défaut : tous) ; ou liste d'indicateurs |

Effet : pour chaque entité et chaque indicateur actif sélectionné, une donnée « Demandée » est créée, **si le niveau correspond** : indicateurs de niveau site → sites ; indicateurs de niveau groupe → groupe et filiales (RG-20). Les couples déjà existants pour la période ne sont pas recréés (RG-21). Message de succès avec le nombre de demandes créées.

**Clore / rouvrir** (A, M) : bascule du statut. La dernière campagne close définit la période par défaut du tableau de bord et des rapports.

[À FAIRE] (EF-COL-08) Relances e-mail J-7 et J-1, récapitulatif J+1 ; avertissement à la clôture s'il reste des données à fournir.

### SF-COL-3 · Saisie d'une donnée (onglet Mes saisies) [MVP] (EF-COL-03)
Tableau, une ligne par donnée à fournir :

| Colonne | Comportement |
|---|---|
| Code | `E11` |
| Indicateur | Nom dans la langue de l'utilisateur, lien vers la fiche ; sous-ligne : référence GRI, référence IFC, seuils (« ≥ 6 ≤ 9 ») ; si rejetée : bandeau rouge « Rejetée : <motif> » |
| Valeur | Champ numérique (clavier décimal sur mobile), unité affichée à côté |
| Commentaire | Texte libre |
| Preuve | Bouton 📎 + nombre de pièces ; **orange** si preuve exigée et absente, **vert** si présente ; ouvre le sélecteur de fichier |
| Actions | Enregistrer (si modifiée), Soumettre |

Comportements :
- **Alerte immédiate** : si la valeur saisie sort des seuils, la ligne passe en surbrillance rouge **avant** soumission.
- **Enregistrer** : statut → Brouillon, version + 1, journalisation avant/après.
- Une donnée n'est modifiable qu'en Demandée, Brouillon ou Rejetée (RG-22). Message sinon : « Donnée déjà soumise : elle ne peut plus être modifiée ».
- Liste vide : « Tout est fourni. »

### SF-COL-4 · Preuve et soumission [MVP] (EF-COL-04)
- Ajout de preuve : fichier ≤ 20 Mo, tout format ; possible uniquement **avant** soumission (Demandée, Brouillon, Rejetée). Le fichier est chiffré, son empreinte SHA-256 calculée et affichée dans la bibliothèque.
- **Soumettre** :
  1. Si la valeur a changé, elle est d'abord enregistrée.
  2. Contrôles (serveur, RG-23) : valeur présente (« Saisissez une valeur avant de soumettre ») ; au moins une preuve si l'indicateur l'exige (« Une pièce justificative est obligatoire pour cet indicateur »).
  3. Statut → Soumise ; auteur et date enregistrés ; motif de rejet effacé.
- Le contrôle est aussi fait côté interface pour un retour immédiat.

### SF-COL-5 · Dépassement de seuil et écart automatique [MVP] (EF-RSK-04)
À la soumission, si la valeur est strictement supérieure au seuil max ou strictement inférieure au seuil min (RG-30) :
- la donnée est marquée « hors seuil » ;
- **un écart de type « Dépassement de seuil », gravité Élevée, est créé automatiquement** (RG-31), rattaché à l'entité et à la donnée, titre « Dépassement de seuil : <indicateur> (<entité>, <période>) », description « Valeur déclarée <v> <unité>, seuil > <max> <unité>. » ;
- pas de doublon si un écart ouvert existe déjà pour cette donnée ;
- notification ambre : « Dépassement de seuil détecté : un écart a été créé. » ;
- journalisation `auto_create`.

### SF-COL-6 · Validation à deux niveaux (onglet À valider) [MVP] (EF-COL-05)
Tableau des données Soumises et Revues : entité, indicateur, valeur, unité, seuil, preuves, contributeur, statut, actions.

| Action | Condition | Résultat | Erreur |
|---|---|---|---|
| **Revoir (niveau 1)** | Statut Soumise ; utilisateur ≠ contributeur | Statut Revue | « Vous ne pouvez pas revoir une donnée que vous avez soumise » |
| **Valider (niveau 2)** | Statut Revue ; utilisateur ≠ contributeur et ≠ relecteur | Statut Validée (définitive) | « La validation finale doit être faite par une autre personne que le contributeur et le relecteur » ; « La donnée doit avoir été revue (niveau 1) avant validation » |
| **Rejeter** | Statut Soumise ou Revue ; motif obligatoire | Statut Rejetée ; retour au contributeur | « Champ obligatoire : motif » |

Règles RG-24 à RG-26, RG-28. Une donnée validée ne peut plus être modifiée.
[À FAIRE] (EF-COL-09) Rouvrir une donnée validée avec motif, nouvelle version, revalidation complète.

### SF-COL-7 · Import CSV / Excel [MVP] (EF-COL-03)
**Format** (affiché à l'écran) : colonnes `indicator_code`, `entity_code`, `period`, `value`, `comment` ; CSV séparé par `;` ou `,`, ou `.xlsx` (première feuille).

Traitement ligne par ligne (RG-29) :
- ligne valide : donnée créée ou mise à jour en **Brouillon** (jamais soumise) ;
- ligne refusée, sans bloquer les autres, avec son numéro : indicateur inconnu, entité inconnue ou hors périmètre, période invalide, valeur invalide, donnée déjà soumise ou validée.

Résultat affiché : « N lignes importées » + tableau des erreurs (ligne, message). Le contributeur joint ensuite ses preuves et soumet depuis Mes saisies.

### SF-COL-8 · Saisie hors ligne [MVP] (EF-SOC-06)
- Si le réseau est coupé, **Enregistrer**, **Ajouter une preuve** (≤ 3 Mo) et **Soumettre** sont mis en file d'attente sur l'appareil ; notification ambre « En attente (hors ligne) ».
- La barre supérieure affiche « Hors ligne » et « N opération(s) en attente de synchronisation ».
- Au retour du réseau (ou au démarrage, ou via le bouton « Synchroniser »), les opérations sont rejouées **dans l'ordre**. Notification verte « N opération(s) hors ligne synchronisée(s) ».
- Une opération refusée par le serveur (règle métier) est retirée de la file et signalée en rouge ; les suivantes continuent.
- La file survit à la fermeture du navigateur.
- Limites : l'écran doit avoir été chargé en ligne ; preuve > 3 Mo refusée hors ligne (« Hors ligne : fichier trop volumineux pour être mis en attente (3 Mo max) »).
[À FAIRE] PWA installable, consultation hors ligne, preuves jusqu'à 50 Mo en file, écran de conflits.

### SF-COL-9 · Données de la période [MVP]
Tableau de toutes les données de la période dans le périmètre : entité, code, indicateur, valeur, unité, statut, preuves, saisie / revue / validation par. Filtres : entité, domaine, statut. Lien vers la fiche.

### SF-COL-10 · Fiche d'une donnée [MVP] (EF-COL-06)
- En-tête : indicateur (FR/EN), entité, période, valeur et unité, statut, version, seuils, références GRI / IFC, hors seuil oui/non.
- Circuit : soumise par / le, revue par / le, validée par / le, motif de rejet éventuel.
- Preuves : nom, taille, empreinte SHA-256, déposée par / le, téléchargement (journalisé).
- Historique : tous les événements de la donnée, avec détails (valeur avant → après, version).
- Écarts liés : titre, gravité, statut.

---

## 5. Risk & Compliance (RSK)

Écran « Risques et conformité », 6 onglets. Chaque liste est restreinte au périmètre. Depuis un écart, une obligation ou un risque, un responsable ESG peut **Créer une action** : le formulaire d'action s'ouvre avec l'origine et l'entité pré-remplies. Chaque ligne affiche le nombre d'actions terminées sur le total.

### SF-RSK-1 · Écarts et incidents [MVP] (EF-RSK-05)
**Liste** : type, gravité, titre, entité, date, statut, créé par, actions (terminées / total). Ouverts en premier, puis les plus récents.

**Déclarer un écart** (A, M, C) : type* (Incident, Écart d'audit, Non-conformité ; « Dépassement de seuil » est réservé au système), titre*, entité*, gravité (Faible, Moyenne par défaut, Élevée, Critique), date (défaut aujourd'hui), description, obligation liée (optionnel).

### SF-RSK-2 · Obligations [MVP] (EF-RSK-03, EF-RSK-07)
**Liste** : source, référence, titre, entité, échéance, statut, responsable, preuves, actions.
**Nouvelle obligation** (A, M) : source* (« ESAP IFC », « Code minier », « Permis environnemental »…), référence (« ESAP-07 »), titre*, entité*, échéance, responsable.
**Changer le statut** (A, M) : Non démarré, En cours, Conforme, Non conforme. **Conforme exige au moins une preuve** jointe à l'obligation : « Joignez une preuve avant de déclarer cette obligation conforme » (RG-40).
**Joindre une preuve** (A, M, C).
[À FAIRE] (EF-RSK-11) Mise en évidence et alerte des obligations échues.

### SF-RSK-3 · Risques [MVP] (EF-RSK-01, EF-RSK-02)
**Liste** triée par score décroissant : titre, catégorie, domaine, entité, probabilité, impact, **score = probabilité × impact** (1 à 25), mesure d'atténuation, responsable, statut, actions.
**Nouveau risque** (A, M) : titre*, entité*, domaine*, catégorie*, probabilité* (1-5), impact* (1-5), mesure, responsable.
**Modifier** (A, M) : probabilité, impact, statut (Ouvert, Atténué, Clos), mesure ; journalisation avant/après.
**Risque élevé** : score ≥ 15 et non clos (RG-42).

### SF-RSK-4 · Griefs [MVP] (EF-RSK-08)
**Liste** : date de réception, entité, canal, catégorie, description, statut, résolution.
**Nouveau grief** (A, M, C) : entité*, reçu le (défaut aujourd'hui), canal*, catégorie*, description*.
**Changer le statut** (A, M, C) : Reçu → En instruction → Résolu → Clos. Résolu ou Clos exigent une résolution (« Décrivez la résolution ») ; la date de résolution est posée une fois (RG-41).
Note de conformité : ne pas saisir de données personnelles sensibles sur les plaignants au-delà du nécessaire.

### SF-RSK-5 · Clôture d'un écart [MVP] (EF-RSK-06)
Action « Clore » (A, M) sur un écart ouvert :
- aucune action liée → « Créez au moins une action corrective avant de clore cet écart » ;
- au moins une action ni terminée ni annulée → « Toutes les actions liées doivent être terminées avant de clore cet écart » ;
- sinon : statut Clos, date de clôture.
« Rouvrir » (A, M) remet l'écart à Ouvert. Règle RG-34.

### SF-RSK-6 · Programmes communautaires [MVP] (EF-RSK-09)
**Liste** : nom, entité, budget (USD), dépensé (barre), bénéficiaires réels / cible (barre), statut.
**Nouveau programme** (A, M) : nom*, entité*, budget, bénéficiaires cible.
**Mettre à jour** (A, M) : dépensé, bénéficiaires réels, statut (Planifiée, En cours, Terminée).

### SF-RSK-7 · Politiques [MVP] (EF-RSK-10)
**Liste** : titre, responsable, approuvée le, revue prévue (mise en évidence si dépassée).
**Nouvelle politique** (A, M) : titre*, responsable, date d'approbation, date de revue.

---

## 6. Actions (ACT)

### SF-ACT-1 · Écran Actions [MVP]
Onglets avec compteurs : **Mes actions** (dont je suis responsable), **En cours** (ni terminées ni annulées), **En retard**, **Terminées**. Ligne : titre (+ « en retard » en rouge), origine, entité, responsable, échéance, statut, avancement (barre), budget / dépensé, résultat.

### SF-ACT-2 · Créer une action [MVP] (EF-ACT-01 à EF-ACT-03)
Accès : A, M ; depuis l'écran Actions ou depuis un écart / une obligation / un risque.

| Champ | Règle |
|---|---|
| Titre* | |
| Description | |
| Entité* | Dans le périmètre |
| Responsable | Utilisateur de l'organisation |
| Échéance* | Date |
| Budget (USD) | Défaut 0 |
| Origine | Écart, obligation, risque ou objectif (pré-rempli si créée depuis l'origine) |
| Indicateur de résultat | Optionnel ; aide : « L'action ne peut être clôturée qu'avec une mesure validée postérieure à son lancement. » |
| Valeur de départ | Si vide : **dernière valeur validée** de l'indicateur sur l'entité et ses descendantes (RG-51) |
| Valeur cible* | Obligatoire si indicateur de résultat |

### SF-ACT-3 · Mettre à jour une action [MVP] (EF-ACT-02, EF-ACT-05)
Fiche d'action : toutes les informations, origine (lien), résultat (départ → mesure → cible, badge Atteint / Non atteint, période de mesure), preuves, historique.

| Champ | Qui peut modifier |
|---|---|
| Statut (Planifiée, En cours, Terminée) | Responsable de l'action, A, M |
| Statut Annulée | A, M uniquement |
| Avancement (0-100 %) | Responsable, A, M |
| Dépensé | Responsable, A, M |
| Échéance, responsable | A, M uniquement |
| Note (journalisée) | Responsable, A, M |
| Preuves | Responsable, A, M |

- Passage de Planifiée à En cours sans avancement saisi : 10 %.
- Une action Terminée ou Annulée n'est plus modifiable (« Action clôturée : elle ne peut plus être modifiée »).
- **En retard** : ni terminée ni annulée et échéance dépassée (RG-56).

### SF-ACT-4 · Clôturer une action avec résultat mesuré [MVP] (EF-ACT-04)
Passage au statut Terminée :
- avancement forcé à 100 % ; date de clôture enregistrée ;
- **si l'action a un indicateur de résultat** : il faut une valeur **validée** de cet indicateur, sur l'entité de l'action et ses descendantes, pour une période **égale ou postérieure au trimestre de création** de l'action. Sinon : « Aucune mesure validée de l'indicateur de résultat depuis le lancement de l'action : le résultat doit être mesuré avant clôture » (RG-53) ;
- la valeur et la période mesurées sont **figées** dans l'action ;
- Atteint : mesure ≤ cible si l'objectif est de réduire (indicateur « plus bas = mieux » ou départ > cible), sinon mesure ≥ cible (RG-57).

[À FAIRE] (EF-ACT-06) Notifications à l'assignation, à J-7 de l'échéance et en cas de retard.

---

## 7. Reporting (REP)

### SF-REP-1 · Tableau de bord [MVP] (EF-REP-01)
**Filtres** : entité (arbre, défaut : racine du périmètre), période (défaut : dernière campagne close, sinon dernière période validée). Sous-titre : « <entité> · <période> · Seules les données validées sont consolidées. »

**Tuiles** :

| Tuile | Valeur | Couleur |
|---|---|---|
| Données validées | validées / attendues ; sous-titre : en validation, à fournir | — |
| Taux de preuve | % des données validées appuyées par une preuve | vert si 100 % |
| Écarts ouverts | nombre | ambre si > 0, sinon vert |
| Actions en retard | en retard / ouvertes ; sous-titre : budget et dépensé (USD) | rouge si > 0 |
| Obligations conformes | conformes / total ; sous-titre : non conformes | rouge s'il y a des non-conformes |
| Risques élevés | nombre (score ≥ 15) | rouge si > 0 |

**Blocs** :
- **Indicateurs consolidés**, onglets E / S / G avec compteur de dépassements : code, indicateur, valeur, unité, période précédente, seuil, validées / attendues, statut (Hors seuil, En validation, Non disponible, Conforme). « Non disponible » quand aucune donnée validée : jamais 0.
- **Matrice des risques** 5×5 (impact × probabilité), risques non clos.
- **Alertes et écarts ouverts**, du plus récent au plus ancien.
- **Actions en retard**.
- **Avancement des objectifs**.
- **Griefs** et **programmes communautaires**.

Consolidation (RG-60, RG-61) : somme, moyenne ou maximum selon l'indicateur, sur l'entité choisie et toutes ses descendantes dans le périmètre de l'utilisateur, **données validées uniquement**.

### SF-REP-2 · Bibliothèque des preuves [MVP] (EF-REP-02)
Tableau : fichier, rattachée à (donnée « E11 Matières… · 2026-Q3 », action, obligation ou écart), entité, taille, empreinte SHA-256, déposée par, date ; recherche ; bouton télécharger (journalisé `download_evidence`). Restreinte au périmètre.

### SF-REP-3 · Rapports [MVP] (EF-REP-03 à EF-REP-05)
Accès : A, M, E, Au.
**Écran** : choix du rapport (« Rapport de suivi E&S (IFC) » ou « Index de contenu GRI »), entité, période, bouton Générer → aperçu à l'écran (sections, tableaux, empreinte SHA-256) → boutons Télécharger PDF, Télécharger Excel.

**Rapport de suivi E&S (IFC)** : Synthèse ; NP1 Système de gestion E&S et ESAP (obligations, top 10 des risques) ; NP2 Main-d'œuvre et santé-sécurité ; NP3 Ressources et pollution ; NP4/NP5 Communautés, griefs et programmes ; Écarts et actions correctives (avec résultats mesurés).

**Index de contenu GRI** : Synthèse ; GRI 2 ; GRI 200 ; GRI 300 ; GRI 400 ; GRI 14 secteur minier ; Écarts et actions.

Colonnes des tableaux d'indicateurs : référence, code, indicateur, unité, valeur, période précédente, seuil, validées / preuves, statut (« Hors seuil » en rouge).

**PDF** : A4 paysage, en-tête TRIVALINK, titre, organisation · entité · période, date de génération UTC et auteur, pied de chaque page : empreinte SHA-256 + pagination.
**Excel** : feuille « Rapport » (métadonnées, empreinte) + une feuille par section.
**Empreinte** : identique pour deux générations des mêmes données (date exclue) ; journalisée avec type, période, format.

Détails : `docs-dev/10-reporting.md`.
[À FAIRE] Section NP6 biodiversité ; dossier d'audit ZIP (EF-REP-07) ; graphiques (EF-REP-08).

---

## 8. Messages utilisateur de référence

| Situation | Message |
|---|---|
| Session expirée | Session expirée ou invalide |
| Rôle en lecture seule qui tente d'écrire | Accès en lecture seule |
| Rôle insuffisant | Action non autorisée pour votre rôle |
| Objet introuvable / autre client / hors périmètre | <Objet> introuvable |
| Doublon | Cet élément existe déjà |
| Valeur hors liste | Valeur invalide |
| Champ manquant | Champ obligatoire : <champ> |
| Soumission sans valeur | Saisissez une valeur avant de soumettre |
| Soumission sans preuve | Une pièce justificative est obligatoire pour cet indicateur |
| Donnée déjà soumise | Donnée déjà soumise : elle ne peut plus être modifiée |
| Revue par le contributeur | Vous ne pouvez pas revoir une donnée que vous avez soumise |
| Validation sans revue | La donnée doit avoir été revue (niveau 1) avant validation |
| Validation par le contributeur ou le relecteur | La validation finale doit être faite par une autre personne que le contributeur et le relecteur |
| Écart sans action | Créez au moins une action corrective avant de clore cet écart |
| Actions non terminées | Toutes les actions liées doivent être terminées avant de clore cet écart |
| Obligation sans preuve | Joignez une preuve avant de déclarer cette obligation conforme |
| Grief sans résolution | Décrivez la résolution |
| Action sans mesure | Aucune mesure validée de l'indicateur de résultat depuis le lancement de l'action : le résultat doit être mesuré avant clôture |
| Action close | Action clôturée : elle ne peut plus être modifiée |
| Auditeur sans expiration | Un accès auditeur doit avoir une date d'expiration |
| Mot de passe court | Le mot de passe doit contenir au moins 8 caractères |

[À FAIRE] Traduction anglaise des messages serveur selon la langue de l'utilisateur.

---

## 9. Jeu de démonstration

Organisation fictive **Kalaya Mining Group** (Guinée) : 2 filiales, 3 sites ; T1 et T2 2026 validés avec preuves ; T3 en cours (Boké-Nord tout soumis dont un dépassement MES à 78 mg/L, Kamsar en revue, Siguiri-Est à peine commencé) ; obligations ESAP, risques, écarts, actions dont une clôturée avec résultat atteint, griefs, programmes, politiques, engagements et objectifs. Second client **SIL** (Côte d'Ivoire) pour prouver l'isolation. Détail : livrable 07 §4 et `docs-dev/11-installation-dev.md`.

---

## 10. Hors périmètre du MVP

Connecteurs ERP et IoT ; IA ; ISSB, TCFD, SASB ; Finance Bridge avancé ; double matérialité ; API publique ; XBRL ; base dédiée par client ; console d'administration TRIVALINK ; notifications e-mail ; SSO.
