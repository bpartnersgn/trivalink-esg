# 01 · Vision produit

> Source : `trivalink-product-foundation.md` (v0.1, 12/10/2026), `plan-produit-marque.md`, PRD ORCHEA v1.0. Ce fichier en extrait ce dont un développeur a besoin pour prendre de bonnes décisions sans demander.

## 1. Ce qu'est TRIVALINK

**TRIVALINK** est une marque technologique indépendante à ambition panafricaine. Le produit est une **plateforme numérique de management ESG** : elle permet à une organisation de structurer, suivre et améliorer sa performance environnementale, sociale et de gouvernance grâce à une gestion centralisée des **données, risques, engagements, contrôles et résultats**.

**Ce que TRIVALINK n'est pas : un outil de reporting RSE.** Le rapport est une *sortie* de la plateforme, pas sa raison d'être.

> **Énoncé de valeur** : TRIVALINK permet à une organisation de passer d'un reporting ESG subi à un management ESG piloté : une seule source de vérité pour ses données, ses risques, ses obligations et ses actions, avec la preuve attachée à chaque chiffre.

### La boucle de management

```
objectif → mesure → écart → action → résultat mesuré
```

C'est elle qui distingue TRIVALINK d'un outil de reporting. **Toute fonctionnalité doit renforcer cette boucle ou la preuve qui l'accompagne.** Si une demande ne s'y rattache pas, elle n'est probablement pas prioritaire.

### Les quatre piliers

| Pilier | Ce que l'utilisateur obtient | Traduction technique |
|---|---|---|
| **Structurer** | Enjeux, engagements, objectifs et indicateurs reliés | Tables `commitments`, `objectives`, `indicators` |
| **Prouver** | Chaque donnée a sa source, sa preuve, son validateur, son historique | `evidence`, validation à 2 niveaux, `audit_log` chaîné |
| **Maîtriser** | Risques, obligations, contrôles suivis ; un écart déclenche une action | `risks`, `obligations`, `incidents`, `actions` |
| **Piloter** | Tableaux de bord consolidés, rapports multi-référentiels | `metrics.js`, `reporting.js` |

## 2. Le problème

Les organisations soumises à des exigences ESG doivent répondre à plusieurs référentiels à la fois (GRI, ISSB, IFC, exigences des prêteurs, réglementation nationale), prouver l'impact réel de leurs engagements, relier ESG, risques et finance, garantir la traçabilité et consolider des données dispersées entre groupe, filiales et sites.

Dans la réalité :
- les données vivent dans des dizaines de fichiers Excel, mails et dossiers partagés ;
- le reporting est reconstruit à la main à chaque échéance et mobilise des semaines ;
- risques, obligations et plans d'action sont suivis dans des outils séparés, sans lien avec les indicateurs ;
- les écarts d'audit ne sont reliés ni à une action, ni à un responsable, ni à un résultat mesuré ;
- la consolidation multi-entités est fragile et invérifiable.

**Pourquoi les outils existants ne suffisent pas** : les plateformes ESG internationales sont conçues pour les grandes entreprises cotées européennes ou nord-américaines et couvrent mal les exigences des bailleurs du développement, les engagements communautaires et les conditions africaines (connectivité, langues, prix, accompagnement). Les outils de reporting purs ne pilotent ni risques ni actions. Les tableurs n'offrent ni piste d'audit, ni validation, ni consolidation fiable.

### Le problème dans le segment d'entrée

Une société minière sous financement IFC doit tenir un plan d'action E&S (ESAP), suivre des dizaines d'indicateurs par site, documenter ses engagements communautaires et rendre compte régulièrement à ses prêteurs. Le rapport de suivi est assemblé à la main ; les écarts de l'auditeur vivent dans un autre tableur ; personne n'a de vue consolidée fiable. **Une non-conformité non traitée peut bloquer un décaissement.**

## 3. Segment d'entrée : grandes entreprises, mines et groupes industriels

| Paramètre | Valeur |
|---|---|
| Cible prioritaire | Sociétés minières, groupes industriels et agro-industriels, grands sous-traitants miniers. Guinée d'abord, puis Côte d'Ivoire et Sénégal. |
| Déclencheurs d'achat | Normes de performance IFC, Principes de l'Équateur, exigences des maisons mères, Code minier et conventions minières, plans de développement local, audits E&S. |
| Acheteur | Directeur RSE / Développement durable, Directeur HSE ; sponsor : DG ou DAF. |
| Utilisateurs quotidiens | Responsables HSE de site, responsables relations communautaires, contributeurs de données en filiale ou sur site. |
| Prescripteurs | Prêteurs et bailleurs (IFC, BAD, Proparco), cabinets d'audit E&S, Chambre des mines. |
| Référentiels du MVP | Normes de performance IFC (NP1 à NP8), GRI (dont GRI 14 secteur minier), ESAP des prêteurs. |
| Contraintes terrain | **Sites isolés à connectivité faible**, plusieurs entités (groupe, filiales, sites), **forte exigence de preuve** vis-à-vis des auditeurs. |
| Promesse (à tester) | « Vos engagements ESG, vos risques et vos plans d'action pilotés au même endroit, avec la preuve prête pour vos prêteurs et auditeurs. » |

Segments suivants (documentés dans l'annexe A de la Product Foundation) : banques et institutions financières, PME fournisseurs, institutions publiques et programmes de développement. **L'architecture est conçue pour tous les segments ; le MVP est construit pour un seul.**

Conséquences pour le développeur :
- penser **multi-sites et consolidation** dès qu'on touche une donnée ;
- penser **hors ligne** dès qu'on touche un écran de saisie de site ;
- penser **preuve et traçabilité** dès qu'on touche une écriture ;
- **bilingue FR/EN** partout : les prêteurs et maisons mères lisent en anglais.

## 4. Personas

| Persona | Rôle dans l'app | Objectif | Ce qui le rend heureux |
|---|---|---|---|
| **P1. Directrice RSE / HSE d'un groupe minier** (acheteuse) | `esg_manager` | Tenir les engagements prêteurs sans mobiliser l'équipe des semaines | Rapport prêteur en quelques heures, vue consolidée fiable, zéro surprise en audit |
| **P2. Responsable HSE / relations communautaires de site** | `contributor` | Remonter données et preuves vite, même avec une mauvaise connexion | Une campagne claire, un formulaire unique, un statut visible de ce qui reste à fournir |
| **P3. DAF / DG** (sponsor) | `executive` | Sécuriser les financements, réduire le risque, voir le budget ESG | Tableau de bord synthétique : risques, conformité, actions en retard |
| **P4. Auditeur externe / chargé E&S d'un prêteur** | `auditor` | Vérifier sans redemander dix fois les mêmes pièces | Accès sécurisé à la donnée, son historique et sa preuve |
| Porteur d'action (ex. responsable environnement filiale) | `action_owner` | Faire avancer ses actions correctives | Voir ses actions, mettre à jour l'avancement, joindre des preuves |
| Administrateur client | `org_admin` | Configurer entités, utilisateurs, droits | Ouvrir un accès auditeur en 30 secondes |

Le rôle **Administrateur TRIVALINK** (support et exploitation, aucun accès aux données client sans autorisation) est prévu dans la Product Foundation mais **n'existe pas encore dans le code** [À FAIRE].

## 5. Cas d'usage

### Socles (tous segments)

| # | Cas d'usage | Domaines | État MVP |
|---|---|---|---|
| CU1 | Définir enjeux, engagements, objectifs et indicateurs | Strategy | Engagements + objectifs [MVP] ; matrice de matérialité [À FAIRE] |
| CU2 | Lancer une campagne de collecte avec échéances et relances | E, S, G | Campagnes [MVP] ; relances e-mail [À FAIRE] |
| CU3 | Saisir ou importer une donnée avec preuve, puis la faire valider | E, S, G | [MVP] |
| CU4 | Tenir le registre des risques et des obligations | Risk & Compliance | [MVP] |
| CU5 | Enregistrer un incident, un écart d'audit, une non-conformité | Risk & Compliance | [MVP], dont création automatique sur dépassement de seuil |
| CU6 | Créer un plan d'action : responsable, échéance, budget, indicateur de résultat | Actions | [MVP] |
| CU7 | Suivre l'avancement et mesurer l'effet sur les indicateurs | Actions, Strategy | [MVP] |
| CU8 | Tableau de bord consolidé groupe / filiale / site / période | Reporting | [MVP] |
| CU9 | Générer un rapport selon un référentiel et l'exporter (PDF, Excel) | Reporting | IFC + GRI [MVP] |
| CU10 | Ouvrir un accès auditeur limité en périmètre et en durée | Reporting, Governance | [MVP] |

### Spécifiques au segment

| # | Cas d'usage | État MVP |
|---|---|---|
| CS1 | Suivre l'ESAP du prêteur action par action, avec preuves | [MVP] via `obligations` (source = ESAP) + actions liées |
| CS2 | Produire le rapport de suivi E&S périodique (structure NP IFC) | [MVP] `GET /api/reports/ifc` |
| CS3 | Indicateurs santé-sécurité par site (LTIFR, gravité, presque-accidents) | [MVP] indicateurs S04-S09 |
| CS4 | Engagements communautaires : programmes, bénéficiaires, budget, griefs | [MVP] `programs`, `grievances` |
| CS5 | Eau, énergie, émissions, déchets par site avec seuils et alertes | [MVP] indicateurs E01-E20, seuils |
| CS6 | Consolider plusieurs sites et filiales dans une vue groupe | [MVP] `metrics.js` |

### Scénario de référence bout en bout

C'est le scénario que la démo et le test `boucle complète` rejouent. **Toute évolution doit le laisser fonctionnel.**

1. La responsable RSE configure les sites, les indicateurs et l'ESAP du prêteur (CU1, CS1).
2. Elle lance la campagne trimestrielle ; chaque site reçoit ses demandes (CU2).
3. Le responsable HSE d'un site saisit hors ligne, joint les preuves, synchronise au retour du réseau (CU3, CS3, CS5).
4. Un dépassement de seuil sur la qualité de l'eau crée automatiquement un écart (CU5).
5. Une action corrective est créée, assignée, budgétée, avec un indicateur de résultat (CU6).
6. La responsable RSE valide, consulte la vue consolidée, voit les actions en retard (CU8, CU7).
7. Elle génère le rapport de suivi E&S pour le prêteur et ouvre un accès auditeur (CS2, CU10).

## 6. Principes produit (à appliquer dans chaque PR)

1. **Une donnée n'existe pas sans sa preuve.**
2. **Saisir une fois, publier selon chaque référentiel.** Un indicateur porte ses correspondances (GRI, IFC…), jamais l'inverse.
3. **Tout écart mène à une action ; toute action a un responsable, une échéance et un résultat mesuré.**
4. **Simple pour le contributeur de site, complet pour le responsable ESG.**
5. **Conçu pour les conditions africaines** : connectivité, bilinguisme, accompagnement.

## 7. Périmètre du MVP

| Domaine | Dans le MVP | Plus tard |
|---|---|---|
| Strategy | Engagements et objectifs reliés aux KPI | Double matérialité, scénarios |
| Environment | 20 KPI : énergie, eau, émissions scopes 1-2, déchets, air, biodiversité | Scope 3, IoT |
| Social | 17 KPI : santé-sécurité, effectifs, formation, communautés ; programmes ; griefs | Droits humains approfondis, géolocalisation |
| Governance | Registre des politiques ; 7 KPI | Conflits d'intérêts, contrôle interne complet |
| Risk & Compliance | Registre des risques 5x5, obligations (dont ESAP), incidents, seuils et alertes | Scoring, heatmap avancée, veille réglementaire |
| Reporting | Tableau de bord consolidé, preuves, rapport IFC, index GRI, PDF + Excel, accès auditeur | ISSB, TCFD, SASB, XBRL, IA |
| Actions | Plans d'action, responsable, échéance, budget, statut, indicateur de résultat | Lien ERP, coût réel, ROI |

**Explicitement hors MVP** : connecteurs ERP, IoT, IA, multi-référentiel complet, Finance Bridge avancé, API publique, base dédiée par client (sauf exigence contractuelle d'un pilote).

### Critères de sortie du MVP

- Les 3 pilotes ont produit au moins un rapport réel avec TRIVALINK.
- Un rapport prêteur ou ESG est généré en moins d'une heure une fois les données validées.
- Un auditeur a vérifié des données dans la plateforme sans retraitement externe.
- Au moins un écart a été suivi de bout en bout jusqu'à une action clôturée et son résultat mesuré.
- Au moins 2 pilotes sur 3 passent en abonnement payant.

## 8. Exigences non fonctionnelles

| Exigence | Cible | Source |
|---|---|---|
| Affichage tableau de bord | < 3 s | PRD, CdC |
| Génération d'un rapport complet | < 30 s | PRD, CdC |
| Chargement initial front | < 2 s | CdC |
| Disponibilité | 99,5 % | PRD, CdC |
| Isolation multi-tenant | 100 %, prouvée par des tests | PRD, CdC |
| Volumétrie | 50 000+ entrées / an / client ; 100 000 enregistrements sans dégradation | PRD, CdC |
| Authentification | MFA obligatoire pour les offres Entreprise et Institution | CdC |
| Chiffrement | Au repos (AES-256) et en transit (TLS 1.3) | CdC |
| Accessibilité | WCAG 2.1 | CdC |
| Langues | FR / EN minimum | CdC, DAT |
| Données personnelles | Loi guinéenne sur les données personnelles, RGPD pour les clients concernés ; hébergement local possiblement exigé par les clients publics | Product Foundation |
| Tests | Couverture unitaire > 80 %, tests d'intégration multi-tenant, pentest annuel | CdC |

## 9. Modèle économique (pour comprendre les choix techniques)

- Abonnement SaaS annuel **par organisation**, **pas par utilisateur** : on veut tous les contributeurs de site dans l'outil. Ne jamais introduire de limite au nombre d'utilisateurs sans décision produit.
- Niveaux **Essentiel** (1 entité), **Entreprise** (multi-entités, rapports prêteurs, auditeur), **Institution** (consolidation multi-organisations, base dédiée possible). La plateforme devra donc à terme activer des fonctionnalités par organisation (feature flags par offre) [À FAIRE].
- Les prix indicatifs (3 000 à 50 000+ USD/an) sont des hypothèses à valider.
