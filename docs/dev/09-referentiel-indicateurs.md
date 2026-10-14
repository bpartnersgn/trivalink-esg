# 09 · Référentiel d'indicateurs

Source : `server/src/catalog.js` (constante `INDICATORS`, 44 indicateurs). Le catalogue est **copié dans chaque organisation** à sa création (`installCatalog(q, orgId)`), puis chaque client ajuste ses seuils, l'obligation de preuve et l'activation depuis Administration › Indicateurs (`PATCH /api/indicators/:id`).

Principe produit : **un socle d'indicateurs unique, plusieurs référentiels en sortie** (« saisir une fois, publier selon chaque norme »). Chaque indicateur porte ses correspondances (`gri`, `ifc`) ; les rapports filtrent sur ces colonnes.

## 1. Structure d'un indicateur

`[code, domaine, catégorie, nom FR, nom EN, unité, sens, agrégation, seuil min, seuil max, GRI, IFC, niveau]`

| Champ | Effet dans la plateforme |
|---|---|
| `domain` | Onglet E / S / G du tableau de bord, filtre de campagne |
| `direction` | ↓ `lower` : baisser est mieux ; ↑ `higher` : monter est mieux ; – `neutral` : ni l'un ni l'autre. Sert au calcul « objectif atteint » et « résultat atteint ». |
| `aggregation` | Consolidation multi-entités : `sum` (volumes, effectifs, nombres), `avg` (ratios, %), `max` (concentrations : valeur la plus défavorable) |
| `threshold_min/max` | Dépassement → écart automatique à la soumission (RG-31) |
| `gri` | Section de l'index GRI : `GRI 2-x` (général), `GRI 20x` (économie), `GRI 3xx` (environnement), `GRI 4xx` (social), `GRI 14.x` (mines) |
| `ifc` | Section du rapport IFC : `NP1` à `NP6` |
| `level` | `site` : demandé aux sites ; `group` : demandé au groupe et aux filiales |
| `evidence_required` | 1 par défaut pour tous : pas de soumission sans preuve |

Les seuils de départ sont **indicatifs** (inspirés des Directives EHS du groupe Banque mondiale) : chaque client doit les remplacer par ceux de ses permis, de sa convention minière et de son ESAP.

## 2. Catalogue complet

### Environnement (E)

| Code | Catégorie | Indicateur (FR) | Indicator (EN) | Unité | Sens | Agrég. | Seuil min | Seuil max | GRI | IFC | Niveau |
|---|---|---|---|---|:-:|---|--:|--:|---|---|---|
| E01 | Énergie | Consommation totale d'énergie | Total energy consumption | GJ | ↓ | sum |  |  | GRI 302-1 | NP3 | site |
| E02 | Énergie | Consommation de gazole | Diesel consumption | m³ | ↓ | sum |  |  | GRI 302-1 | NP3 | site |
| E03 | Énergie | Électricité achetée au réseau | Grid electricity purchased | MWh | ↓ | sum |  |  | GRI 302-1 | NP3 | site |
| E04 | Énergie | Part d'énergie renouvelable | Renewable energy share | % | ↑ | avg |  |  | GRI 302-1 | NP3 | site |
| E05 | Émissions | Émissions de GES scope 1 | Scope 1 GHG emissions | tCO2e | ↓ | sum |  |  | GRI 305-1 | NP3 | site |
| E06 | Émissions | Émissions de GES scope 2 | Scope 2 GHG emissions | tCO2e | ↓ | sum |  |  | GRI 305-2 | NP3 | site |
| E07 | Émissions | Intensité GES par tonne produite | GHG intensity per tonne produced | kgCO2e/t | ↓ | avg |  |  | GRI 305-4 | NP3 | site |
| E08 | Eau | Prélèvement total d'eau | Total water withdrawal | m³ | ↓ | sum |  |  | GRI 303-3 | NP3 | site |
| E09 | Eau | Eau recyclée ou réutilisée | Water recycled or reused | % | ↑ | avg |  |  | GRI 303-3 | NP3 | site |
| E10 | Eau | Volume d'eau rejetée | Water discharged | m³ | ↓ | sum |  |  | GRI 303-4 | NP3 | site |
| E11 | Eau | Matières en suspension dans les rejets (max) | Total suspended solids in effluent (max) | mg/L | ↓ | max |  | 50 | GRI 303-4 | NP3 | site |
| E12 | Eau | pH des rejets (valeur la plus défavorable) | Effluent pH (worst value) | pH | – | max | 6 | 9 | GRI 303-4 | NP3 | site |
| E13 | Déchets | Déchets dangereux générés | Hazardous waste generated | t | ↓ | sum |  |  | GRI 306-3 | NP3 | site |
| E14 | Déchets | Déchets non dangereux générés | Non-hazardous waste generated | t | ↓ | sum |  |  | GRI 306-3 | NP3 | site |
| E15 | Déchets | Taux de valorisation des déchets | Waste recovery rate | % | ↑ | avg |  |  | GRI 306-4 | NP3 | site |
| E16 | Mine | Stériles et résidus miniers générés | Waste rock and tailings generated | kt | – | sum |  |  | GRI 14.5 | NP3 | site |
| E17 | Biodiversité | Surface perturbée cumulée | Cumulative land disturbed | ha | ↓ | sum |  |  | GRI 14.4 | NP6 | site |
| E18 | Biodiversité | Surface réhabilitée cumulée | Cumulative land rehabilitated | ha | ↑ | sum |  |  | GRI 14.4 | NP6 | site |
| E19 | Air | Poussières PM10 en limite de site (moyenne) | PM10 dust at site boundary (average) | µg/m³ | ↓ | max |  | 50 | GRI 305-7 | NP3 | site |
| E20 | Pollution | Déversements significatifs | Significant spills | nb | ↓ | sum |  | 0 | GRI 306-3 | NP3 | site |

### Social (S)

| Code | Catégorie | Indicateur (FR) | Indicator (EN) | Unité | Sens | Agrég. | Seuil min | Seuil max | GRI | IFC | Niveau |
|---|---|---|---|---|:-:|---|--:|--:|---|---|---|
| S01 | Effectifs | Effectif total (salariés et sous-traitants) | Total workforce (employees and contractors) | nb | – | sum |  |  | GRI 2-7 | NP2 | site |
| S02 | Effectifs | Part de salariés nationaux | Share of national employees | % | ↑ | avg |  |  | GRI 202-2 | NP2 | site |
| S03 | Effectifs | Part de femmes dans l’effectif | Share of women in workforce | % | ↑ | avg |  |  | GRI 405-1 | NP2 | site |
| S04 | Santé-sécurité | Heures travaillées | Hours worked | h | – | sum |  |  | GRI 403-9 | NP2 | site |
| S05 | Santé-sécurité | Accidents avec arrêt | Lost-time injuries | nb | ↓ | sum |  |  | GRI 403-9 | NP2 | site |
| S06 | Santé-sécurité | Taux de fréquence (LTIFR, par million d’heures) | Lost-time injury frequency rate (per million hours) | taux | ↓ | avg |  | 1.5 | GRI 403-9 | NP2 | site |
| S07 | Santé-sécurité | Taux de gravité (jours perdus par millier d’heures) | Severity rate (days lost per thousand hours) | taux | ↓ | avg |  |  | GRI 403-9 | NP2 | site |
| S08 | Santé-sécurité | Accidents mortels | Fatalities | nb | ↓ | sum |  | 0 | GRI 403-9 | NP2 | site |
| S09 | Santé-sécurité | Presque-accidents déclarés | Near misses reported | nb | ↑ | sum |  |  | GRI 403-9 | NP2 | site |
| S10 | Formation | Heures de formation par salarié | Training hours per employee | h | ↑ | avg |  |  | GRI 404-1 | NP2 | site |
| S11 | Formation | Heures de formation santé-sécurité | Health and safety training hours | h | ↑ | sum |  |  | GRI 403-5 | NP2 | site |
| S12 | Communautés | Griefs reçus des communautés | Community grievances received | nb | – | sum |  |  | GRI 2-25 | NP4 | site |
| S13 | Communautés | Griefs traités dans les délais | Grievances resolved on time | % | ↑ | avg | 80 |  | GRI 2-25 | NP4 | site |
| S14 | Communautés | Bénéficiaires des programmes communautaires | Community programme beneficiaries | nb | ↑ | sum |  |  | GRI 413-1 | NP4 | site |
| S15 | Communautés | Investissement communautaire | Community investment | USD | ↑ | sum |  |  | GRI 201-1 | NP4 | site |
| S16 | Communautés | Achats auprès de fournisseurs locaux | Spending on local suppliers | % | ↑ | avg |  |  | GRI 204-1 | NP4 | site |
| S17 | Communautés | Personnes déplacées physiquement ou économiquement | People physically or economically displaced | nb | ↓ | sum |  |  | GRI 14.12 | NP5 | site |

### Gouvernance (G)

| Code | Catégorie | Indicateur (FR) | Indicator (EN) | Unité | Sens | Agrég. | Seuil min | Seuil max | GRI | IFC | Niveau |
|---|---|---|---|---|:-:|---|--:|--:|---|---|---|
| G01 | Politiques | Politiques ESG approuvées et à jour | ESG policies approved and current | nb | ↑ | sum |  |  | GRI 2-23 | NP1 | group |
| G02 | Éthique | Salariés formés à l’anti-corruption | Employees trained on anti-corruption | % | ↑ | avg |  |  | GRI 205-2 | NP1 | group |
| G03 | Éthique | Cas de corruption avérés | Confirmed incidents of corruption | nb | ↓ | sum |  | 0 | GRI 205-3 | NP1 | group |
| G04 | Transparence | Paiements versés à l’État | Payments to government | kUSD | – | sum |  |  | GRI 207-4 | NP1 | group |
| G05 | Gouvernance | Administrateurs indépendants | Independent board members | % | ↑ | avg |  |  | GRI 2-9 | NP1 | group |
| G06 | Éthique | Alertes éthiques reçues | Whistleblowing reports received | nb | – | sum |  |  | GRI 2-26 | NP1 | group |
| G07 | Conformité | Sanctions pour non-conformité E&S | Sanctions for E&S non-compliance | nb | ↓ | sum |  | 0 | GRI 2-27 | NP1 | group |

## 3. Répartition

| | Nombre | Niveau |
|---|---|---|
| Environnement | 20 (E01-E20) | site |
| Social | 17 (S01-S17) | site |
| Gouvernance | 7 (G01-G07) | groupe |
| **Total** | **44** | Cible MVP de la Product Foundation : 35 à 50 |

Par norme IFC : NP1 = 7 (gouvernance) · NP2 = 11 (main-d'œuvre, santé-sécurité, formation) · NP3 = 18 (ressources, pollution) · NP4 = 5 (communautés) · NP5 = 1 (déplacements) · NP6 = 2 (biodiversité). NP7 (peuples autochtones) et NP8 (patrimoine culturel) n'ont pas encore d'indicateur.

## 4. Démo : valeurs et scénario

`seed.js` génère des valeurs trimestrielles réalistes et fictives pour 3 sites (Boké-Nord, Terminal de Kamsar, Siguiri-Est), T1 et T2 2026 validés, T3 en cours. Points de scénario :
- **T1, Siguiri-Est** : un déversement d'hydrocarbures (E20 = 1, seuil max 0) crée un écart, traité par une action dont le résultat est mesuré au T2.
- **T3, Boké-Nord, E11 (MES)** : 78 mg/L soumis (seuil max 50) avec le commentaire « Fortes pluies fin septembre, bassin B2 saturé » → écart de dépassement ouvert, déjà traité par l'action « Curer le bassin de décantation B2 et ajouter un traitement par floculant » (retour sous 50 mg/L attendu au T4). Point d'entrée de la démo commerciale.
- **T3, état de la campagne** : Boké-Nord a tout soumis ; le Terminal de Kamsar est en revue (E et G revus, S soumis) ; Siguiri-Est n'a saisi que trois brouillons (E01, E02, E05). Le test `boucle complète` part d'une donnée E11 de Siguiri-Est encore `requested` et y saisit 64 mg/L.
- Autres écarts de démo : écart d'audit prêteur « registre des griefs incomplet à Siguiri-Est » (action liée à l'ESAP-3), plainte riveraine pour poussières au Terminal de Kamsar ; action « Faire certifier le SGES » liée à l'obligation ESAP-1.
- Tendance baissière de 2 % par trimestre sur l'énergie et les émissions (E01, E02, E05, E07) pour illustrer l'avancement des objectifs.

## 5. Ajouter ou modifier un indicateur

**Pour tous les nouveaux clients** : ajouter une ligne à `INDICATORS` dans `catalog.js` (code unique, les deux langues, unité, correspondances). Les organisations existantes ne la reçoivent **pas** automatiquement : écrire une migration qui l'insère pour chaque organisation (`INSERT … SELECT id FROM organizations` avec `ON CONFLICT DO NOTHING`).

**Pour un client** : il n'existe pas encore de route de création d'indicateur [À FAIRE] (`POST /api/indicators`, A/M, code préfixé `X` pour les indicateurs propres au client, audit).

Checklist d'un bon indicateur :
- [ ] Code stable, jamais réutilisé (les rapports et imports s'y réfèrent).
- [ ] Nom FR **et** EN, unité explicite (pas « nb » si on peut dire « accidents »).
- [ ] Agrégation cohérente : on ne somme jamais un pourcentage ; on ne moyenne pas une concentration réglementaire (prendre `max`).
- [ ] Sens correct (sinon les objectifs et résultats sont faux).
- [ ] Correspondance GRI au bon format (`GRI 303-4`, `GRI 14.5`) pour tomber dans la bonne section du rapport.
- [ ] Correspondance IFC `NPx`.
- [ ] Niveau `site` ou `group` réfléchi.

## 6. Évolutions du référentiel

| Évolution | Pourquoi | Piste |
|---|---|---|
| **Indicateurs calculés** | LTIFR, taux de gravité, intensité GES doivent être recalculés à partir de leurs composantes au niveau consolidé (la moyenne simple de ratios est fausse) | Colonne `formula` (ex. `S05 * 1e6 / S04`), calcul après consolidation des composantes |
| **Table de correspondances** | ISSB / IFRS S2, TCFD, SASB (Metals & Mining), ESRS, référentiels nationaux, ESAP spécifiques | `indicator_mappings (indicator_id, framework, reference, label, version)` |
| **Fréquence** | Certains KPI sont mensuels (énergie), d'autres annuels (gouvernance) | Colonne `frequency`, format de période étendu |
| **Seuils par entité** | Les permis diffèrent par site | `indicator_thresholds` |
| **Bibliothèque de 120+ KPI** | Ambition PRD | Catalogue maître TRIVALINK versionné, activation par client |
| **Catalogues sectoriels** | Banques (portefeuille E&S), PME (VSME), institutions (cadres de résultats) | Un catalogue par segment, installable à la création du client |
