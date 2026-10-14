# 02 · PRD · TRIVALINK ESG

**Product Requirements Document**

| | |
|---|---|
| **Produit** | TRIVALINK ESG, *ESG Management Platform* |
| **Version** | 1.0 · 13 octobre 2026 |
| **Statut** | À valider par le porteur du projet ; le périmètre MVP sera arrêté après les entretiens de découverte |
| **Sources** | Product Foundation TRIVALINK v0.1 · Plan produit et marque · PRD, DAT, CdC ORCHEA v1.0 (ancien nom) · Code du MVP `trivalink/app/` |
| **Remplace** | PRD ORCHEA v1.0 (vision conservée, périmètre resserré, domaines Strategy et Actions ajoutés) |

---

## 1. Résumé exécutif

TRIVALINK est une plateforme SaaS de **management ESG** destinée aux organisations soumises à des exigences environnementales, sociales et de gouvernance, en premier lieu les **sociétés minières et groupes industriels d'Afrique de l'Ouest** financés par des prêteurs internationaux.

Elle relie dans un même système **stratégie, données, risques, conformité, actions correctives et mesure de la performance**, avec la **preuve attachée à chaque chiffre**. Elle produit les rapports exigés par les prêteurs (Normes de performance IFC) et les référentiels de marché (GRI), mais sa valeur est en amont : faire en sorte que chaque écart soit traité et que chaque chiffre publié soit vérifiable.

Un **MVP fonctionnel existe** (7 domaines, 44 indicateurs, rapports IFC et GRI, validation à deux niveaux, journal d'audit chaîné, saisie hors ligne). La prochaine étape est le **durcissement pour la production** puis le déploiement chez **3 clients pilotes payants**.

---

## 2. Contexte et problème

### 2.1 Constat

Les organisations soumises à des exigences ESG doivent :
- répondre à plusieurs référentiels à la fois (GRI, ISSB, IFC, exigences des prêteurs, réglementation nationale) ;
- prouver l'impact réel de leurs engagements et programmes, pas seulement les déclarer ;
- relier ESG, risques et performance financière ;
- garantir la traçabilité et l'auditabilité de chaque donnée ;
- consolider des données dispersées entre groupe, filiales et sites.

Dans la réalité :
- les données vivent dans des dizaines de fichiers Excel, mails et dossiers partagés ;
- le reporting est manuel, reconstruit à chaque échéance, et mobilise des semaines ;
- risques, obligations et plans d'action sont suivis dans des outils séparés, sans lien avec les indicateurs ;
- les écarts d'audit ne sont reliés ni à une action, ni à un responsable, ni à un résultat mesuré ;
- la consolidation multi-entités est fragile et invérifiable.

### 2.2 Le problème dans le segment d'entrée

Une société minière sous financement IFC doit tenir un plan d'action E&S (ESAP), suivre des dizaines d'indicateurs environnementaux et sociaux par site, documenter ses engagements communautaires et rendre compte régulièrement à ses prêteurs. Le rapport de suivi est assemblé à la main à partir de fichiers de sites différents ; les écarts relevés par l'auditeur sont suivis dans un autre tableur ; personne n'a de vue consolidée fiable entre les sites et le siège. **Une non-conformité non traitée peut bloquer un décaissement.**

### 2.3 Pourquoi les solutions existantes ne suffisent pas

| Solution | Limite |
|---|---|
| Plateformes ESG internationales | Conçues pour les sociétés cotées européennes et nord-américaines ; couvrent mal les exigences des bailleurs du développement, les engagements communautaires, les conditions africaines (connectivité, langues, prix, accompagnement) |
| Outils de reporting purs | Produisent un document mais ne pilotent ni risques ni actions ; le rapport suivant repart de zéro |
| Tableurs | Ni piste d'audit, ni validation, ni consolidation fiable |

---

## 3. Vision, positionnement et objectifs

### 3.1 Vision

Devenir **la solution de référence du management ESG en Afrique**, avec une capacité d'expansion internationale. À terme : entreprises, groupes industriels, banques, institutions publiques, programmes de développement.

### 3.2 Énoncé de valeur

> TRIVALINK permet à une organisation de passer d'un reporting ESG subi à un management ESG piloté : une seule source de vérité pour ses données, ses risques, ses obligations et ses actions, avec la preuve attachée à chaque chiffre.

### 3.3 Les quatre piliers

| Pilier | Ce que l'utilisateur obtient |
|---|---|
| **Structurer** | Une stratégie ESG formalisée : enjeux, engagements, objectifs et indicateurs reliés |
| **Prouver** | Chaque donnée a sa source, sa pièce justificative, son validateur et son historique |
| **Maîtriser** | Risques, obligations et contrôles suivis en continu ; un écart déclenche une action avec responsable et échéance |
| **Piloter** | Tableaux de bord consolidés groupe / filiale / site, rapports multi-référentiels issus des mêmes données |

### 3.4 Différenciation

1. **Management, pas seulement reporting** : la boucle risque → contrôle → écart → action → résultat est native.
2. **Conçu pour les exigences des bailleurs et prêteurs** (IFC, BAD, Banque mondiale).
3. **Ancré dans le terrain africain** : multi-sites, saisie hors ligne, bilingue FR/EN, accompagnement local.
4. **Auditable par conception** : journal immuable et chaîné, preuves chiffrées avec empreinte, rapports avec empreinte.
5. **Saisir une fois, publier selon chaque référentiel.**

### 3.5 Objectifs produit et indicateurs de succès

| Objectif | Indicateur | Cible | Source |
|---|---|---|---|
| Réduire l'effort de reporting | Temps de production d'un rapport prêteur, données validées | < 1 h (÷ 5 au moins) | PRD, Foundation |
| Rendre les chiffres vérifiables | Indicateurs publiés avec preuve et validateur | 100 % | Foundation |
| Traiter les écarts | Écarts d'audit reliés à une action suivie jusqu'à clôture | 100 % | Foundation |
| Satisfaire l'auditeur | Données vérifiées sans retraitement externe | Oui, chez chaque pilote | PRD |
| Adoption | Clients payants | 3 pilotes puis ≥ 10 en année 1 | PRD, Plan |
| Conversion des pilotes | Pilotes passés en abonnement | ≥ 2 sur 3 | Foundation |
| Performance | Tableau de bord / rapport | < 3 s / < 30 s | PRD, CdC |
| Fiabilité | Disponibilité | ≥ 99,5 % | PRD, CdC |
| Sécurité | Fuites entre clients | 0 | PRD, CdC |

---

## 4. Segment d'entrée et marché

| Paramètre | Valeur |
|---|---|
| **Cible prioritaire** | Sociétés minières, groupes industriels et agro-industriels, grands sous-traitants miniers. Guinée, puis Côte d'Ivoire et Sénégal. |
| **Déclencheurs d'achat** | Normes de performance IFC, Principes de l'Équateur, exigences des maisons mères et actionnaires, Code minier et conventions minières, plans de développement local, audits E&S |
| **Acheteur** | Directeur RSE / Développement durable, Directeur HSE ; sponsor : DG ou DAF |
| **Utilisateurs quotidiens** | Responsables HSE de site, responsables relations communautaires, contributeurs de filiale ou de site |
| **Prescripteurs** | Prêteurs et bailleurs (IFC, BAD, Proparco), cabinets d'audit E&S, Chambre des mines |
| **Référentiels MVP** | Normes de performance IFC, GRI (dont GRI 14), ESAP des prêteurs |
| **Contraintes terrain** | Sites isolés à faible connectivité ; multi-entités ; forte exigence de preuve |
| **Taille de marché** | À chiffrer : sociétés minières et industrielles actives en Guinée et sous-traitants de rang 1 |

**Segments suivants**, dans l'ordre : banques et institutions financières (gestion du risque E&S de portefeuille), PME fournisseurs des grands comptes, institutions publiques et programmes de développement. L'architecture est multisegment ; le MVP est construit pour un seul segment.

---

## 5. Personas

### P1 · Directrice RSE / HSE d'un groupe minier (acheteuse, utilisatrice principale)
- **Objectif** : tenir les engagements pris auprès des prêteurs et de la maison mère sans mobiliser son équipe des semaines avant chaque échéance.
- **Douleurs** : données de sites hétérogènes, rapports reconstruits à la main, écarts d'audit dans un tableur, pression des prêteurs.
- **Succès** : rapport prêteur en quelques heures, vue consolidée fiable, zéro surprise en audit.
- **Rôle** : `esg_manager`.

### P2 · Responsable HSE ou relations communautaires de site (contributeur)
- **Objectif** : remonter ses données et ses preuves vite, depuis le site, même avec une mauvaise connexion.
- **Douleurs** : demandes répétées et non coordonnées, formats différents à chaque fois.
- **Succès** : une campagne claire, un formulaire unique, un statut visible de ce qui reste à fournir.
- **Rôle** : `contributor`.

### P3 · Directeur financier / Directeur général (sponsor)
- **Objectif** : sécuriser les financements, réduire le risque de non-conformité, voir où va le budget ESG.
- **Succès** : un tableau de bord synthétique des risques, de la conformité et des actions en retard.
- **Rôle** : `executive`.

### P4 · Auditeur externe ou chargé E&S d'un prêteur (utilisateur externe)
- **Objectif** : vérifier sans demander dix fois les mêmes pièces.
- **Succès** : accès sécurisé à la donnée, à son historique et à sa preuve.
- **Rôle** : `auditor`.

### Rôles complémentaires
- **Administrateur organisation** (`org_admin`) : entités, utilisateurs, droits.
- **Responsable d'action** (`action_owner`) : met à jour les actions qui lui sont assignées.
- **Administrateur TRIVALINK** : support et exploitation, sans accès aux données client sauf autorisation tracée [À FAIRE].

---

## 6. Périmètre

### 6.1 Architecture fonctionnelle : sept domaines

| Domaine | Rôle | Objets |
|---|---|---|
| 01 Strategy | Fixer le cap | Enjeux, engagements, objectifs, indicateurs clés |
| 02 Environment | Mesurer la performance environnementale | Énergie, eau, émissions, déchets, air, biodiversité |
| 03 Social | Mesurer la performance sociale | Santé-sécurité, effectifs, formation, communautés, programmes, griefs |
| 04 Governance | Encadrer l'organisation | Politiques, éthique, anti-corruption, transparence |
| 05 Risk & Compliance | Maîtriser risques et obligations | Risques, obligations (ESAP), incidents, non-conformités, seuils, alertes |
| 06 Reporting | Restituer et prouver | Tableaux de bord, bibliothèque de preuves, rapports, exports, accès auditeur |
| 07 Actions | Corriger et améliorer | Plans d'action, responsables, échéances, budgets, résultats mesurés |

**Socle transverse** : multi-entités groupe → filiale → site ; isolation entre clients ; workflow de collecte et validation ; gestion des preuves ; piste d'audit ; rôles et droits ; FR/EN ; hors ligne ; imports Excel/CSV.

### 6.2 Dans le MVP

| Domaine | Contenu |
|---|---|
| Strategy | Engagements et objectifs chiffrés reliés aux indicateurs, avancement calculé |
| Environment | 20 indicateurs par site |
| Social | 17 indicateurs ; programmes communautaires ; registre des griefs |
| Governance | Registre des politiques ; 7 indicateurs de niveau groupe |
| Risk & Compliance | Registre des risques (matrice 5×5), obligations dont ESAP, écarts de 4 types, seuils et écarts automatiques |
| Reporting | Tableau de bord consolidé, bibliothèque de preuves, rapport de suivi E&S type IFC, index GRI, exports PDF et Excel avec empreinte, journal d'audit vérifiable |
| Actions | Plans d'action reliés à leur origine, responsable, échéance, budget, avancement, indicateur de résultat |

Total : **44 indicateurs** (cible de la Foundation : 35 à 50).

### 6.3 Hors MVP (explicitement)

Connecteurs ERP et IoT, IA prédictive, multi-référentiel complet (ISSB, TCFD, SASB), Finance Bridge avancé (SROI, coût carbone interne), API publique, XBRL, matrice de double matérialité, base dédiée par client (sauf exigence contractuelle d'un pilote).

---

## 7. Cas d'usage

### 7.1 Socles

| # | Cas d'usage | Domaines | MVP |
|---|---|---|---|
| CU1 | Définir enjeux, engagements, objectifs et indicateurs | Strategy | Partiel (sans matérialité) |
| CU2 | Lancer une campagne de collecte avec échéances et relances | E, S, G | Oui, sans relances automatiques |
| CU3 | Saisir ou importer une donnée avec sa preuve, puis la faire valider | E, S, G | Oui |
| CU4 | Tenir le registre des risques et des obligations | Risk & Compliance | Oui |
| CU5 | Enregistrer un incident, un écart d'audit, une non-conformité | Risk & Compliance | Oui |
| CU6 | Créer un plan d'action : responsable, échéance, budget, indicateur de résultat | Actions | Oui |
| CU7 | Suivre l'avancement des actions et mesurer leur effet | Actions, Strategy | Oui |
| CU8 | Consulter un tableau de bord consolidé groupe / filiale / site / période | Reporting | Oui |
| CU9 | Générer un rapport selon un référentiel, l'exporter | Reporting | IFC et GRI |
| CU10 | Ouvrir un accès auditeur limité en périmètre et en durée | Reporting, Governance | Oui |

### 7.2 Spécifiques au segment

| # | Cas d'usage | MVP |
|---|---|---|
| CS1 | Suivre l'ESAP du prêteur action par action, avec preuves | Oui |
| CS2 | Produire le rapport de suivi E&S périodique (structure IFC) | Oui |
| CS3 | Suivre la santé-sécurité par site (LTIFR, gravité, presque-accidents) | Oui |
| CS4 | Suivre les engagements communautaires : programmes, bénéficiaires, budget, griefs | Oui |
| CS5 | Suivre eau, énergie, émissions, déchets par site avec seuils et alertes | Oui |
| CS6 | Consolider plusieurs sites et filiales dans une vue groupe | Oui |

### 7.3 Scénario de référence

1. La responsable RSE configure les sites, les indicateurs et l'ESAP du prêteur.
2. Elle lance la campagne trimestrielle ; chaque site reçoit ses demandes.
3. Le responsable HSE d'un site saisit hors ligne, joint ses preuves, synchronise au retour du réseau.
4. Un dépassement de seuil sur la qualité de l'eau crée une alerte et un écart.
5. Une action corrective est créée, assignée, budgétée, avec un indicateur de résultat.
6. La responsable RSE valide, consulte la vue consolidée, voit les actions en retard.
7. Elle génère le rapport de suivi E&S pour le prêteur et ouvre un accès auditeur.

---

## 8. Exigences fonctionnelles

Priorité : **M** = obligatoire MVP (Must), **S** = souhaitable pilotes (Should), **C** = plus tard (Could). État : ✅ implémenté dans le MVP · 🟡 partiel · ❌ absent.

### 8.1 Socle (SOC)

| ID | Exigence | Prio | État |
|---|---|---|---|
| EF-SOC-01 | Isolation stricte des données entre clients ; aucune donnée d'un client accessible à un autre | M | ✅ |
| EF-SOC-02 | Hiérarchie d'entités groupe → filiale → site ; un site n'a pas d'enfant | M | ✅ |
| EF-SOC-03 | Six rôles et un périmètre d'entité par utilisateur | M | ✅ |
| EF-SOC-04 | Journal d'audit immuable de toutes les écritures, horodaté UTC, vérifiable | M | ✅ |
| EF-SOC-05 | Interface bilingue FR/EN, langue mémorisée par utilisateur | M | ✅ |
| EF-SOC-06 | Saisie des données de site tolérante aux coupures, avec synchronisation | M | ✅ (sans cache de lecture) |
| EF-SOC-07 | Preuves chiffrées au repos, empreinte SHA-256, aucune suppression | M | ✅ |
| EF-SOC-08 | Accès auditeur à durée limitée et à périmètre défini | M | ✅ |
| EF-SOC-09 | Authentification forte (MFA) pour les offres Entreprise et Institution | M (prod) | ❌ |
| EF-SOC-10 | Invitation des utilisateurs et réinitialisation de mot de passe par e-mail | M (prod) | ❌ |
| EF-SOC-11 | Console d'administration TRIVALINK (provisionnement, offres) | S | ❌ |
| EF-SOC-12 | Thème visuel par client | C | ❌ |
| EF-SOC-13 | SSO OIDC / SAML | C | ❌ |

### 8.2 Strategy (STR)

| ID | Exigence | Prio | État |
|---|---|---|---|
| EF-STR-01 | Créer des engagements par domaine E/S/G, avec source et responsable | M | ✅ |
| EF-STR-02 | Décliner un engagement en objectifs chiffrés : indicateur, entité, valeur de départ, cible, période cible | M | ✅ |
| EF-STR-03 | Calculer l'avancement et l'atteinte de chaque objectif à partir des données validées | M | ✅ |
| EF-STR-04 | Matrice de double matérialité reliée aux engagements | C | ❌ |

### 8.3 Collecte E/S/G (COL)

| ID | Exigence | Prio | État |
|---|---|---|---|
| EF-COL-01 | Référentiel d'indicateurs avec correspondances GRI et IFC, seuils, unité, sens, agrégation | M | ✅ |
| EF-COL-02 | Lancer une campagne : période, échéance, entités, domaines ou indicateurs ; indicateurs de site aux sites, de groupe aux entités juridiques | M | ✅ |
| EF-COL-03 | Saisir une valeur et un commentaire ; importer un fichier CSV ou Excel avec rapport d'erreurs ligne par ligne | M | ✅ |
| EF-COL-04 | Preuve obligatoire à la soumission | M | ✅ |
| EF-COL-05 | Validation à deux niveaux par trois personnes distinctes ; rejet motivé | M | ✅ |
| EF-COL-06 | Historique et versions de chaque donnée | M | ✅ |
| EF-COL-07 | Suivi d'avancement d'une campagne (à fournir, en validation, validées) | M | ✅ |
| EF-COL-08 | Relances automatiques avant échéance et notification de rejet | S | ❌ |
| EF-COL-09 | Correction motivée d'une donnée validée avec nouvelle validation | S | ❌ |
| EF-COL-10 | Indicateurs calculés (LTIFR, taux de gravité, intensités) | S | ❌ |
| EF-COL-11 | Seuils par entité | S | ❌ |
| EF-COL-12 | Fréquences mensuelle et annuelle | C | ❌ |
| EF-COL-13 | Création d'indicateurs propres au client | S | ❌ |

### 8.4 Risk & Compliance (RSK)

| ID | Exigence | Prio | État |
|---|---|---|---|
| EF-RSK-01 | Registre des risques : probabilité et impact 1-5, score, mesure, responsable, statut | M | ✅ |
| EF-RSK-02 | Matrice des risques 5×5 | M | ✅ |
| EF-RSK-03 | Registre des obligations (ESAP, Code minier, permis) avec échéance et statut | M | ✅ |
| EF-RSK-04 | Écart créé automatiquement quand une valeur soumise sort d'un seuil | M | ✅ |
| EF-RSK-05 | Déclaration d'incidents, écarts d'audit, non-conformités avec gravité | M | ✅ |
| EF-RSK-06 | Un écart ne se clôt qu'avec au moins une action, toutes terminées ou annulées | M | ✅ |
| EF-RSK-07 | Une obligation ne se déclare conforme qu'avec une preuve | M | ✅ |
| EF-RSK-08 | Registre des griefs communautaires avec résolution obligatoire | M | ✅ |
| EF-RSK-09 | Programmes communautaires : budget, dépensé, bénéficiaires cible et réels | M | ✅ |
| EF-RSK-10 | Registre des politiques avec date de revue | M | ✅ |
| EF-RSK-11 | Alertes sur obligations échues | S | ❌ |
| EF-RSK-12 | Contrôles internes et veille réglementaire | C | ❌ |

### 8.5 Actions (ACT)

| ID | Exigence | Prio | État |
|---|---|---|---|
| EF-ACT-01 | Créer une action reliée à son origine (écart, obligation, risque, objectif) | M | ✅ |
| EF-ACT-02 | Responsable, échéance, budget, dépensé, avancement, statut ; retard calculé | M | ✅ |
| EF-ACT-03 | Indicateur de résultat avec valeur de départ (automatique) et cible | M | ✅ |
| EF-ACT-04 | Clôture conditionnée à une mesure validée postérieure au lancement ; résultat figé | M | ✅ |
| EF-ACT-05 | Preuves jointes à une action | M | ✅ |
| EF-ACT-06 | Notifications d'assignation, d'échéance et de retard | S | ❌ |
| EF-ACT-07 | Budget ESG, dépenses réelles ERP, SROI, coût carbone interne | C | ❌ |

### 8.6 Reporting (REP)

| ID | Exigence | Prio | État |
|---|---|---|---|
| EF-REP-01 | Tableau de bord consolidé par entité et période, données validées uniquement | M | ✅ |
| EF-REP-02 | Bibliothèque des preuves avec téléchargement tracé | M | ✅ |
| EF-REP-03 | Rapport de suivi E&S structure IFC en JSON, PDF et Excel | M | ✅ |
| EF-REP-04 | Index de contenu GRI en JSON, PDF et Excel | M | ✅ |
| EF-REP-05 | Empreinte SHA-256 de chaque rapport, imprimée et journalisée | M | ✅ |
| EF-REP-06 | Consultation et vérification du journal d'audit | M | ✅ |
| EF-REP-07 | Dossier d'audit exportable (rapport, preuves, journal) | S | ❌ |
| EF-REP-08 | Graphiques d'évolution des indicateurs | S | ❌ |
| EF-REP-09 | Rapports ISSB, TCFD, SASB | C | ❌ |
| EF-REP-10 | Signature numérique des rapports | C | ❌ |
| EF-REP-11 | Export XBRL | C | ❌ |

---

## 9. Exigences non fonctionnelles

| ID | Exigence | Cible | État MVP |
|---|---|---|---|
| ENF-01 | Temps d'affichage du tableau de bord | < 3 s | Non mesuré à volume |
| ENF-02 | Génération d'un rapport complet | < 30 s | Non mesuré à volume |
| ENF-03 | Chargement initial de l'interface | < 2 s | Probable (front léger) |
| ENF-04 | Disponibilité | ≥ 99,5 % | Non applicable (pas en production) |
| ENF-05 | Volumétrie | 50 000+ entrées / an / client ; 100 000 enregistrements sans dégradation | À tester |
| ENF-06 | Isolation entre clients | 100 %, prouvée par des tests | Test dédié ✅ |
| ENF-07 | Chiffrement | Au repos AES-256, en transit TLS 1.3 | Preuves ✅ ; base et TLS ❌ |
| ENF-08 | Authentification | MFA Entreprise / Institution | ❌ |
| ENF-09 | Accessibilité | WCAG 2.1 | Partielle |
| ENF-10 | Langues | FR / EN | ✅ |
| ENF-11 | Protection des données | Loi guinéenne, RGPD si applicable, localisation selon clients publics | À instruire |
| ENF-12 | Sauvegarde et reprise | Quotidienne ; reprise < 4 h | ❌ |
| ENF-13 | Tests | Couverture > 80 %, tests multi-tenant, pentest annuel | Tests d'API ✅, couverture non mesurée |
| ENF-14 | Utilisation sur tablette et smartphone | Écrans de saisie utilisables | ✅ responsive |

---

## 10. Modèle économique (résumé)

Abonnement annuel **par organisation, pas par utilisateur** ; niveaux Essentiel, Entreprise, Institution ; services de mise en place facturés à part ; pilote payant déduit de la première année. Détail et chiffrage : livrable 09.

---

## 11. Feuille de route et backlog

| Phase | Horizon | Objectif | Contenu |
|---|---|---|---|
| MVP | Fait (oct. 2026) | Démontrer la boucle complète | Voir §6.2 |
| P0 Durcissement | ≈ 3 mois | Héberger un vrai client | PostgreSQL et migrations, stockage objet, secrets, HTTPS, MFA, limitation de débit, sauvegardes, CI, e-mails (EF-SOC-09, 10) |
| P1 Pilotes | ≈ 4 mois | Critères de sortie MVP | Relances, correction de données, indicateurs calculés, seuils par entité, PWA, dossier d'audit, notifications (EF-COL-08 à 11, EF-ACT-06, EF-REP-07, 08) |
| P2 Entreprise | ≈ 12 mois | 10 clients | Multi-référentiel, double matérialité, Finance Bridge, signature, API v1, SSO, offres |
| P3 Infrastructure | ≈ 24 mois | Référence régionale | IA, ERP / IoT, API publique, entrepôt et benchmark, portail Institution, XBRL |

Backlog détaillé en user stories avec critères d'acceptation : `docs-dev/14-roadmap-backlog.md`.

### 11.1 Critères de sortie du MVP pilote

- Les 3 pilotes ont produit au moins un rapport réel avec TRIVALINK.
- Un rapport prêteur ou ESG est généré en moins d'une heure une fois les données validées.
- Un auditeur a vérifié des données dans la plateforme sans retraitement externe.
- Au moins un écart a été suivi de bout en bout jusqu'à une action clôturée et son résultat mesuré.
- Au moins 2 pilotes sur 3 passent en abonnement payant.

---

## 12. Risques produit

| Risque | Probabilité | Impact | Parade |
|---|---|---|---|
| Complexité excessive du MVP | Moyenne | Élevé | Un segment, 44 indicateurs, 3 pilotes ; tout le reste en backlog |
| Faible adoption par les contributeurs de site | Moyenne | Élevé | Écran de saisie unique, hors ligne, statut visible, formation sur site |
| Fuite entre clients | Faible | Critique | Filtrage systématique, tests, RLS, revue obligatoire, pentest |
| Sous-estimation des exigences ISSB / prêteurs | Moyenne | Moyen | Référentiels de sortie modulaires (correspondances par indicateur) |
| Connectivité des sites | Élevée | Moyen | File hors ligne, puis PWA |
| Exigence d'hébergement local | Moyenne | Moyen | Architecture déployable sur cloud régional ; option base dédiée |
| Absence d'intégration ERP | Moyenne | Moyen | Imports Excel/CSV d'abord ; connecteurs en phase 3 |
| Indisponibilité de la marque | Moyenne | Moyen | Vérification OAPI avant toute dépense d'identité |
| Dépendance à une petite équipe | Élevée | Élevé | Documentation complète, monolithe lisible, assistants IA encadrés |

---

## 13. Hypothèses et dépendances

- Les prêteurs des pilotes acceptent un rapport de suivi généré par la plateforme (à confirmer par pilote).
- Les pilotes fournissent leurs seuils (permis, conventions, ESAP) et leurs fichiers Excel historiques.
- Chaque client dispose d'au moins deux responsables ESG ou équivalents pour la validation à deux niveaux.
- La loi guinéenne autorise l'hébergement retenu, ou un hébergement régional est disponible.

## 14. Décisions ouvertes

| Décision | Proposition |
|---|---|
| Contenu exact du MVP pilote | Arrêter après 20 à 30 entretiens et la signature des pilotes |
| Grille tarifaire | Valider sur les entretiens (livrable 09) |
| Hébergement | Voir livrable 06 |
| Équipe de construction | Interne, prestataire ou mixte |
| Marque | Recherche d'antériorité OAPI ; risques de confusion à évaluer : TRIVANCE, Tripalink, TraceLink |

## 15. Glossaire

Voir `docs-dev/02-glossaire.md` et le livrable 00 §9.
