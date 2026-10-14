# 09 · Budget et modèle économique · TRIVALINK ESG

| | |
|---|---|
| **Version** | 1.0 · 13 octobre 2026 |
| **Statut** | Rédigé. **Tous les montants sont des hypothèses de travail [HYPOTHÈSE]**, à confronter aux 20 à 30 entretiens de découverte et aux premiers pilotes |
| **Sources** | `trivalink/trivalink-product-foundation.md` §9 (principes et grille), `strategie/plan-produit-marque.md` §2 (offres, pilote payant), PRD ORCHEA (vision), livrable 02 PRD §11 (phases), livrable 06 DAT (infrastructure) |
| **Devise** | USD, sauf mention contraire |

Ce document décrit **comment TRIVALINK gagne de l'argent, combien il coûte à construire et à exploiter, et quand il devient rentable**. Il sert à décider (recrutements, financement, prix), à préparer les échanges avec des investisseurs ou des partenaires, et à donner aux développeurs l'ordre de grandeur des coûts d'infrastructure qu'ils engagent.

Aucun chiffre de ce document n'a été vérifié auprès de clients. Les fourchettes viennent des documents de cadrage ; les volumes de clients et les coûts sont des hypothèses construites pour ce budget.

---

## 1. Synthèse

| Indicateur | An 1 | An 2 | An 3 |
|---|--:|--:|--:|
| Clients Entreprise (fin d'année) | 2 | 8 | 15 |
| Clients Essentiel | 2 | 10 | 30 |
| Clients Institution | 0 | 1 | 2 |
| Revenu récurrent annuel (ARR) en fin d'année | 65 000 | 329 000 | 675 000 |
| Chiffre d'affaires facturé | 94 000 | 420 000 | 800 000 |
| Charges | 197 000 | 395 000 | 683 000 |
| **Résultat d'exploitation** | **−103 000** | **+25 000** | **+117 000** |
| Trésorerie cumulée (hors financement) | −103 000 | −78 000 | +39 000 |

Scénario central [HYPOTHÈSE]. **Besoin de financement estimé : 150 000 à 200 000 USD** pour couvrir la première année, le creux de trésorerie de l'an 2 et une réserve de 3 à 6 mois de charges. Équilibre d'exploitation visé au cours de l'an 2, avec environ 8 clients Entreprise.

Ce qui fait le résultat : **le nombre de clients Entreprise signés**. Un client Entreprise rapporte autant que six clients Essentiel. Les Essentiel élargissent la base et la chaîne de valeur, ils ne financent pas l'entreprise à eux seuls.

## 2. Modèle économique

### 2.1 Principes (Product Foundation §9.1)

1. **Abonnement SaaS annuel par organisation**, facturé d'avance.
2. **Pas de prix par utilisateur** : tous les contributeurs de site doivent pouvoir être dans l'outil. Le prix dépend de la taille de l'organisation, du nombre d'entités et des fonctions activées.
3. **Services facturés à part** : mise en place, reprise des fichiers existants, formation, accompagnement au premier rapport, en direct ou via des cabinets partenaires.
4. **Pilote payant** à prix réduit, déduit de la première année si le client signe. Un pilote gratuit n'engage personne.
5. **Devise** : USD ou EUR pour les grands comptes ; monnaie locale (GNF, XOF) possible pour les petites structures.
6. **Croissance par la chaîne de valeur** : les grands comptes imposent des exigences ESG à leurs fournisseurs ; une offre légère pour ces fournisseurs étend la base de clients.

### 2.2 Proposition de valeur chiffrable (à mesurer en pilote)

| Bénéfice | Mesure | Ordre de grandeur attendu [HYPOTHÈSE] |
|---|---|---|
| Temps de production du rapport prêteur | Jours-personne par rapport trimestriel | Divisé par 3 (de ~15 à ~5 jours-personne) |
| Préparation des audits E&S | Jours de l'auditeur et de l'équipe interne | −30 % grâce aux preuves attachées et au journal |
| Risque de non-conformité prêteur | Écarts sans action, obligations sans preuve | Visibles en temps réel au lieu d'être découverts à l'audit |
| Coût d'un retard de décaissement ou d'une clause déclenchée | Montant du financement en jeu | Souvent des millions de USD pour un projet minier : l'abonnement est marginal |

Argument commercial : pour un groupe minier dont le financement dépend du respect des Normes de performance IFC, un abonnement de 20 000 à 40 000 USD est inférieur au coût d'un seul consultant E&S pendant un mois de préparation d'audit.

## 3. Offres et grille tarifaire

### 3.1 Niveaux

| | **Essentiel** | **Entreprise** | **Institution** |
|---|---|---|---|
| Pour qui | PME, sous-traitants, filiales isolées | Groupes miniers et industriels, banques | Groupes de 10+ entités, ministères, bailleurs, programmes |
| Prix indicatif | **3 000 à 6 000 USD/an** | **20 000 à 40 000 USD/an** | **Sur devis, à partir de 50 000 USD/an** |
| Prix de référence du budget | 4 500 | 28 000 | 60 000 |
| Entités | 1 | Multi-entités, jusqu'à 10 sites inclus | Illimité, vue consolidée multi-organisations |
| Indicateurs | Socle de base (~20) | Catalogue complet (44) + seuils du client | Catalogue complet + catalogues sectoriels |
| Collecte et preuves | ✅ | ✅ + import, hors ligne | ✅ |
| Validation à deux niveaux | Option un niveau (à décider, ADR-006) | ✅ | ✅ |
| Risques, obligations, écarts, actions | Simplifié | ✅ complet | ✅ complet |
| Griefs et programmes communautaires | — | ✅ | ✅ + suivi de bénéficiaires (phase 3) |
| Rapports | Index GRI simple | Rapport IFC, index GRI, PDF / Excel, empreinte | + rapports bailleurs personnalisés |
| Accès auditeur | — | ✅ | ✅ |
| Journal d'audit vérifiable | ✅ | ✅ | ✅ + ancrage externe |
| MFA | Option | ✅ obligatoire | ✅ obligatoire |
| Hébergement | Mutualisé | Mutualisé | Base dédiée possible, localisation au choix |
| Support | E-mail, jours ouvrés | E-mail et téléphone, interlocuteur nommé | SLA contractuel, revue trimestrielle |
| Disponibilité | Meilleur effort | 99,5 % | 99,5 % contractuelle avec pénalités |

### 3.2 Options [HYPOTHÈSE]

| Option | Prix indicatif |
|---|---|
| Site supplémentaire au-delà de 10 (Entreprise) | 1 500 USD/an par site |
| Module Programmes communautaires avancé (géolocalisation, bénéficiaires) | 5 000 USD/an |
| Connecteur ERP ou SIRH (phase 2) | 5 000 à 10 000 USD de mise en place + 2 000 USD/an |
| Catalogue d'indicateurs supplémentaire (ISSB, ESRS, ITIE) | 3 000 USD/an par référentiel |
| Hébergement local dédié (hors Institution) | Sur devis |

### 3.3 Services

| Service | Contenu | Prix indicatif |
|---|---|---|
| Mise en place Essentiel | Paramétrage, import, formation à distance (½ journée) | 1 500 à 2 500 USD |
| **Mise en place Entreprise** | Paramétrage des entités et des seuils (permis, ESAP), reprise des fichiers Excel, formation sur site des contributeurs et des valideurs | **5 000 à 15 000 USD** (référence 10 000) |
| Mise en place Institution | Idem + portail, intégrations, plan de déploiement | À partir de 15 000 USD |
| Accompagnement au premier rapport | Revue des données, préparation du rapport prêteur | 3 000 à 8 000 USD, en direct ou via un cabinet partenaire |
| Formation complémentaire | Journée sur site | 1 000 USD + frais |

### 3.4 Pilote payant

| Élément | Proposition |
|---|---|
| Durée | 3 mois, un cycle trimestriel complet |
| Prix | **5 000 USD** environ, **déduit de la première année** si le client signe |
| Contenu | Offre Entreprise sur un périmètre limité (2 à 3 sites), mise en place incluse |
| Critères de sortie | Rapport réel produit avec TRIVALINK ; auditeur qui valide sans retraitement ; rapport en moins d'une heure (08 §6.3) |
| Engagement | Lettre d'intention de souscription si les critères sont atteints |

### 3.5 Conditions commerciales

- Facturation annuelle d'avance ; paiement à 30 jours.
- Remise pluriannuelle : −10 % pour un engagement de 3 ans [HYPOTHÈSE].
- Remise de lancement réservée aux 5 premiers clients, en échange d'une étude de cas publiable.
- Indexation annuelle plafonnée (ex. 5 %).
- Réversibilité : export complet des données et des preuves à la fin du contrat, inclus.

## 4. Coûts de construction

### 4.1 Ce qui existe

Le MVP (monolithe Node.js + React, 18 tables, 55 routes, 44 indicateurs, 6 tests verts) a été construit en développement assisté par IA. Son coût direct est faible ; sa valeur de remplacement par une équipe classique serait de l'ordre de **4 à 6 mois-personne** de développement [HYPOTHÈSE], soit 20 000 à 40 000 USD aux tarifs régionaux.

### 4.2 Budget par phase (02 PRD §11)

| Phase | Horizon | Contenu | Équipe technique | Coût estimé [HYPOTHÈSE] |
|---|---|---|---|--:|
| MVP | Fait | Boucle complète démontrable | Fondateurs + IA | — |
| P0 Durcissement | ≈ 3 mois | PostgreSQL et migrations, stockage objet, secrets, HTTPS, MFA, limitation de débit, sauvegardes, CI, e-mails | CTO + 1 à 2 développeurs | 30 000 à 40 000 (équipe) + 10 000 (pentest) + 3 000 (infra, outils) |
| P1 Pilotes | ≈ 4 mois | Relances, correction de données, indicateurs calculés, seuils par entité, PWA, dossier d'audit, notifications | CTO + 2 développeurs + expert E&S à mi-temps | 50 000 à 60 000 |
| P2 Entreprise | ≈ 12 mois | Multi-référentiel, double matérialité, Finance Bridge, signature, API v1, SSO | CTO + 3 développeurs + expert E&S | 200 000 à 250 000 |
| P3 Infrastructure | ≈ 24 mois | IA, ERP / IoT, API publique, entrepôt, portail Institution | Équipe de 6 à 8 techniques | 350 000 à 450 000 / an |

Ces coûts sont **inclus dans les charges d'équipe** du budget (§6) ; ils ne s'y ajoutent pas.

### 4.3 Ce que le développement assisté par IA change

- Productivité plus élevée sur le code standard (routes, écrans, tests) : l'équipe de l'an 1 est dimensionnée à 3 personnes techniques au lieu de 5.
- Coût d'outillage à prévoir : abonnements aux assistants de code et à l'API, environ **100 à 200 USD par développeur et par mois** [HYPOTHÈSE].
- Le temps gagné doit être réinvesti dans les tests, la revue de sécurité et la documentation (CLAUDE.md, livrables 00 à 09), sans lesquels le code généré dérive.

## 5. Coûts d'exploitation

### 5.1 Infrastructure (06 DAT §9)

| Poste | Pilotes (T1), USD/mois | 20 clients (T2), USD/mois | 50 clients (T3), USD/mois |
|---|--:|--:|--:|
| 2 conteneurs applicatifs | 40 | 120 | 400 |
| PostgreSQL managé (sauvegardes PITR) | 150 | 350 | 900 |
| Stockage objet (preuves, versioning, réplication) | 20 | 80 | 250 |
| Sauvegardes hors région | 30 | 60 | 150 |
| Répartiteur, TLS, protection | 25 | 50 | 150 |
| Supervision et journaux | 50 | 120 | 300 |
| E-mail transactionnel, SMS | 20 | 80 | 200 |
| Coffre de secrets / KMS | 10 | 20 | 50 |
| Staging | 100 | 150 | 250 |
| **Total mensuel** | **≈ 450** | **≈ 1 030** | **≈ 2 650** |
| **Total annuel** | **≈ 5 400** | **≈ 12 400** | **≈ 31 800** |

Coût d'infrastructure par client Entreprise : environ **500 à 800 USD/an**, soit 2 à 3 % du prix. Une base dédiée (Institution) ajoute 2 000 à 5 000 USD/an, à refacturer. Un hébergement local en Guinée peut coûter 1,5 à 2 fois plus cher pour un niveau de service comparable [HYPOTHÈSE].

### 5.2 Coûts récurrents hors infrastructure

| Poste | An 1 | An 2 | An 3 |
|---|--:|--:|--:|
| Outils (assistants IA de code, dépôt, CI, suivi d'anomalies, bureautique) | 6 000 | 10 000 | 15 000 |
| Sécurité (pentest annuel, puis préparation ISO 27001 en an 3) | 10 000 | 12 000 | 25 000 |
| Juridique (données personnelles, contrats, CGV, marque OAPI) | 8 000 | 10 000 | 12 000 |
| Administration, comptabilité, assurances | 8 000 | 15 000 | 25 000 |

## 6. Équipe

### 6.1 Plan de recrutement [HYPOTHÈSE]

Coûts annuels chargés, sur la base de profils en Afrique de l'Ouest et d'une partie à distance.

| Rôle | An 1 | An 2 | An 3 | Coût annuel chargé (an 1 → an 3) |
|---|:-:|:-:|:-:|---|
| Fondateur, direction commerciale | 1 | 1 | 1 | 36 000 → 48 000 |
| CTO / responsable technique | 1 | 1 | 1 | 48 000 → 60 000 |
| Développeurs full-stack | 2 (dont 1 à partir du mois 4) | 3 | 4 | 24 000 → 28 000 chacun |
| Expert E&S (référentiel, recette, avant-vente) | 0,5 | 1 | 2 | 36 000 → 36 000 (temps plein) |
| Chargé de réussite client (mise en place, formation, support) | — | 2 | 3 | 15 000 → 16 000 |
| Commercial grands comptes | — | 1 | 2 | 24 000 → 26 000 + variable |
| Data / IA | — | — | 1 | 36 000 |
| DevOps / exploitation | — | — | 1 | 30 000 |
| **Effectif (ETP)** | **≈ 4,25** | **9** | **15** | |
| **Coût équipe** | **144 000** | **264 000** | **458 000** | |

Les services de mise en place sont assurés par les chargés de réussite client et l'expert E&S ; au-delà de leur capacité, ils sont sous-traités à des cabinets partenaires.

## 7. Projection sur 3 ans (scénario central)

### 7.1 Hypothèses de volume

| | An 1 | An 2 | An 3 |
|---|--:|--:|--:|
| Pilotes payants | 3 | — | — |
| Pilotes convertis en Entreprise | 2 | — | — |
| Nouveaux clients Entreprise | 2 | 6 | 7 |
| Nouveaux clients Essentiel | 2 | 8 | 20 |
| Nouveaux clients Institution | 0 | 1 | 1 |
| Attrition annuelle | 0 | 0 | 0 (à surveiller dès l'an 3) |

### 7.2 Chiffre d'affaires

| USD | An 1 | An 2 | An 3 |
|---|--:|--:|--:|
| Abonnements Entreprise (28 000) | 56 000 | 224 000 | 420 000 |
| Abonnements Essentiel (4 500) | 9 000 | 45 000 | 135 000 |
| Abonnements Institution (60 000) | 0 | 60 000 | 120 000 |
| **Sous-total abonnements (ARR)** | **65 000** | **329 000** | **675 000** |
| Pilotes payants (3 × 5 000) | 15 000 | — | — |
| Déduction des pilotes convertis (2 × 5 000) | −10 000 | — | — |
| Services de mise en place | 24 000 | 91 000 | 125 000 |
| **Chiffre d'affaires facturé** | **94 000** | **420 000** | **800 000** |
| Part récurrente | 69 % | 78 % | 84 % |

Convention : abonnement annuel facturé d'avance à la signature, compté en entier dans l'année de facturation (vue trésorerie). En comptabilité, le revenu serait étalé sur 12 mois.

### 7.3 Charges

| USD | An 1 | An 2 | An 3 |
|---|--:|--:|--:|
| Équipe | 144 000 | 264 000 | 458 000 |
| Commissions commerciales (≈ 10 % des nouveaux abonnements) | 0 | 25 000 | 35 000 |
| Hébergement et services cloud | 6 000 | 15 000 | 35 000 |
| Outils | 6 000 | 10 000 | 15 000 |
| Sécurité | 10 000 | 12 000 | 25 000 |
| Juridique | 8 000 | 10 000 | 12 000 |
| Marketing et prospection (déplacements, salons miniers, contenus, études de cas) | 15 000 | 40 000 | 70 000 |
| Administration, comptabilité, assurances | 8 000 | 15 000 | 25 000 |
| Commissions des cabinets partenaires | 0 | 4 000 | 8 000 |
| **Total charges** | **197 000** | **395 000** | **683 000** |

### 7.4 Résultat et trésorerie

| USD | An 1 | An 2 | An 3 |
|---|--:|--:|--:|
| Chiffre d'affaires | 94 000 | 420 000 | 800 000 |
| Charges | 197 000 | 395 000 | 683 000 |
| **Résultat d'exploitation** | **−103 000** | **+25 000** | **+117 000** |
| Marge d'exploitation | −110 % | +6 % | +15 % |
| Trésorerie cumulée hors financement | −103 000 | −78 000 | +39 000 |

Point bas de trésorerie au cours de l'an 2, avant l'encaissement des renouvellements. Avec la réserve de sécurité, le besoin de financement est estimé entre **150 000 et 200 000 USD**.

### 7.5 Scénarios

| Scénario | Hypothèses | Résultat an 1 | Résultat an 2 | Résultat an 3 | Trésorerie cumulée an 3 |
|---|---|--:|--:|--:|--:|
| **Bas** | 1 pilote converti ; 4 / 8 Entreprise en an 2 / 3 ; prix bas (22 000, 3 500, 50 000) ; recrutements freinés | −132 500 | −156 500 | −96 500 | −385 500 |
| **Central** | Ci-dessus | −103 000 | +25 000 | +117 000 | +39 000 |
| **Haut** | 3 pilotes convertis ; 10 / 20 Entreprise ; prix hauts (32 000, 5 500, 70 000) | −61 500 | +141 500 | +507 500 | +587 500 |

Lecture : le scénario bas n'est pas viable avec le plan de recrutement prévu. **Règle de pilotage proposée** : n'engager les recrutements de l'an 2 (commercial, deuxième chargé de réussite client, troisième développeur) qu'après la signature du 4ᵉ client Entreprise.

## 8. Économie unitaire (client Entreprise)

| Indicateur | Valeur [HYPOTHÈSE] | Calcul |
|---|--:|---|
| Prix annuel moyen (ACV) | 28 000 | Grille §3.1 |
| Services de mise en place | 10 000 | Une fois |
| Coût direct annuel (infrastructure, support, part d'expert E&S) | ≈ 4 000 | 700 infra + ~3 300 de support et de suivi |
| **Marge brute sur abonnement** | **≈ 86 %** | (28 000 − 4 000) / 28 000 |
| Coût d'acquisition (CAC) | ≈ 15 000 | Ventes + marketing an 2 (≈ 90 000) / 6 nouveaux clients Entreprise |
| Délai de récupération du CAC | ≈ 7,5 mois | 15 000 / (24 000 / 12) |
| Attrition annuelle supposée | 10 % | Durée de vie moyenne 10 ans, ramenée prudemment à 5 ans |
| **Valeur vie client (LTV, 5 ans)** | **≈ 130 000** | 24 000 × 5 + 10 000 de services |
| **Ratio LTV / CAC** | **≈ 8,7** | Bon au-delà de 3 |

Pour un client Essentiel : ACV 4 500, marge brute ≈ 80 %, coût d'acquisition à garder sous 2 000 USD, donc **vente surtout indirecte** (via les grands comptes donneurs d'ordre et les cabinets partenaires), mise en place à distance.

### 8.1 Seuil de rentabilité

Avec la structure de charges de l'an 2 (395 000 USD), l'équilibre demande environ **14 clients Entreprise** sans autre revenu, ou la combinaison de l'an 2 (8 Entreprise, 10 Essentiel, 1 Institution, services de mise en place).

## 9. Distribution et partenaires

| Canal | Rôle | Rémunération [HYPOTHÈSE] |
|---|---|---|
| Vente directe (fondateurs, puis commercial) | Grands comptes miniers et industriels, banques | Variable commercial ≈ 10 % de la première année |
| Cabinets E&S et d'audit (Conakry, Dakar, Abidjan) | Prescription, mise en place, accompagnement au rapport | 15 à 20 % de la première année d'abonnement apportée, ou marge sur les services qu'ils facturent |
| Revendeurs / intégrateurs | Marchés hors Guinée | Remise revendeur 25 à 30 % |
| Grands comptes donneurs d'ordre | Diffusion de l'offre Essentiel à leurs fournisseurs | Tarif fournisseur négocié, éventuellement pris en charge par le donneur d'ordre |
| Bailleurs et programmes | Offre Institution, financement de déploiements | Contrats sur devis |

Calendrier commercial (plan produit et marque) : 20 à 30 entretiens de découverte (semaines 1-4), 3 pilotes payants signés (mois 2-4), pilotes en production et premiers rapports (mois 4-6), études de cas et 2 cabinets partenaires (mois 6).

## 10. Financement

| Source | Montant indicatif | Remarques |
|---|--:|---|
| Apport des fondateurs | 20 000 à 50 000 | Couvre les premiers mois et le pentest |
| Pilotes payants et premiers abonnements | 15 000 à 60 000 en an 1 | Préférer l'encaissement d'avance |
| Subventions et programmes d'appui (incubateurs, programmes ESG / climat de bailleurs) | 25 000 à 100 000 | Sans dilution ; délais longs |
| Investisseurs d'amorçage (business angels, fonds d'impact Afrique) | 100 000 à 250 000 | À lever après 2 pilotes convertis, pour un meilleur prix |

**Recommandation** : financer l'an 1 par les fondateurs, les pilotes et une subvention, puis lever un amorçage une fois 2 pilotes convertis et une étude de cas publiée.

## 11. Risques économiques

| Risque | Effet | Parade |
|---|---|---|
| Cycle de vente long chez les grands comptes (6 à 12 mois) | Retard de chiffre d'affaires | Pilotes payants courts, vente via les cabinets déjà présents |
| Prix jugé élevé pour le marché local | Conversion faible | Tester la grille dès les entretiens ; offre Essentiel ; paiement en monnaie locale |
| Concurrence d'outils internationaux | Pression sur les prix | Différenciation prêteurs IFC, terrain, hors ligne, français, accompagnement local |
| Dépendance à quelques grands clients | Fragilité | Viser 15 clients Entreprise en an 3, développer Essentiel et Institution |
| Risque de change (GNF) | Perte de valeur des encaissements | Facturer en USD ou EUR les grands comptes |
| Exigence d'hébergement local | Surcoût d'infrastructure | Option facturée, offre Institution |
| Coût réel des services de mise en place sous-estimé | Marge des services négative | Forfaits cadrés, partenaires pour les pics |
| Glissement du durcissement technique (P0) | Pilotes retardés | P0 strictement limité aux écarts bloquants (06 §13) |

## 12. Indicateurs de pilotage économique

| Indicateur | Fréquence | Cible an 2 [HYPOTHÈSE] |
|---|---|---|
| ARR et nombre de clients par offre | Mensuelle | 329 000 USD, 19 clients |
| Taux de conversion pilote → abonnement | Par pilote | ≥ 2 sur 3 |
| Cycle de vente moyen | Trimestrielle | ≤ 6 mois |
| CAC et délai de récupération | Trimestrielle | ≤ 15 000 USD, ≤ 12 mois |
| Attrition (logos et revenu) | Annuelle | ≤ 10 % |
| Marge brute | Trimestrielle | ≥ 80 % |
| Coût d'infrastructure par client | Mensuelle | ≤ 3 % du prix |
| Trésorerie en mois de charges | Mensuelle | ≥ 6 mois |

## 13. Points à valider

1. La grille de prix (§3) sur 20 à 30 entretiens de découverte : prix acceptable, unité de prix (sites, entités), devise.
2. Le prix et le contenu du pilote payant.
3. Le plan de recrutement et les coûts salariaux par pays.
4. Le choix d'hébergement (06 DAT ADR-016) et son coût.
5. Les conditions des cabinets partenaires.
6. Le besoin de financement et la stratégie de levée.

## 14. Historique

| Version | Date | Changement |
|---|---|---|
| 1.0 | 13/10/2026 | Création : grille issue de la Product Foundation et du plan produit, budget sur 3 ans, scénarios, économie unitaire. Tous les montants sont des hypothèses |
