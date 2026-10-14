# 07 · Référentiel des indicateurs · TRIVALINK ESG

| | |
|---|---|
| **Version** | 1.0 · 13 octobre 2026 |
| **Statut** | Rédigé. **Définitions, méthodes de calcul et seuils à faire valider par un expert E&S** avant le premier pilote |
| **Source de vérité** | `app/server/src/catalog.js` (constante `INDICATORS`, 44 indicateurs), consolidation dans `app/server/src/metrics.js` |
| **Documents liés** | 02 PRD (EF-COL-xx, EF-REP-xx), 03 SFD (collecte, rapports), 05 Données (`indicators`, `datapoints`), 08 Tests, `docs-dev/09-referentiel-indicateurs.md`, `docs-dev/10-reporting.md` |

Ce document est le **dictionnaire métier des indicateurs** de TRIVALINK : ce que chaque indicateur mesure, comment le calculer, quelle pièce le prouve, comment il se consolide et à quelle norme il répond. Il s'adresse aux responsables ESG des clients (qui fournissent les données), aux experts E&S (qui valident le référentiel) et aux développeurs (qui codent la consolidation et les rapports).

---

## 1. Principes

1. **Un socle unique, plusieurs référentiels en sortie** : on saisit une fois, on publie selon GRI, IFC et demain ISSB ou ESRS. Chaque indicateur porte ses correspondances.
2. **Pas de chiffre sans preuve** : par défaut, chaque indicateur exige une pièce justificative à la soumission.
3. **Seules les données validées comptent** : saisie, revue et validation par trois personnes distinctes avant toute consolidation.
4. **L'absence n'est pas zéro** : une donnée manquante s'affiche « Non disponible », jamais 0.
5. **Les seuils de départ sont indicatifs** : chaque client les remplace par ceux de ses permis, de sa convention minière et de son ESAP.
6. **Le catalogue est copié par client** (`installCatalog`) : chaque client ajuste seuils, preuve obligatoire et activation sans toucher aux autres.
7. **Un code ne change jamais de sens** et n'est jamais réutilisé : imports, objectifs, rapports et historiques s'y réfèrent.

Segment visé par ce catalogue : mines et groupes industriels, d'abord en Guinée. Périodicité : trimestrielle (`AAAA-Qn`).

## 2. Structure d'un indicateur

| Attribut | Valeurs | Effet dans la plateforme |
|---|---|---|
| `code` | `E01`…`E20`, `S01`…`S17`, `G01`…`G07` | Identifiant stable ; utilisé par l'import CSV / Excel |
| `domain` | `E`, `S`, `G` | Onglet du tableau de bord, filtre de campagne |
| `category` | Énergie, Eau, Santé-sécurité… | Regroupement à l'affichage et dans les rapports |
| `name_fr`, `name_en` | texte | Libellés bilingues |
| `unit` | GJ, m³, tCO2e, mg/L, %, nb, taux, USD… | Affichée partout à côté de la valeur |
| `direction` | ↓ `lower`, ↑ `higher`, – `neutral` | Calcul « objectif atteint » et « résultat atteint » des actions |
| `aggregation` | `sum`, `avg`, `max` | Consolidation multi-entités (§5) |
| `threshold_min`, `threshold_max` | nombre ou vide | Hors seuil à la soumission → écart automatique de gravité élevée |
| `gri` | ex. `GRI 303-4` | Section de l'index de contenu GRI |
| `ifc` | `NP1` à `NP8` | Section du rapport de suivi IFC |
| `level` | `site`, `group` | Qui fournit : sites, ou groupe et filiales |
| `evidence_required` | 0 / 1 (1 par défaut) | Soumission impossible sans pièce |
| `active` | 0 / 1 | Inactif : exclu des nouvelles campagnes et du tableau de bord |

Modifiable par le client (A, M) : seuils, preuve obligatoire, activation. Le reste est fixé par le catalogue TRIVALINK.

## 3. Catalogue

44 indicateurs : 20 environnementaux, 17 sociaux, 7 de gouvernance. Cible de la Product Foundation pour le MVP : 35 à 50.

### 3.1 Environnement (E) · 20 indicateurs, fournis par les sites

| Code | Catégorie | Indicateur | Unité | Sens | Agrég. | Seuils de départ | GRI | IFC | Niveau |
|---|---|---|---|:-:|---|---|---|---|---|
| E01 | Énergie | Consommation totale d'énergie | GJ | ↓ | sum | — | GRI 302-1 | NP3 | site |
| E02 | Énergie | Consommation de gazole | m³ | ↓ | sum | — | GRI 302-1 | NP3 | site |
| E03 | Énergie | Électricité achetée au réseau | MWh | ↓ | sum | — | GRI 302-1 | NP3 | site |
| E04 | Énergie | Part d'énergie renouvelable | % | ↑ | avg | — | GRI 302-1 | NP3 | site |
| E05 | Émissions | Émissions de GES scope 1 | tCO2e | ↓ | sum | — | GRI 305-1 | NP3 | site |
| E06 | Émissions | Émissions de GES scope 2 | tCO2e | ↓ | sum | — | GRI 305-2 | NP3 | site |
| E07 | Émissions | Intensité GES par tonne produite | kgCO2e/t | ↓ | avg | — | GRI 305-4 | NP3 | site |
| E08 | Eau | Prélèvement total d'eau | m³ | ↓ | sum | — | GRI 303-3 | NP3 | site |
| E09 | Eau | Eau recyclée ou réutilisée | % | ↑ | avg | — | GRI 303-3 | NP3 | site |
| E10 | Eau | Volume d'eau rejetée | m³ | ↓ | sum | — | GRI 303-4 | NP3 | site |
| E11 | Eau | Matières en suspension dans les rejets (max) | mg/L | ↓ | max | max 50 | GRI 303-4 | NP3 | site |
| E12 | Eau | pH des rejets (valeur la plus défavorable) | pH | – | max | min 6 · max 9 | GRI 303-4 | NP3 | site |
| E13 | Déchets | Déchets dangereux générés | t | ↓ | sum | — | GRI 306-3 | NP3 | site |
| E14 | Déchets | Déchets non dangereux générés | t | ↓ | sum | — | GRI 306-3 | NP3 | site |
| E15 | Déchets | Taux de valorisation des déchets | % | ↑ | avg | — | GRI 306-4 | NP3 | site |
| E16 | Mine | Stériles et résidus miniers générés | kt | – | sum | — | GRI 14.5 | NP3 | site |
| E17 | Biodiversité | Surface perturbée cumulée | ha | ↓ | sum | — | GRI 14.4 | NP6 | site |
| E18 | Biodiversité | Surface réhabilitée cumulée | ha | ↑ | sum | — | GRI 14.4 | NP6 | site |
| E19 | Air | Poussières PM10 en limite de site (moyenne) | µg/m³ | ↓ | max | max 50 | GRI 305-7 | NP3 | site |
| E20 | Pollution | Déversements significatifs | nb | ↓ | sum | max 0 | GRI 306-3 | NP3 | site |

### 3.2 Social (S) · 17 indicateurs, fournis par les sites

| Code | Catégorie | Indicateur | Unité | Sens | Agrég. | Seuils de départ | GRI | IFC | Niveau |
|---|---|---|---|:-:|---|---|---|---|---|
| S01 | Effectifs | Effectif total (salariés et sous-traitants) | nb | – | sum | — | GRI 2-7 | NP2 | site |
| S02 | Effectifs | Part de salariés nationaux | % | ↑ | avg | — | GRI 202-2 | NP2 | site |
| S03 | Effectifs | Part de femmes dans l’effectif | % | ↑ | avg | — | GRI 405-1 | NP2 | site |
| S04 | Santé-sécurité | Heures travaillées | h | – | sum | — | GRI 403-9 | NP2 | site |
| S05 | Santé-sécurité | Accidents avec arrêt | nb | ↓ | sum | — | GRI 403-9 | NP2 | site |
| S06 | Santé-sécurité | Taux de fréquence (LTIFR, par million d’heures) | taux | ↓ | avg | max 1,50 | GRI 403-9 | NP2 | site |
| S07 | Santé-sécurité | Taux de gravité (jours perdus par millier d’heures) | taux | ↓ | avg | — | GRI 403-9 | NP2 | site |
| S08 | Santé-sécurité | Accidents mortels | nb | ↓ | sum | max 0 | GRI 403-9 | NP2 | site |
| S09 | Santé-sécurité | Presque-accidents déclarés | nb | ↑ | sum | — | GRI 403-9 | NP2 | site |
| S10 | Formation | Heures de formation par salarié | h | ↑ | avg | — | GRI 404-1 | NP2 | site |
| S11 | Formation | Heures de formation santé-sécurité | h | ↑ | sum | — | GRI 403-5 | NP2 | site |
| S12 | Communautés | Griefs reçus des communautés | nb | – | sum | — | GRI 2-25 | NP4 | site |
| S13 | Communautés | Griefs traités dans les délais | % | ↑ | avg | min 80 | GRI 2-25 | NP4 | site |
| S14 | Communautés | Bénéficiaires des programmes communautaires | nb | ↑ | sum | — | GRI 413-1 | NP4 | site |
| S15 | Communautés | Investissement communautaire | USD | ↑ | sum | — | GRI 201-1 | NP4 | site |
| S16 | Communautés | Achats auprès de fournisseurs locaux | % | ↑ | avg | — | GRI 204-1 | NP4 | site |
| S17 | Communautés | Personnes déplacées physiquement ou économiquement | nb | ↓ | sum | — | GRI 14.12 | NP5 | site |

### 3.3 Gouvernance (G) · 7 indicateurs, fournis par le groupe et les filiales

| Code | Catégorie | Indicateur | Unité | Sens | Agrég. | Seuils de départ | GRI | IFC | Niveau |
|---|---|---|---|:-:|---|---|---|---|---|
| G01 | Politiques | Politiques ESG approuvées et à jour | nb | ↑ | sum | — | GRI 2-23 | NP1 | group |
| G02 | Éthique | Salariés formés à l’anti-corruption | % | ↑ | avg | — | GRI 205-2 | NP1 | group |
| G03 | Éthique | Cas de corruption avérés | nb | ↓ | sum | max 0 | GRI 205-3 | NP1 | group |
| G04 | Transparence | Paiements versés à l’État | kUSD | – | sum | — | GRI 207-4 | NP1 | group |
| G05 | Gouvernance | Administrateurs indépendants | % | ↑ | avg | — | GRI 2-9 | NP1 | group |
| G06 | Éthique | Alertes éthiques reçues | nb | – | sum | — | GRI 2-26 | NP1 | group |
| G07 | Conformité | Sanctions pour non-conformité E&S | nb | ↓ | sum | max 0 | GRI 2-27 | NP1 | group |

### 3.4 Indicateurs à seuil (écart automatique)

| Code | Seuil | Logique |
|---|---|---|
| E11 MES des rejets | max 50 mg/L | Valeur > 50 → écart |
| E12 pH des rejets | min 6, max 9 | Valeur < 6 ou > 9 → écart |
| E19 PM10 en limite de site | max 50 µg/m³ | Valeur > 50 → écart |
| E20 Déversements significatifs | max 0 | Tout déversement → écart |
| S06 LTIFR | max 1,5 | Valeur > 1,5 → écart |
| S08 Accidents mortels | max 0 | Tout décès → écart |
| S13 Griefs traités dans les délais | min 80 % | Valeur < 80 → écart |
| G03 Cas de corruption avérés | max 0 | Tout cas → écart |
| G07 Sanctions E&S | max 0 | Toute sanction → écart |

Bornes incluses = conforme (RG-30). L'écart automatique n'est créé que si aucun écart n'est déjà ouvert sur la donnée (RG-31).

## 4. Données de démonstration

Le jeu de démonstration (`seed.js`) génère des valeurs **fictives mais réalistes** pour l'organisation Kalaya Mining Group : 3 sites (Boké-Nord, Terminal de Kamsar, Siguiri-Est) et la structure groupe (GRP, KBX, KAU). T1 et T2 2026 sont validés ; T3 2026 est en cours de collecte.

### 4.1 Scénario

- **T1, Siguiri-Est** : un déversement d'hydrocarbures (E20 = 1, seuil 0) crée un écart, traité par une action dont le résultat est mesuré au T2.
- **T3, Boké-Nord, E11 (MES)** : 78 mg/L soumis (seuil 50) avec le commentaire « Fortes pluies fin septembre, bassin B2 saturé ». Un écart de dépassement est ouvert et déjà traité par l'action « Curer le bassin de décantation B2 et ajouter un traitement par floculant » (retour sous 50 mg/L attendu au T4). **C'est le point d'entrée de la démonstration commerciale.**
- **T3, état de la campagne** : Boké-Nord a tout soumis ; le Terminal de Kamsar est en revue (E et G revus, S soumis) ; Siguiri-Est n'a saisi que trois brouillons (E01, E02, E05). Le test « boucle complète » part d'une donnée E11 de Siguiri-Est encore à fournir et y saisit 64 mg/L.
- **Autres écarts** : constat d'audit prêteur « registre des griefs incomplet à Siguiri-Est » (action liée à l'ESAP-3) ; plainte riveraine pour poussières au Terminal de Kamsar ; action « Faire certifier le SGES » liée à l'obligation ESAP-1.
- **Tendance** : baisse d'environ 2 % par trimestre sur l'énergie et les émissions (E01, E02, E05, E07) pour illustrer l'avancement des objectifs.

### 4.2 Valeurs consolidées groupe (données validées)

Calculées le 13/10/2026 à partir du jeu de démonstration, selon la règle d'agrégation de chaque indicateur.

| Code | Indicateur | Unité | T1 2026 | T2 2026 | Évolution | Seuil |
|---|---|---|--:|--:|--:|---|
| E01 | Consommation totale d'énergie | GJ | 88 492 | 90 091 | +1,8 % | — |
| E02 | Consommation de gazole | m³ | 1 901 | 1 898 | -0,2 % | — |
| E03 | Électricité achetée au réseau | MWh | 2 994 | 2 980 | -0,5 % | — |
| E04 | Part d'énergie renouvelable | % | 6,96 | 6,64 | -4,6 % | — |
| E05 | Émissions de GES scope 1 | tCO2e | 5 345 | 5 107 | -4,5 % | — |
| E06 | Émissions de GES scope 2 | tCO2e | 1 753 | 1 855 | +5,8 % | — |
| E07 | Intensité GES par tonne produite | kgCO2e/t | 8,53 | 8,36 | -2,0 % | — |
| E08 | Prélèvement total d'eau | m³ | 689 844 | 716 209 | +3,8 % | — |
| E09 | Eau recyclée ou réutilisée | % | 32,59 | 31,86 | -2,2 % | — |
| E10 | Volume d'eau rejetée | m³ | 363 287 | 354 673 | -2,4 % | — |
| E11 | Matières en suspension dans les rejets (max) | mg/L | 35,82 | 40,06 | +11,8 % | max 50 |
| E12 | pH des rejets (valeur la plus défavorable) | pH | 8,10 | 8,10 | +0,0 % | min 6 · max 9 |
| E13 | Déchets dangereux générés | t | 118,29 | 115,12 | -2,7 % | — |
| E14 | Déchets non dangereux générés | t | 1 152 | 1 153 | +0,1 % | — |
| E15 | Taux de valorisation des déchets | % | 39,93 | 40,52 | +1,5 % | — |
| E16 | Stériles et résidus miniers générés | kt | 5 849 | 6 060 | +3,6 % | — |
| E17 | Surface perturbée cumulée | ha | 1 974 | 2 012 | +1,9 % | — |
| E18 | Surface réhabilitée cumulée | ha | 471 | 480 | +1,9 % | — |
| E19 | Poussières PM10 en limite de site (moyenne) | µg/m³ | 42,50 | 39,79 | -6,4 % | max 50 |
| E20 | Déversements significatifs | nb | 1 | 0 | -100,0 % | max 0 |
| S01 | Effectif total (salariés et sous-traitants) | nb | 4 430 | 4 371 | -1,3 % | — |
| S02 | Part de salariés nationaux | % | 88,38 | 89,29 | +1,0 % | — |
| S03 | Part de femmes dans l’effectif | % | 12,35 | 12,34 | -0,1 % | — |
| S04 | Heures travaillées | h | 2 314 576 | 2 316 851 | +0,1 % | — |
| S05 | Accidents avec arrêt | nb | 1,98 | 2 | +1,0 % | — |
| S06 | Taux de fréquence (LTIFR, par million d’heures) | taux | 0,68 | 0,69 | +2,0 % | max 1,50 |
| S07 | Taux de gravité (jours perdus par millier d’heures) | taux | 0,05 | 0,05 | +0,0 % | — |
| S08 | Accidents mortels | nb | 0 | 0 | — | max 0 |
| S09 | Presque-accidents déclarés | nb | 65,97 | 64,48 | -2,3 % | — |
| S10 | Heures de formation par salarié | h | 9,31 | 9,21 | -1,1 % | — |
| S11 | Heures de formation santé-sécurité | h | 11 486 | 11 477 | -0,1 % | — |
| S12 | Griefs reçus des communautés | nb | 25,54 | 26,71 | +4,6 % | — |
| S13 | Griefs traités dans les délais | % | 90,11 | 90,13 | +0,0 % | min 80 |
| S14 | Bénéficiaires des programmes communautaires | nb | 5 402 | 5 599 | +3,6 % | — |
| S15 | Investissement communautaire | USD | 748 464 | 688 819 | -8,0 % | — |
| S16 | Achats auprès de fournisseurs locaux | % | 35,42 | 36,34 | +2,6 % | — |
| S17 | Personnes déplacées physiquement ou économiquement | nb | 0 | 0 | — | — |
| G01 | Politiques ESG approuvées et à jour | nb | 8,75 | 8,50 | -2,9 % | — |
| G02 | Salariés formés à l’anti-corruption | % | 77,27 | 85,39 | +10,5 % | — |
| G03 | Cas de corruption avérés | nb | 0 | 0 | — | max 0 |
| G04 | Paiements versés à l’État | kUSD | 18 007 | 19 014 | +5,6 % | — |
| G05 | Administrateurs indépendants | % | 32,34 | 34,60 | +7,0 % | — |
| G06 | Alertes éthiques reçues | nb | 4,18 | 4,11 | -1,7 % | — |
| G07 | Sanctions pour non-conformité E&S | nb | 0 | 0 | — | max 0 |

### 4.3 Anomalies connues du jeu de démonstration

- Certains indicateurs de comptage portent des **valeurs décimales** (S05, S09, S12, G01, G06) : artefact du générateur aléatoire. À corriger dans `seed.js` (arrondir les indicateurs d'unité `nb`) ; sans effet sur le code de production, mais visible en démonstration.
- Les ratios consolidés (S03, S06…) sont des **moyennes simples** de sites, pas des ratios pondérés (§5.2).

## 5. Règles de consolidation

### 5.1 Règle générale (RG-60, RG-61)

Valeur consolidée d'un indicateur pour une entité et une période = agrégation des valeurs **validées** de l'entité et de toutes ses descendantes, **dans le périmètre de l'utilisateur** :

| Agrégation | Usage | Exemple |
|---|---|---|
| `sum` | Volumes, effectifs, nombres, montants | E08 prélèvement d'eau groupe = somme des sites |
| `avg` | Ratios et pourcentages (moyenne simple, non pondérée) | E04 part d'énergie renouvelable |
| `max` | Concentrations réglementaires : on retient le pire site | E11 MES groupe = MES du site le plus élevé |

Aucune valeur validée → `null` (« Non disponible »).

### 5.2 Limite connue : les ratios (écart P1)

La moyenne simple de ratios de sites est **mathématiquement fausse** dès que les sites n'ont pas la même taille. Exemple avec le LTIFR (S06) :

| Site | Accidents (S05) | Heures (S04) | LTIFR site |
|---|--:|--:|--:|
| Site A | 1 | 1 000 000 | 1,0 |
| Site B | 0 | 100 000 | 0,0 |
| **Moyenne simple (MVP)** | | | **0,5** |
| **Ratio correct** | 1 | 1 100 000 | **0,91** |

Indicateurs concernés : E04, E07, E09, E15, S02, S03, S06, S07, S10, S13, S16, G02, G05. Correction prévue : indicateurs **calculés** (colonne `formula`, ex. `S05 * 1e6 / S04`), recalculés après consolidation des composantes. En attendant, le rapport doit signaler que ces valeurs sont des moyennes de sites.

### 5.3 Indicateurs de stock

E17 et E18 sont des **cumuls** en fin de trimestre : on ne les additionne jamais d'une période à l'autre ; la consolidation entre sites (somme) est correcte.

### 5.4 Objectifs et résultats d'actions

- Valeur actuelle d'un objectif = dernière période validée de l'indicateur sur le périmètre de l'objectif (RG-63).
- Avancement = (actuel − départ) / (cible − départ), borné 0-100 (RG-64).
- Résultat d'une action : mesure validée d'une période ≥ trimestre de création, comparée à la cible selon le sens de l'indicateur (RG-53, RG-57).

## 6. Fiches indicateurs

Chaque fiche donne la définition opérationnelle, la méthode de calcul, la preuve attendue et les points d'attention. Les facteurs de conversion et d'émission cités sont des **valeurs usuelles à confirmer** par l'expert E&S et à documenter dans le commentaire de la donnée.

### 6.1 Environnement

#### E01 · Consommation totale d'énergie

*Total energy consumption*

| Attribut | Valeur |
|---|---|
| Catégorie | Énergie |
| Unité | GJ |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 302-1 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 90 091 GJ |

- **Définition** : Toute l'énergie consommée par le site sur le trimestre, toutes sources confondues : combustibles (gazole, fioul lourd, GPL), électricité achetée, énergie autoproduite renouvelable.
- **Méthode de calcul** : Somme des consommations converties en GJ. Gazole : volume (m³) × 38,6 GJ/m³ ; électricité : MWh × 3,6. Facteurs à documenter dans le commentaire.
- **Preuve attendue** : Relevés de compteurs, factures d'électricité, bons de livraison et états de stock de carburant, feuille de calcul de conversion.
- **Points d'attention** : Ne pas double-compter l'électricité produite sur site par des groupes au gazole (compter le gazole, pas l'électricité produite).

#### E02 · Consommation de gazole

*Diesel consumption*

| Attribut | Valeur |
|---|---|
| Catégorie | Énergie |
| Unité | m³ |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 302-1 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 1 898 m³ |

- **Définition** : Volume de gazole consommé par les engins, groupes électrogènes, véhicules et installations du site.
- **Méthode de calcul** : Stock initial + livraisons − stock final, en m³.
- **Preuve attendue** : Bons de livraison, inventaires de cuve, registre de distribution carburant.
- **Points d'attention** : Inclure le gazole des sous-traitants s'il est fourni par le site.

#### E03 · Électricité achetée au réseau

*Grid electricity purchased*

| Attribut | Valeur |
|---|---|
| Catégorie | Énergie |
| Unité | MWh |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 302-1 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 2 980 MWh |

- **Définition** : Électricité achetée au réseau public (EDG en Guinée) ou à un tiers.
- **Méthode de calcul** : Somme des consommations facturées sur le trimestre, en MWh.
- **Preuve attendue** : Factures du fournisseur, relevés de compteur.
- **Points d'attention** : Sert au calcul du scope 2 (E06).

#### E04 · Part d'énergie renouvelable

*Renewable energy share*

| Attribut | Valeur |
|---|---|
| Catégorie | Énergie |
| Unité | % |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | — |
| Correspondances | GRI 302-1 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 6,64 % |

- **Définition** : Part de l'énergie totale (E01) provenant de sources renouvelables (solaire, hydraulique, biomasse durable).
- **Méthode de calcul** : Énergie renouvelable (GJ) / E01 (GJ) × 100.
- **Preuve attendue** : Relevés de production solaire, contrat d'achat d'électricité verte, attestation d'origine.
- **Points d'attention** : Ratio : la consolidation par moyenne simple est approximative, voir §5.

#### E05 · Émissions de GES scope 1

*Scope 1 GHG emissions*

| Attribut | Valeur |
|---|---|
| Catégorie | Émissions |
| Unité | tCO2e |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 305-1 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 5 107 tCO2e |

- **Définition** : Émissions directes de gaz à effet de serre des sources détenues ou contrôlées : combustion de carburants, explosifs, procédés.
- **Méthode de calcul** : Σ (quantité de combustible × facteur d'émission). Gazole : ~2,68 tCO2e/m³ (à confirmer selon la source retenue, GHG Protocol / GIEC).
- **Preuve attendue** : Feuille de calcul des émissions avec facteurs et sources, données d'activité (E02).
- **Points d'attention** : Indiquer dans le commentaire le jeu de facteurs utilisé et sa version.

#### E06 · Émissions de GES scope 2

*Scope 2 GHG emissions*

| Attribut | Valeur |
|---|---|
| Catégorie | Émissions |
| Unité | tCO2e |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 305-2 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 1 855 tCO2e |

- **Définition** : Émissions indirectes liées à l'électricité achetée.
- **Méthode de calcul** : E03 (MWh) × facteur d'émission du réseau (méthode « location-based »).
- **Preuve attendue** : Feuille de calcul, facteur d'émission du réseau guinéen et sa source.
- **Points d'attention** : Le facteur réseau change peu d'un trimestre à l'autre ; le documenter une fois par an.

#### E07 · Intensité GES par tonne produite

*GHG intensity per tonne produced*

| Attribut | Valeur |
|---|---|
| Catégorie | Émissions |
| Unité | kgCO2e/t |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | — |
| Correspondances | GRI 305-4 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 8,36 kgCO2e/t |

- **Définition** : Émissions scope 1 + 2 rapportées à la production (bauxite, or, minerai traité).
- **Méthode de calcul** : (E05 + E06) × 1000 / tonnes produites, en kgCO2e/t.
- **Preuve attendue** : Rapport de production du trimestre, calcul des émissions.
- **Points d'attention** : Ratio : à recalculer au niveau groupe à partir des totaux (indicateur calculé, §5). La production n'est pas encore un indicateur du catalogue.

#### E08 · Prélèvement total d'eau

*Total water withdrawal*

| Attribut | Valeur |
|---|---|
| Catégorie | Eau |
| Unité | m³ |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 303-3 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 716 209 m³ |

- **Définition** : Volume d'eau prélevé dans le milieu (surface, souterraine) ou acheté à un tiers.
- **Méthode de calcul** : Somme des volumes prélevés, en m³.
- **Preuve attendue** : Relevés de débitmètres, registre de pompage, factures d'eau, autorisation de prélèvement.
- **Points d'attention** : Distinguer les sources dans le commentaire (GRI 303-3 demande la ventilation).

#### E09 · Eau recyclée ou réutilisée

*Water recycled or reused*

| Attribut | Valeur |
|---|---|
| Catégorie | Eau |
| Unité | % |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | — |
| Correspondances | GRI 303-3 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 31,86 % |

- **Définition** : Part de l'eau utilisée par le site qui est recyclée ou réutilisée.
- **Méthode de calcul** : Volume recyclé / (volume prélevé + volume recyclé) × 100.
- **Preuve attendue** : Bilan hydrique du site, relevés de débitmètres de recirculation.
- **Points d'attention** : Ratio, consolidation approximative.

#### E10 · Volume d'eau rejetée

*Water discharged*

| Attribut | Valeur |
|---|---|
| Catégorie | Eau |
| Unité | m³ |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 303-4 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 354 673 m³ |

- **Définition** : Volume total d'effluents rejetés dans le milieu.
- **Méthode de calcul** : Somme des volumes rejetés aux points de rejet autorisés, en m³.
- **Preuve attendue** : Relevés de débit aux exutoires, registre de rejets.
- **Points d'attention** : Les points de rejet sont fixés par le permis environnemental.

#### E11 · Matières en suspension dans les rejets (max)

*Total suspended solids in effluent (max)*

| Attribut | Valeur |
|---|---|
| Catégorie | Eau |
| Unité | mg/L |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | maximum |
| Seuils de départ | max 50 |
| Correspondances | GRI 303-4 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 40,06 mg/L |

- **Définition** : Concentration en matières en suspension (MES) dans les rejets : la valeur la plus élevée mesurée sur le trimestre.
- **Méthode de calcul** : Maximum des analyses du trimestre, tous points de rejet, en mg/L. Consolidation groupe : maximum des sites.
- **Preuve attendue** : Bulletins d'analyse de laboratoire (accrédité si possible), plan d'échantillonnage.
- **Points d'attention** : Seuil de départ 50 mg/L (Directives EHS générales). Remplacer par la valeur du permis. Indicateur du scénario de démonstration (78 mg/L à Boké-Nord au T3).

#### E12 · pH des rejets (valeur la plus défavorable)

*Effluent pH (worst value)*

| Attribut | Valeur |
|---|---|
| Catégorie | Eau |
| Unité | pH |
| Sens favorable | – neutre |
| Consolidation multi-entités | maximum |
| Seuils de départ | min 6 · max 9 |
| Correspondances | GRI 303-4 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 8,10 pH |

- **Définition** : pH des rejets : la valeur la plus éloignée de la plage autorisée sur le trimestre.
- **Méthode de calcul** : Saisir la valeur la plus défavorable (la plus basse si < 6, la plus haute si > 9).
- **Preuve attendue** : Bulletins d'analyse, relevés de pH-mètre étalonné.
- **Points d'attention** : Limite connue : l'agrégation `max` ne détecte pas un pH trop bas au niveau groupe. À traiter par une agrégation « pire valeur » [À FAIRE].

#### E13 · Déchets dangereux générés

*Hazardous waste generated*

| Attribut | Valeur |
|---|---|
| Catégorie | Déchets |
| Unité | t |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 306-3 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 115,12 t |

- **Définition** : Masse de déchets dangereux générés (huiles usagées, batteries, réactifs, sols pollués).
- **Méthode de calcul** : Somme des pesées ou estimations, en tonnes.
- **Preuve attendue** : Registre des déchets, bordereaux de suivi, certificats d'élimination du prestataire agréé.
- **Points d'attention** : Les déchets miniers (stériles, résidus) sont comptés en E16, pas ici.

#### E14 · Déchets non dangereux générés

*Non-hazardous waste generated*

| Attribut | Valeur |
|---|---|
| Catégorie | Déchets |
| Unité | t |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 306-3 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 1 153 t |

- **Définition** : Masse de déchets non dangereux générés (ferrailles, emballages, déchets ménagers).
- **Méthode de calcul** : Somme des pesées ou estimations, en tonnes.
- **Preuve attendue** : Registre des déchets, bons d'enlèvement.

#### E15 · Taux de valorisation des déchets

*Waste recovery rate*

| Attribut | Valeur |
|---|---|
| Catégorie | Déchets |
| Unité | % |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | — |
| Correspondances | GRI 306-4 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 40,52 % |

- **Définition** : Part des déchets (E13 + E14) valorisés : recyclage, réemploi, valorisation énergétique.
- **Méthode de calcul** : Déchets valorisés / déchets générés × 100.
- **Preuve attendue** : Certificats de valorisation des prestataires, registre des déchets.
- **Points d'attention** : Ratio, consolidation approximative.

#### E16 · Stériles et résidus miniers générés

*Waste rock and tailings generated*

| Attribut | Valeur |
|---|---|
| Catégorie | Mine |
| Unité | kt |
| Sens favorable | – neutre |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 14.5 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 6 060 kt |

- **Définition** : Quantité de stériles et de résidus miniers produits par l'exploitation.
- **Méthode de calcul** : Somme des tonnages déplacés ou déposés, en kilotonnes.
- **Preuve attendue** : Rapports de production minière, plans de stockage des résidus.
- **Points d'attention** : Sens neutre : le volume suit la production. GRI 14.5 demande aussi la gestion des installations de résidus.

#### E17 · Surface perturbée cumulée

*Cumulative land disturbed*

| Attribut | Valeur |
|---|---|
| Catégorie | Biodiversité |
| Unité | ha |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 14.4 · IFC NP6 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 2 012 ha |

- **Définition** : Surface totale perturbée depuis le début de l'exploitation (fosses, verses, pistes, installations).
- **Méthode de calcul** : Valeur cumulée en fin de trimestre, en hectares.
- **Preuve attendue** : Levés topographiques, images satellites ou drone, plan de mine.
- **Points d'attention** : Indicateur de stock (cumul), pas de flux : ne pas additionner les trimestres.

#### E18 · Surface réhabilitée cumulée

*Cumulative land rehabilitated*

| Attribut | Valeur |
|---|---|
| Catégorie | Biodiversité |
| Unité | ha |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 14.4 · IFC NP6 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 480 ha |

- **Définition** : Surface réhabilitée cumulée (remodelage, terre végétale, revégétalisation).
- **Méthode de calcul** : Valeur cumulée en fin de trimestre, en hectares.
- **Preuve attendue** : Rapports de réhabilitation, photos géolocalisées, levés.
- **Points d'attention** : Rapport E18 / E17 = taux de réhabilitation, indicateur calculé à ajouter.

#### E19 · Poussières PM10 en limite de site (moyenne)

*PM10 dust at site boundary (average)*

| Attribut | Valeur |
|---|---|
| Catégorie | Air |
| Unité | µg/m³ |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | maximum |
| Seuils de départ | max 50 |
| Correspondances | GRI 305-7 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 39,79 µg/m³ |

- **Définition** : Concentration moyenne de poussières PM10 mesurée en limite de site, vers les zones habitées.
- **Méthode de calcul** : Moyenne des mesures du trimestre par station ; consolidation groupe : maximum des sites.
- **Preuve attendue** : Rapports des stations de mesure ou campagnes de mesure, certificats d'étalonnage.
- **Points d'attention** : Seuil de départ 50 µg/m³ (ligne directrice OMS 24 h, indicatif). Le nom dit « moyenne » mais l'agrégation groupe est le maximum : c'est voulu (pire site).

#### E20 · Déversements significatifs

*Significant spills*

| Attribut | Valeur |
|---|---|
| Catégorie | Pollution |
| Unité | nb |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | max 0 |
| Correspondances | GRI 306-3 · IFC NP3 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 0 nb |

- **Définition** : Nombre de déversements significatifs (hydrocarbures, réactifs, boues) atteignant le sol ou l'eau.
- **Méthode de calcul** : Nombre d'événements du trimestre au-delà du seuil interne de significativité.
- **Preuve attendue** : Rapports d'incident, photos, rapport de dépollution.
- **Points d'attention** : Seuil 0 : tout déversement crée un écart automatique. Scénario de démo : Siguiri-Est au T1.

### 6.2 Social

#### S01 · Effectif total (salariés et sous-traitants)

*Total workforce (employees and contractors)*

| Attribut | Valeur |
|---|---|
| Catégorie | Effectifs |
| Unité | nb |
| Sens favorable | – neutre |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 2-7 · IFC NP2 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 4 371 nb |

- **Définition** : Effectif total présent sur le site en fin de trimestre, salariés et sous-traitants.
- **Méthode de calcul** : Nombre de personnes au dernier jour du trimestre.
- **Preuve attendue** : Extraction du SIRH, listes des sous-traitants, registre d'accès au site.
- **Points d'attention** : Préciser la répartition salariés / sous-traitants dans le commentaire (GRI 2-7, 2-8).

#### S02 · Part de salariés nationaux

*Share of national employees*

| Attribut | Valeur |
|---|---|
| Catégorie | Effectifs |
| Unité | % |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | — |
| Correspondances | GRI 202-2 · IFC NP2 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 89,29 % |

- **Définition** : Part des salariés de nationalité guinéenne (ou du pays d'implantation).
- **Méthode de calcul** : Salariés nationaux / salariés × 100.
- **Preuve attendue** : Extraction SIRH par nationalité.
- **Points d'attention** : Ratio. Suivi souvent exigé par la convention minière (contenu local).

#### S03 · Part de femmes dans l’effectif

*Share of women in workforce*

| Attribut | Valeur |
|---|---|
| Catégorie | Effectifs |
| Unité | % |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | — |
| Correspondances | GRI 405-1 · IFC NP2 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 12,34 % |

- **Définition** : Part des femmes dans l'effectif total.
- **Méthode de calcul** : Femmes / effectif × 100.
- **Preuve attendue** : Extraction SIRH par genre.
- **Points d'attention** : Ratio : la moyenne simple des sites est fausse, il faut pondérer par S01 (§5).

#### S04 · Heures travaillées

*Hours worked*

| Attribut | Valeur |
|---|---|
| Catégorie | Santé-sécurité |
| Unité | h |
| Sens favorable | – neutre |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 403-9 · IFC NP2 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 2 316 851 h |

- **Définition** : Total des heures travaillées par les salariés et les sous-traitants.
- **Méthode de calcul** : Somme des heures pointées ou contractuelles du trimestre.
- **Preuve attendue** : Relevés de pointage, états de paie, déclarations des sous-traitants.
- **Points d'attention** : Dénominateur des taux S06 et S07.

#### S05 · Accidents avec arrêt

*Lost-time injuries*

| Attribut | Valeur |
|---|---|
| Catégorie | Santé-sécurité |
| Unité | nb |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 403-9 · IFC NP2 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 2 nb |

- **Définition** : Nombre d'accidents du travail ayant entraîné au moins un jour d'arrêt.
- **Méthode de calcul** : Nombre d'accidents du trimestre, salariés et sous-traitants.
- **Preuve attendue** : Registre des accidents, déclarations à la CNSS, rapports d'enquête.
- **Points d'attention** : Nombre entier : les valeurs décimales du jeu de démonstration sont un artefact de génération (§4.3).

#### S06 · Taux de fréquence (LTIFR, par million d’heures)

*Lost-time injury frequency rate (per million hours)*

| Attribut | Valeur |
|---|---|
| Catégorie | Santé-sécurité |
| Unité | taux |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | max 1,50 |
| Correspondances | GRI 403-9 · IFC NP2 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 0,69 taux |

- **Définition** : Taux de fréquence des accidents avec arrêt (LTIFR) par million d'heures travaillées.
- **Méthode de calcul** : S05 × 1 000 000 / S04.
- **Preuve attendue** : Calcul à partir de S05 et S04, registre des accidents.
- **Points d'attention** : **Consolidation actuelle fausse** : moyenne simple des sites. Doit être recalculé au niveau groupe : Σ S05 × 10⁶ / Σ S04 (écart P1, §5). Seuil de départ 1,5.

#### S07 · Taux de gravité (jours perdus par millier d’heures)

*Severity rate (days lost per thousand hours)*

| Attribut | Valeur |
|---|---|
| Catégorie | Santé-sécurité |
| Unité | taux |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | — |
| Correspondances | GRI 403-9 · IFC NP2 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 0,05 taux |

- **Définition** : Taux de gravité : jours perdus pour accident par millier d'heures travaillées.
- **Méthode de calcul** : Jours perdus × 1 000 / S04.
- **Preuve attendue** : Registre des arrêts de travail, certificats médicaux.
- **Points d'attention** : Même limite de consolidation que S06.

#### S08 · Accidents mortels

*Fatalities*

| Attribut | Valeur |
|---|---|
| Catégorie | Santé-sécurité |
| Unité | nb |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | max 0 |
| Correspondances | GRI 403-9 · IFC NP2 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 0 nb |

- **Définition** : Nombre de décès liés au travail, salariés et sous-traitants.
- **Méthode de calcul** : Nombre d'événements du trimestre.
- **Preuve attendue** : Rapports d'enquête, déclarations aux autorités.
- **Points d'attention** : Seuil 0 : tout décès crée un écart automatique de gravité élevée. À traiter aussi en écart `critical` manuel.

#### S09 · Presque-accidents déclarés

*Near misses reported*

| Attribut | Valeur |
|---|---|
| Catégorie | Santé-sécurité |
| Unité | nb |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 403-9 · IFC NP2 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 64,48 nb |

- **Définition** : Nombre de presque-accidents déclarés.
- **Méthode de calcul** : Nombre de déclarations du trimestre.
- **Preuve attendue** : Registre HSE des presque-accidents.
- **Points d'attention** : Sens « plus = mieux » : un nombre élevé traduit une bonne culture de déclaration.

#### S10 · Heures de formation par salarié

*Training hours per employee*

| Attribut | Valeur |
|---|---|
| Catégorie | Formation |
| Unité | h |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | — |
| Correspondances | GRI 404-1 · IFC NP2 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 9,21 h |

- **Définition** : Nombre moyen d'heures de formation par salarié.
- **Méthode de calcul** : Heures de formation / nombre de salariés.
- **Preuve attendue** : Feuilles de présence, plan de formation, attestations.
- **Points d'attention** : Ratio, consolidation approximative.

#### S11 · Heures de formation santé-sécurité

*Health and safety training hours*

| Attribut | Valeur |
|---|---|
| Catégorie | Formation |
| Unité | h |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 403-5 · IFC NP2 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 11 477 h |

- **Définition** : Total des heures de formation santé-sécurité (inductions, habilitations, exercices).
- **Méthode de calcul** : Somme des heures × participants.
- **Preuve attendue** : Feuilles de présence, registre des habilitations.

#### S12 · Griefs reçus des communautés

*Community grievances received*

| Attribut | Valeur |
|---|---|
| Catégorie | Communautés |
| Unité | nb |
| Sens favorable | – neutre |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 2-25 · IFC NP4 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 26,71 nb |

- **Définition** : Nombre de griefs reçus des communautés riveraines sur le trimestre, tous canaux.
- **Méthode de calcul** : Nombre de griefs enregistrés.
- **Preuve attendue** : Registre des griefs (module Griefs de TRIVALINK), fiches de réception.
- **Points d'attention** : [À FAIRE] calcul automatique depuis la table `grievances` au lieu d'une saisie.

#### S13 · Griefs traités dans les délais

*Grievances resolved on time*

| Attribut | Valeur |
|---|---|
| Catégorie | Communautés |
| Unité | % |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | min 80 |
| Correspondances | GRI 2-25 · IFC NP4 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 90,13 % |

- **Définition** : Part des griefs clos dans le délai fixé par le mécanisme de gestion des plaintes.
- **Méthode de calcul** : Griefs résolus dans le délai / griefs à échéance sur le trimestre × 100.
- **Preuve attendue** : Registre des griefs avec dates de réception et de résolution, procédure du mécanisme.
- **Points d'attention** : Seuil min 80 % : en dessous, écart automatique. Calcul automatique depuis `grievances` à prévoir.

#### S14 · Bénéficiaires des programmes communautaires

*Community programme beneficiaries*

| Attribut | Valeur |
|---|---|
| Catégorie | Communautés |
| Unité | nb |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 413-1 · IFC NP4 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 5 599 nb |

- **Définition** : Nombre de personnes bénéficiaires des programmes communautaires (santé, eau, éducation, moyens de subsistance).
- **Méthode de calcul** : Somme des bénéficiaires distincts du trimestre.
- **Preuve attendue** : Listes de présence, rapports des ONG partenaires, rapports de programme.
- **Points d'attention** : Pas de liste nominative dans TRIVALINK (minimisation des données). Risque de double comptage entre programmes.

#### S15 · Investissement communautaire

*Community investment*

| Attribut | Valeur |
|---|---|
| Catégorie | Communautés |
| Unité | USD |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 201-1 · IFC NP4 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 688 819 USD |

- **Définition** : Montant investi dans les communautés : dons, infrastructures, programmes.
- **Méthode de calcul** : Somme des décaissements du trimestre, en USD.
- **Preuve attendue** : Pièces comptables, conventions de financement, extraits de l'ERP.
- **Points d'attention** : Convertir au taux du jour de paiement ; préciser le taux GNF/USD retenu.

#### S16 · Achats auprès de fournisseurs locaux

*Spending on local suppliers*

| Attribut | Valeur |
|---|---|
| Catégorie | Communautés |
| Unité | % |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | — |
| Correspondances | GRI 204-1 · IFC NP4 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 36,34 % |

- **Définition** : Part des achats réalisés auprès de fournisseurs locaux (définition de « local » à fixer par le client : préfecture, région, pays).
- **Méthode de calcul** : Achats locaux / achats totaux × 100.
- **Preuve attendue** : Extraction ERP des achats par fournisseur et localisation.
- **Points d'attention** : Ratio. La définition de « local » doit être stable et écrite.

#### S17 · Personnes déplacées physiquement ou économiquement

*People physically or economically displaced*

| Attribut | Valeur |
|---|---|
| Catégorie | Communautés |
| Unité | nb |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 14.12 · IFC NP5 |
| Fourni par | les sites |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 0 nb |

- **Définition** : Nombre de personnes déplacées physiquement ou économiquement par le projet sur le trimestre.
- **Méthode de calcul** : Nombre de personnes recensées dans le plan d'action de réinstallation.
- **Preuve attendue** : Plan d'action de réinstallation (PAR), registres de compensation.
- **Points d'attention** : Données sensibles : seuls des comptes sont saisis.

### 6.3 Gouvernance

#### G01 · Politiques ESG approuvées et à jour

*ESG policies approved and current*

| Attribut | Valeur |
|---|---|
| Catégorie | Politiques |
| Unité | nb |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 2-23 · IFC NP1 |
| Fourni par | le groupe et les filiales |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 8,50 nb |

- **Définition** : Nombre de politiques ESG approuvées par la direction et dont la revue n'est pas échue.
- **Méthode de calcul** : Nombre de politiques en vigueur en fin de trimestre.
- **Preuve attendue** : Politiques signées, procès-verbaux d'approbation.
- **Points d'attention** : [À FAIRE] calcul automatique depuis le registre `policies` (date de revue).

#### G02 · Salariés formés à l’anti-corruption

*Employees trained on anti-corruption*

| Attribut | Valeur |
|---|---|
| Catégorie | Éthique |
| Unité | % |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | — |
| Correspondances | GRI 205-2 · IFC NP1 |
| Fourni par | le groupe et les filiales |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 85,39 % |

- **Définition** : Part des salariés ayant suivi une formation anti-corruption.
- **Méthode de calcul** : Salariés formés / salariés × 100.
- **Preuve attendue** : Registre de formation, attestations.
- **Points d'attention** : Ratio.

#### G03 · Cas de corruption avérés

*Confirmed incidents of corruption*

| Attribut | Valeur |
|---|---|
| Catégorie | Éthique |
| Unité | nb |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | max 0 |
| Correspondances | GRI 205-3 · IFC NP1 |
| Fourni par | le groupe et les filiales |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 0 nb |

- **Définition** : Nombre de cas de corruption avérés (établis par enquête interne ou décision).
- **Méthode de calcul** : Nombre de cas du trimestre.
- **Preuve attendue** : Rapports d'enquête, décisions disciplinaires ou judiciaires.
- **Points d'attention** : Seuil 0. Information sensible : description minimale.

#### G04 · Paiements versés à l’État

*Payments to government*

| Attribut | Valeur |
|---|---|
| Catégorie | Transparence |
| Unité | kUSD |
| Sens favorable | – neutre |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 207-4 · IFC NP1 |
| Fourni par | le groupe et les filiales |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 19 014 kUSD |

- **Définition** : Paiements versés à l'État : impôts, redevances minières, taxes, dividendes à l'État.
- **Méthode de calcul** : Somme des paiements du trimestre, en milliers d'USD.
- **Preuve attendue** : Déclarations fiscales, quittances, rapport ITIE.
- **Points d'attention** : Cohérence attendue avec le rapport ITIE Guinée.

#### G05 · Administrateurs indépendants

*Independent board members*

| Attribut | Valeur |
|---|---|
| Catégorie | Gouvernance |
| Unité | % |
| Sens favorable | ↑ à augmenter |
| Consolidation multi-entités | moyenne simple |
| Seuils de départ | — |
| Correspondances | GRI 2-9 · IFC NP1 |
| Fourni par | le groupe et les filiales |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 34,60 % |

- **Définition** : Part des administrateurs indépendants au conseil d'administration.
- **Méthode de calcul** : Administrateurs indépendants / administrateurs × 100.
- **Preuve attendue** : Composition du conseil, rapport de gouvernance.
- **Points d'attention** : Collecté au niveau groupe et filiales.

#### G06 · Alertes éthiques reçues

*Whistleblowing reports received*

| Attribut | Valeur |
|---|---|
| Catégorie | Éthique |
| Unité | nb |
| Sens favorable | – neutre |
| Consolidation multi-entités | somme |
| Seuils de départ | — |
| Correspondances | GRI 2-26 · IFC NP1 |
| Fourni par | le groupe et les filiales |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 4,11 nb |

- **Définition** : Nombre d'alertes reçues par le dispositif d'alerte éthique.
- **Méthode de calcul** : Nombre d'alertes du trimestre.
- **Preuve attendue** : Registre du dispositif d'alerte (anonymisé).
- **Points d'attention** : Sens neutre : une hausse peut traduire une meilleure confiance dans le dispositif.

#### G07 · Sanctions pour non-conformité E&S

*Sanctions for E&S non-compliance*

| Attribut | Valeur |
|---|---|
| Catégorie | Conformité |
| Unité | nb |
| Sens favorable | ↓ à réduire |
| Consolidation multi-entités | somme |
| Seuils de départ | max 0 |
| Correspondances | GRI 2-27 · IFC NP1 |
| Fourni par | le groupe et les filiales |
| Preuve obligatoire | Oui (par défaut, modifiable par le client) |
| Valeur démo groupe T2 2026 | 0 nb |

- **Définition** : Nombre de sanctions (amendes, mises en demeure, suspensions) reçues pour non-respect d'obligations environnementales ou sociales.
- **Méthode de calcul** : Nombre de sanctions du trimestre.
- **Preuve attendue** : Courriers des autorités, décisions administratives.
- **Points d'attention** : Seuil 0. Lier chaque sanction à une obligation et à un écart.


## 7. Correspondances avec les référentiels

### 7.1 Normes de performance IFC

| Norme | Intitulé | Nb | Indicateurs |
|---|---|--:|---|
| NP1 | Évaluation et gestion des risques E&S | 7 | G01, G02, G03, G04, G05, G06, G07 |
| NP2 | Main-d'œuvre et conditions de travail | 11 | S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11 |
| NP3 | Utilisation rationnelle des ressources et prévention de la pollution | 18 | E01, E02, E03, E04, E05, E06, E07, E08, E09, E10, E11, E12, E13, E14, E15, E16, E19, E20 |
| NP4 | Santé, sécurité et sûreté des communautés | 5 | S12, S13, S14, S15, S16 |
| NP5 | Acquisition de terres et réinstallation involontaire | 1 | S17 |
| NP6 | Biodiversité et ressources naturelles vivantes | 2 | E17, E18 |
| NP7 | Peuples autochtones | 0 | **aucun** (lacune) |
| NP8 | Patrimoine culturel | 0 | **aucun** (lacune) |

Lacunes : NP7 et NP8 n'ont aucun indicateur. Les projets miniers guinéens concernés par des peuples autochtones sont rares, mais le patrimoine culturel (sites sacrés, procédure de découverte fortuite) l'est souvent : proposer au moins un indicateur NP8 (« découvertes fortuites déclarées », « sites culturels identifiés et protégés »).

### 7.2 GRI (dont GRI 14 secteur minier)

| Publication GRI | Indicateurs TRIVALINK |
|---|---|
| GRI 2-7 | S01 |
| GRI 2-9 | G05 |
| GRI 2-23 | G01 |
| GRI 2-25 | S12, S13 |
| GRI 2-26 | G06 |
| GRI 2-27 | G07 |
| GRI 201-1 | S15 |
| GRI 202-2 | S02 |
| GRI 204-1 | S16 |
| GRI 205-2 | G02 |
| GRI 205-3 | G03 |
| GRI 207-4 | G04 |
| GRI 302-1 | E01, E02, E03, E04 |
| GRI 303-3 | E08, E09 |
| GRI 303-4 | E10, E11, E12 |
| GRI 305-1 | E05 |
| GRI 305-2 | E06 |
| GRI 305-4 | E07 |
| GRI 305-7 | E19 |
| GRI 306-3 | E13, E14, E20 |
| GRI 306-4 | E15 |
| GRI 403-5 | S11 |
| GRI 403-9 | S04, S05, S06, S07, S08, S09 |
| GRI 404-1 | S10 |
| GRI 405-1 | S03 |
| GRI 413-1 | S14 |
| GRI 14.4 | E17, E18 |
| GRI 14.5 | E16 |
| GRI 14.12 | S17 |

L'index de contenu GRI généré par TRIVALINK (`GET /reports/gri`) regroupe les indicateurs par publication GRI ; une publication sans donnée validée apparaît « Non disponible ».

### 7.3 Référentiels à ajouter [CIBLE]

| Référentiel | Usage | Priorité |
|---|---|---|
| ESAP du prêteur | Chaque client a son plan d'action : correspondance au niveau des obligations (`obligations.reference`) | Déjà couvert par les obligations |
| ITIE | Paiements à l'État (G04) | Phase 2 |
| ISSB IFRS S2 / TCFD | Climat (E05-E07) | Phase 2 |
| SASB Metals & Mining | Investisseurs internationaux | Phase 2 |
| ESRS (CSRD) | Maisons mères européennes | Phase 3 |
| Référentiels nationaux (Code minier, Code de l'environnement) | Conformité locale | Phase 2 |

Modèle cible : table `indicator_mappings (indicator_id, framework, reference, label, version)` à la place des colonnes `gri` et `ifc`.

## 8. Gouvernance du référentiel

### 8.1 Qui décide quoi

| Décision | Qui | Comment |
|---|---|---|
| Ajouter, modifier, retirer un indicateur du catalogue TRIVALINK | Produit TRIVALINK, après avis de l'expert E&S | Nouvelle version de ce document, ligne dans `catalog.js`, migration pour les clients existants |
| Ajuster un seuil, la preuve obligatoire, activer ou désactiver | Client (A, M) | Administration › Indicateurs, tracé dans le journal d'audit |
| Créer un indicateur propre au client | Client (A, M) | [À FAIRE] `POST /api/indicators`, code préfixé `X` |
| Valider une définition ou une méthode | Expert E&S | Revue de ce document, signature dans l'historique |

### 8.2 Ajouter un indicateur au catalogue

1. Rédiger la fiche (§6) : définition, méthode, preuve, points d'attention.
2. Choisir un code nouveau, jamais utilisé.
3. Renseigner les deux langues, l'unité, le sens, l'agrégation (jamais `sum` sur un pourcentage, `max` pour une concentration réglementaire), les correspondances GRI et IFC, le niveau.
4. Ajouter la ligne dans `INDICATORS` (`catalog.js`).
5. Écrire la migration qui l'insère pour chaque client existant (`INSERT … SELECT id FROM organizations … ON CONFLICT DO NOTHING`).
6. Mettre à jour ce document, sa version et l'index (01).
7. Ajouter un cas de test si l'indicateur porte un seuil (08).

### 8.3 Checklist qualité d'un indicateur

- [ ] Définition opérationnelle compréhensible par un responsable de site.
- [ ] Unité explicite.
- [ ] Agrégation cohérente avec la nature de l'indicateur.
- [ ] Sens correct (sinon objectifs et résultats sont faux).
- [ ] Pièce justificative réaliste à obtenir sur un site guinéen.
- [ ] Correspondances au bon format (`GRI 303-4`, `GRI 14.5`, `NP3`).
- [ ] Niveau `site` ou `group` réfléchi.

## 9. Évolutions prévues

| Évolution | Pourquoi | Piste | Phase |
|---|---|---|---|
| Indicateurs calculés | Ratios justes au niveau groupe | Colonne `formula`, calcul après consolidation | Phase 1 |
| Production comme indicateur | Dénominateur des intensités (E07) | Nouvel indicateur « tonnes produites » | Phase 1 |
| Calcul automatique depuis les modules | S12, S13 depuis les griefs ; G01 depuis les politiques | Indicateurs « système » non saisis | Phase 2 |
| Correspondances multiples | ISSB, SASB, ESRS, ITIE | `indicator_mappings` | Phase 2 |
| Fréquences | Énergie mensuelle, gouvernance annuelle | `frequency`, période étendue | Phase 2 |
| Seuils par entité | Permis différents par site | `indicator_thresholds` | Phase 2 |
| Agrégation « pire valeur » | pH (E12) trop bas non détecté par `max` | Agrégation `worst` selon les seuils | Phase 2 |
| Bibliothèque de 120+ indicateurs | Ambition PRD | Catalogue maître versionné, activation par client | Phase 3 |
| Catalogues sectoriels | Banques, PME, institutions | Un catalogue par segment | Phase 3 |

## 10. Points à valider par l'expert E&S

1. Les **définitions** et **méthodes de calcul** des 44 fiches (§6), en particulier les facteurs de conversion et d'émission (E01, E05, E06).
2. Les **seuils de départ** (§3.4) au regard des Directives EHS du Groupe Banque mondiale applicables aux mines et des normes guinéennes.
3. L'ajout d'indicateurs **NP7 / NP8** et d'un indicateur de **production**.
4. La **définition de « local »** pour S02 et S16.
5. La liste des **pièces justificatives** acceptables par indicateur, à confronter aux pratiques des auditeurs des prêteurs.
6. Le traitement des **ratios** en attendant les indicateurs calculés (§5.2).

## 11. Historique

| Version | Date | Changement |
|---|---|---|
| 1.0 | 13/10/2026 | Création : catalogue de `catalog.js`, valeurs de démonstration calculées, fiches rédigées (à valider) |
