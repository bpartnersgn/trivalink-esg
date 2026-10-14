# 10 · Reporting : tableau de bord, rapports, exports

Source : `server/src/modules/reporting.js`, `server/src/metrics.js`. Exemple réel : `docs/exemple-rapport-ifc-2026-T2.pdf`, capture `docs/captures/09-rapport-ifc.png`.

## 1. Principe

**Le tableau de bord et les rapports sont calculés à la volée à partir des mêmes données**, par la même fonction `buildDashboard()`. Il n'y a pas de table de rapports : un rapport est reproductible tant que les données validées ne changent pas (et elles ne changent pas, RG-28). Son **empreinte SHA-256** permet de prouver qu'un PDF diffusé n'a pas été modifié.

```mermaid
flowchart LR
  DP[(datapoints<br/>validated)] --> C[consolidated()<br/>metrics.js]
  E[(entities)] --> CS[consolidationSet()]
  CS --> C
  C --> D[buildDashboard()]
  I[(incidents · actions · obligations<br/>risks · grievances · programs · objectives)] --> D
  D --> API1[GET /api/dashboard]
  D --> R[buildReport(type)]
  R --> J[JSON]
  R --> P[renderPdf → PDF A4 paysage]
  R --> X[renderXlsx → classeur]
  R --> F[fingerprint SHA-256]
```

## 2. Consolidation

1. **Ensemble d'entités** (`consolidationSet`) : la racine demandée (`entity_id`) ou, à défaut, l'entité la plus haute du périmètre de l'utilisateur ; puis tout son sous-arbre, **intersecté avec le périmètre** de l'utilisateur. Une racine hors périmètre → ensemble vide → 404.
2. **Valeur** (`consolidated`) : pour un indicateur et une période, toutes les valeurs **validées** non nulles des entités de l'ensemble, agrégées selon `aggregation` (`sum`, `avg`, `max`). Aucune valeur → `null`.
3. **Période précédente** : `previousPeriod('2026-Q1') = '2025-Q4'`, pour la colonne de comparaison.
4. **Dernière valeur validée** (`latestValidated`) : utilisée par les objectifs et les actions ; option `fromPeriod` pour ne retenir que les mesures postérieures au lancement d'une action.

⚠️ Une entité de niveau `group` (ex. le groupe pour les indicateurs G) et des sites sont dans le même ensemble : c'est correct tant que chaque indicateur n'est collecté qu'à un seul niveau (`level`). Ne pas collecter le même indicateur à deux niveaux, sinon il serait compté deux fois.

## 3. Tableau de bord (`GET /api/dashboard`)

| Bloc | Calcul |
|---|---|
| `period`, `previous_period` | Période demandée ou par défaut (RG-65) |
| `entity`, `entity_count` | Racine et nombre d'entités consolidées |
| `kpis[]` | Pour chaque indicateur actif : `value` (validée consolidée), `previous`, `validated` (nb de données validées), `expected` (nb de données de la période dans l'ensemble), `pending` (soumises + revues), `evidenced` (validées avec preuve), `breach` (au moins une donnée soumise/revue/validée hors seuil) |
| `completion` | `total`, `validated`, `in_validation`, `todo` (demandées + brouillons + rejetées), `rejected`, `evidence_rate` (%) |
| `objectives[]` | Objectifs des entités de l'ensemble, avec `current_value`, `progress`, `met` |
| `incidents` | `open`, `closed`, `open_list` (récents d'abord), `all` |
| `actions` | `total`, `open`, `done`, `overdue`, `budget`, `spent`, `overdue_list`, `all` (enrichies) |
| `obligations` | Compteurs par statut + `all` |
| `risks` | `total`, `high` (score ≥ 15 non clos), `matrix[impact-1][likelihood-1]` (risques non clos), `all` |
| `grievances` | `total`, `open` (reçus + en instruction), `resolved`, `by_category[]` |
| `programs[]` | Programmes de l'ensemble |

Performance : la fonction fait une requête de consolidation par indicateur et par période (≈ 2 × 44) et enrichit chaque action. Suffisant pour le MVP (cible < 3 s). [À FAIRE] au-delà de quelques milliers de données par période : une requête groupée par indicateur, ou une vue matérialisée par (org, période, entité, indicateur).

## 4. Rapport de suivi E&S, structure IFC (`type=ifc`)

Titre : « Rapport de suivi environnemental et social (Normes de performance IFC) ».

| # | Section | Contenu |
|---|---|---|
| 1 | Synthèse | Périmètre, période ; données attendues / validées / en validation / à fournir ; taux de preuve ; écarts ouverts ; actions (terminées, en retard) ; obligations conformes / non conformes ; rappel « seules les données validées par trois personnes distinctes sont consolidées » |
| 2 | NP1 · Système de gestion E&S et ESAP | Tableau des obligations (source, réf., titre, entité, échéance, statut, actions terminées / total) + top 10 des risques (score, statut, mesure) |
| 3 | NP2 · Main-d'œuvre et conditions de travail | KPI dont `ifc` commence par `NP2` |
| 4 | NP3 · Ressources et prévention de la pollution | KPI `NP3` |
| 5 | NP4 / NP5 · Communautés, griefs et programmes | KPI `NP4` + `NP5`, tableau des programmes (budget, dépensé, bénéficiaires réels / cible), phrase de synthèse des griefs par catégorie |
| 6 | Écarts et actions correctives | Tableau des écarts (type, entité, date, statut, actions liées) + plan d'actions (responsable, échéance, statut et %, budget / dépensé, résultat mesuré « E11 : 64 -> 42 (cible 50 mg/L) atteint ») |

Colonnes d'un tableau de KPI (`kpiTable`) : Réf. IFC · Code · Indicateur · Unité · Valeur · Période préc. · Seuil · Validées / preuves (`validated/expected · evidenced`) · Statut (`Hors seuil` en rouge, `En validation`, `Non disponible`, `Conforme`).

NP6 (biodiversité : E17, E18) n'a pas encore de section dédiée [À FAIRE] ; NP7 et NP8 n'ont pas d'indicateur.

## 5. Index de contenu GRI (`type=gri`)

Titre : « Index de contenu GRI ». Sections générées seulement si elles contiennent des KPI :

| Section | Filtre sur `indicators.gri` |
|---|---|
| GRI 2 · Informations générales | commence par `GRI 2-` |
| GRI 200 · Économie | `^GRI 20\d` |
| GRI 300 · Environnement | `^GRI 3\d\d` |
| GRI 400 · Social | `^GRI 4\d\d` |
| GRI 14 · Secteur minier | commence par `GRI 14` |

Puis la section « Écarts et actions correctives ». [À FAIRE] pour un vrai index GRI conforme : déclaration d'usage (« in accordance with » / « with reference to »), colonnes « Emplacement » et « Omission / raison », renvoi aux exigences de GRI 1 et à la liste des thèmes matériels (GRI 3).

## 6. Formats d'export

| Format | Rendu | Détails |
|---|---|---|
| `json` | Objet `report` | `{ type, title, organization, entity, period, generated_at, generated_by, sections[{ title, paragraphs[], tables[{ caption?, columns[{key,label,width,align?}], rows[] }] }], fingerprint }` |
| `pdf` | pdfkit, **A4 paysage**, Helvetica | En-tête TRIVALINK + titre + organisation · entité · période + date UTC et auteur ; tableaux à largeurs proportionnelles, en-têtes répétés au saut de page, lignes alternées, valeurs hors seuil en rouge ; pied de chaque page : empreinte + pagination |
| `xlsx` | exceljs | Feuille « Rapport » (métadonnées et empreinte) + une feuille par section (nom ≤ 31 caractères, caractères interdits retirés) |

Noms de fichiers : `trivalink-<type>-<période>.pdf|xlsx`.

## 7. Empreinte du rapport

```js
report.fingerprint = sha256(JSON.stringify({ ...report, generated_at: undefined }))
```

- Deux générations des mêmes données donnent **la même empreinte** (la date de génération est exclue) : un auditeur peut regénérer et comparer.
- L'empreinte est journalisée (`generate_report`) : on sait qui a produit quel rapport, quand, dans quel format.
- [CIBLE] **Signature numérique** des rapports (CdC « Signature numérique rapports ») : signature PAdES du PDF avec un certificat de l'organisation, ou signature détachée de l'empreinte ; page publique de vérification d'empreinte.

## 8. Ajouter un nouveau type de rapport

1. Ajouter une branche `else if (type === 'xxx')` dans `buildReport()` qui pousse des `sections` en réutilisant `kpiTable(kpis, refKey)` et les blocs de `buildDashboard`.
2. Si le rapport s'appuie sur une nouvelle correspondance de norme, ajouter d'abord la correspondance aux indicateurs (colonne ou table `indicator_mappings`, voir 09).
3. Ajouter le libellé du rapport et sa traduction dans `Reports.jsx` et `i18n.js`.
4. Ajouter un test JSON + PDF + XLSX (modèle : test `rapports IFC et GRI`).
5. Vérifier le rendu PDF à l'œil (largeurs de colonnes, coupures de page) : les rapports sont la vitrine de la marque.

Rapports demandés par les documents produit, par priorité : **rapport de conformité bailleur générique** (ESAP seul), **rapport consolidé multi-entités annuel**, **rapport de programme RSE** (bénéficiaires, budget), **ISSB / IFRS S2 climat**, **TCFD**, **SASB Metals & Mining**, **dossier d'audit exportable** (ZIP : rapport + preuves + extrait du journal + vérification de chaîne).

## 9. Objectif de performance

CdC / PRD : **rapport complet < 30 s**, tableau de bord < 3 s. À mesurer sur un jeu de 100 000 données (critère d'acceptation CdC). [À FAIRE] test de charge : script de génération de données volumineuses + chronométrage de `/dashboard` et `/reports/ifc?format=pdf`. Si la cible est dépassée : génération asynchrone en tâche de fond avec notification.
