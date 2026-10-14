# 02 · Glossaire

Vocabulaire métier, avec sa traduction dans le code. Une IA qui génère du code doit utiliser **les noms de la colonne « Code »** et **les libellés de la colonne « Interface FR »**.

## 1. Objets de la plateforme

| Terme métier | Code (table / valeur) | Interface FR | Interface EN | Définition |
|---|---|---|---|---|
| Organisation / client / tenant | `organizations`, `org_id` | — | — | Un client de TRIVALINK. Frontière d'isolation absolue. |
| Entité | `entities` | Entité | Entity | Nœud de la hiérarchie d'un client. |
| Groupe | `entities.type = 'group'` | Groupe | Group | Racine de la hiérarchie (pas de parent). |
| Filiale | `type = 'subsidiary'` | Filiale | Subsidiary | Entité juridique sous le groupe. |
| Site | `type = 'site'` | Site | Site | Lieu opérationnel (mine, usine, port). Feuille de l'arbre : ne peut pas avoir d'enfant. |
| Périmètre | `users.scope_entity_id`, `req.scope` | Périmètre | Scope | Entité de rattachement d'un utilisateur + tous ses descendants. `NULL` = toute l'organisation. |
| Indicateur / KPI | `indicators` | Indicateur | Indicator | Grandeur mesurée (ex. E11 matières en suspension). Défini par organisation. |
| Domaine E/S/G | `domain IN ('E','S','G')` | Environnement / Social / Gouvernance | Environment / Social / Governance | Pilier ESG de l'indicateur, de l'engagement ou du risque. |
| Niveau de collecte | `indicators.level IN ('site','group')` | — | — | `site` : demandé aux sites ; `group` : demandé aux entités juridiques (groupe, filiale). |
| Sens | `direction IN ('lower','higher','neutral')` | — | — | Ce qui est « mieux » : baisser, monter, ou ni l'un ni l'autre. |
| Agrégation | `aggregation IN ('sum','avg','max')` | — | — | Comment consolider plusieurs entités : somme, moyenne, maximum. |
| Seuil | `threshold_min`, `threshold_max` | Seuil min / max | Min / Max threshold | Bornes réglementaires ou contractuelles. Un dépassement crée un écart. |
| Campagne | `campaigns` | Campagne | Campaign | Demande de collecte pour une période, des entités, des indicateurs, avec échéance. |
| Période | `period` format `AAAA-Qn` | T1 2026 → `2026-Q1` | Q1 2026 | Trimestre. Seule granularité du MVP. |
| Donnée / point de donnée | `datapoints` | Donnée | Data point | Valeur d'un indicateur pour une entité et une période. Unique par (org, indicateur, entité, période). |
| Preuve / pièce justificative | `evidence` | Pièce justificative, preuve | Supporting evidence | Fichier chiffré attaché à une donnée, une action, une obligation ou un incident. |
| Engagement | `commitments` | Engagement | Commitment | Promesse ESG (ex. « Réduire nos émissions de 15 % d'ici 2028 »). |
| Objectif | `objectives` | Objectif | Objective | Cible chiffrée sur un indicateur, une entité et une période, rattachée à un engagement. |
| Risque | `risks` | Risque | Risk | Événement possible noté probabilité × impact (1 à 5 chacun). |
| Obligation | `obligations` | Obligation | Obligation | Exigence applicable : article de l'ESAP, du Code minier, d'un permis… |
| Écart | `incidents` | Écart, incident | Finding, incident | Terme générique couvrant les 4 types ci-dessous. |
| Incident | `incidents.type = 'incident'` | Incident | Incident | Événement HSE ou environnemental. |
| Écart d'audit | `'audit_finding'` | Écart d'audit | Audit finding | Constat d'un auditeur. |
| Non-conformité | `'non_conformity'` | Non-conformité | Non-conformity | Manquement à une obligation. |
| Dépassement de seuil | `'threshold_breach'` | Dépassement de seuil | Threshold breach | Créé **automatiquement** à la soumission d'une valeur hors seuil. |
| Grief | `grievances` | Grief | Grievance | Plainte reçue d'une communauté riveraine (mécanisme de gestion des plaintes, exigé par IFC NP1/NP4). |
| Programme communautaire | `programs` | Programme | Programme | Investissement social : budget, dépensé, bénéficiaires cible / réels. |
| Politique | `policies` | Politique | Policy | Document de gouvernance approuvé, avec date de revue. |
| Action | `actions` | Action | Action | Mesure corrective ou d'amélioration : responsable, échéance, budget, indicateur de résultat. |
| Origine d'une action | `source_type`, `source_id` | Origine | Origin | Ce qui a déclenché l'action : `incident`, `obligation`, `risk`, `objective`. |
| Indicateur de résultat | `result_indicator_id` | Indicateur de résultat | Result indicator | KPI dont l'évolution prouve l'efficacité de l'action. |
| Piste d'audit / journal | `audit_log` | Journal d'audit | Audit trail | Historique immuable et chaîné de toutes les écritures. |
| Empreinte | `sha256`, `fingerprint`, `hash` | Empreinte | Fingerprint | Hachage SHA-256 garantissant l'intégrité (preuve, rapport, ligne d'audit). |

## 2. Rôles

| Code | Interface FR | Interface EN | Résumé |
|---|---|---|---|
| `org_admin` | Administrateur | Administrator | Configure entités, utilisateurs, accès ; a aussi tous les droits du responsable ESG. |
| `esg_manager` | Responsable ESG | ESG manager | Pilote : campagnes, revue et validation, risques, obligations, actions, rapports. |
| `contributor` | Contributeur | Contributor | Saisit données et preuves sur son périmètre ; déclare écarts et griefs. |
| `action_owner` | Responsable d'action | Action owner | Met à jour les actions qui lui sont assignées. |
| `executive` | Direction | Executive | Lecture seule, tableaux de bord et rapports. |
| `auditor` | Auditeur | Auditor | Lecture seule, accès à date d'expiration obligatoire. |

Constantes du code (`core.js`) : `MANAGERS = ['org_admin','esg_manager']`, `READ_ONLY = ['executive','auditor']`.

## 3. Statuts

| Objet | Valeurs (code) | Libellés FR |
|---|---|---|
| Donnée | `requested`, `draft`, `submitted`, `reviewed`, `validated`, `rejected` | Demandée, Brouillon, Soumise, Revue, Validée, Rejetée |
| Campagne | `open`, `closed` | Ouverte, Close |
| Risque | `open`, `mitigated`, `closed` | Ouvert, Atténué, Clos |
| Obligation | `not_started`, `in_progress`, `compliant`, `non_compliant` | Non démarré, En cours, Conforme, Non conforme |
| Écart | `open`, `closed` | Ouvert, Clos |
| Gravité d'un écart | `low`, `medium`, `high`, `critical` | Faible, Moyenne, Élevée, Critique |
| Grief | `received`, `investigating`, `resolved`, `closed` | Reçu, En instruction, Résolu, Clos |
| Programme | `planned`, `active`, `completed` | Planifiée, En cours, Terminée |
| Action | `planned`, `in_progress`, `done`, `cancelled` | Planifiée, En cours, Terminée, Annulée |

## 4. Référentiels et sigles ESG

| Sigle | Signification | Pourquoi c'est important pour TRIVALINK |
|---|---|---|
| **ESG** | Environnement, Social, Gouvernance | Les trois piliers ; colonne `domain`. |
| **RSE** | Responsabilité sociétale des entreprises | Terme français proche d'ESG, utilisé par les clients. |
| **E&S** | Environnemental et social | Vocabulaire des prêteurs (« risque E&S », « rapport E&S »). |
| **IFC** | International Finance Corporation (groupe Banque mondiale) | Ses **Normes de performance** sont la référence des prêteurs miniers. |
| **NP1 à NP8** | Normes de performance IFC | NP1 système de gestion E&S ; NP2 main-d'œuvre ; NP3 ressources et pollution ; NP4 santé-sécurité des communautés ; NP5 acquisition de terres et réinstallation ; NP6 biodiversité ; NP7 peuples autochtones ; NP8 patrimoine culturel. Colonne `indicators.ifc`. |
| **ESAP** | Environmental and Social Action Plan | Plan d'action E&S imposé par le prêteur dans le contrat de financement. Stocké comme `obligations` avec `source = 'ESAP …'`. |
| **SGES / ESMS** | Système de gestion environnementale et sociale | Ce que NP1 exige ; TRIVALINK en est l'outil. |
| **Principes de l'Équateur** | Cadre de gestion du risque E&S des banques | Déclencheur d'achat. |
| **EHS Guidelines** | Directives environnement, santé, sécurité du groupe Banque mondiale | Source des seuils (ex. MES < 50 mg/L, pH 6-9). |
| **GRI** | Global Reporting Initiative | Référentiel de reporting le plus répandu. Colonne `indicators.gri` (ex. `GRI 303-4`). |
| **GRI 14** | Norme sectorielle GRI Mines (2024) | Informations spécifiques au secteur minier (ex. `GRI 14.5` résidus). |
| **ISSB / IFRS S1-S2** | International Sustainability Standards Board | Normes de durabilité financière ; phase 2. |
| **TCFD** | Task Force on Climate-related Financial Disclosures | Risques climatiques ; phase 2 (intégré à l'ISSB). |
| **SASB** | Sustainability Accounting Standards Board | Normes sectorielles ; phase 2. |
| **CSRD / ESRS / VSME** | Directive européenne, ses normes, et le standard volontaire PME | Pertinent pour les exportateurs vers l'UE (segment A.2). |
| **XBRL** | Format de reporting structuré | Phase avancée. |
| **Scope 1 / 2 / 3** | Émissions directes / liées à l'énergie achetée / chaîne de valeur | Indicateurs E05, E06 ; scope 3 hors MVP. |
| **tCO2e** | Tonne équivalent CO2 | Unité des émissions. |
| **LTIFR** | Lost-Time Injury Frequency Rate | Accidents avec arrêt par million d'heures travaillées (indicateur S06). |
| **Taux de gravité** | Jours perdus par millier d'heures | Indicateur S07. |
| **MES / TSS** | Matières en suspension / Total Suspended Solids | Indicateur E11, au cœur du scénario de démo. |
| **PM10** | Particules de diamètre < 10 µm | Indicateur E19 (poussières). |
| **SROI** | Social Return on Investment | Finance & Impact Bridge, phase 2. |
| **OAPI** | Organisation africaine de la propriété intellectuelle | Dépôt de la marque TRIVALINK (classes 9, 35, 42). |
| **CES** | Cadre environnemental et social de la Banque mondiale | Segment institutions publiques. |

## 5. Termes techniques du projet

| Terme | Sens dans TRIVALINK |
|---|---|
| Monolithe modulaire | Un seul processus Node, un module par domaine, frontières nettes entre modules. |
| Quatre yeux (ici trois personnes) | Saisie, revue (niveau 1) et validation (niveau 2) par trois personnes distinctes. |
| Consolidation | Agrégation d'un indicateur sur un sous-arbre d'entités, **données validées uniquement**. |
| Chaîne d'audit | Chaque ligne de `audit_log` contient le hash de la précédente (par organisation) ; `GENESIS` pour la première. |
| File hors ligne | Opérations de saisie stockées dans `localStorage` et rejouées dans l'ordre au retour du réseau. |
| Démo Kalaya | Jeu de données fictif : Kalaya Mining Group (Guinée), 2 filiales, 3 sites ; second client SIL (Côte d'Ivoire) pour prouver l'isolation. |
