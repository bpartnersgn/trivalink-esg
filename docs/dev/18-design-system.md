# 18 · Design system et règles UX

Identité : **TRIVALINK — ESG MANAGEMENT PLATFORM** · signature *Structurer la responsabilité. Piloter la performance.*
Ton (plateforme de marque) : **sérieux, sobre, crédible devant un auditeur et un bailleur**, avec une signature africaine assumée, sans folklore.

> L'identité visuelle définitive (logo, typographies) n'est pas encore figée : elle attend la vérification de disponibilité de la marque (OAPI, classes 9, 35, 42). Les jetons ci-dessous sont ceux du MVP ; les modifier **uniquement** dans `:root` de `web/src/styles.css`.

## 1. Jetons (variables CSS)

| Jeton | Valeur | Usage |
|---|---|---|
| `--brand` | `#0F3D3E` | Vert pétrole profond : menu latéral, titres de rapports PDF, `theme-color` |
| `--brand-2` | `#155E5C` | Liens, variantes |
| `--accent` | `#2E9C7A` | Actions principales, focus |
| `--accent-soft` | `#E3F3EE` | Fond de focus, surlignage |
| Marque claire | `#66C2A5` | Pastille du logo « T », élément actif du menu |
| `--bg` | `#F4F6F6` | Fond d'application |
| `--surface` / `--surface-2` | `#FFFFFF` / `#F8FAF9` | Cartes / zones secondaires |
| `--border` | `#E1E7E6` | Bordures |
| `--text` / `--muted` | `#1C2A2B` / `#687A7B` | Texte / texte secondaire |
| `--red` / `--red-soft` | `#B42318` / `#FDECEA` | Hors seuil, rejet, non-conformité, en retard |
| `--amber` / `--amber-soft` | `#A15C07` / `#FEF4E2` | Brouillon, en attente, avertissement |
| `--green` / `--green-soft` | `#18794E` / `#E6F4EC` | Validé, conforme, atteint |
| `--blue` / `--blue-soft` | `#1D5FA8` / `#E8F0FA` | En cours, soumis |
| `--gray-soft` | `#EEF1F1` | Neutre |
| `--radius` | `10px` | Cartes ; champs 7 px ; boutons 8 px |
| `--shadow` | double ombre très légère | Cartes |
| Police | Inter, Segoe UI, system-ui… | 14 px de base ; h1 22 px ; h2 16 px |

PDF (pdfkit) : Helvetica, titre `#0F3D3E`, en-têtes de tableau fond `#E6EFEE`, lignes alternées `#F7F9F9`, valeurs hors seuil en `#B42318`, A4 paysage, marges 36 pt.

## 2. Sémantique des couleurs (à respecter partout)

| Sens | Couleur | Exemples |
|---|---|---|
| Problème qui demande une action | Rouge | Hors seuil, rejetée, non conforme, en retard, chaîne rompue |
| À compléter / en attente | Ambre | Brouillon, écart ouvert, grief reçu, opération hors ligne en file |
| En cours de traitement | Bleu | Soumise, revue, action en cours |
| Acquis, prouvé | Vert | Validée, conforme, terminée, objectif atteint, chaîne intègre |
| Neutre / inactif | Gris | Demandée, planifiée, annulée, close |

Ne jamais coder une information **uniquement** par la couleur : toujours un libellé (badge) ou une icône.

## 3. Composants

Voir la liste dans 08-frontend.md §8. Règles :
- Un seul bouton primaire (`btn btn-primary`) par zone.
- Les actions destructrices ou irréversibles (valider, clôturer, rejeter) demandent une confirmation ou un motif.
- Les tableaux denses utilisent `.table` dans `.table-wrap` (défilement horizontal sur mobile).
- Codes et identifiants techniques en `.mono` (ex. `E11`, empreintes).

## 4. Règles UX propres à TRIVALINK

1. **La preuve se voit.** Partout où un chiffre apparaît, on doit pouvoir atteindre sa preuve et son historique en un clic (lien vers `#/datapoint/:id`).
2. **Le statut se voit.** Chaque donnée, action, obligation porte un badge. Les compteurs « reste à fournir / en validation / validées » sont visibles en tête de collecte et de campagne.
3. **Le contributeur de site ne voit que ce qu'il doit faire.** Page d'accueil = sa liste à saisir ; pas de vocabulaire de consolidation.
4. **Les messages d'erreur expliquent la règle et la sortie.** Ex. « Créez au moins une action corrective avant de clore cet écart. » (pas « Erreur 400 »).
5. **Le hors-ligne est explicite.** Bandeau « Hors ligne », compteur d'opérations en attente, toast ambre « En attente (hors ligne) ».
6. **Données validées uniquement dans les vues consolidées**, et on le dit (« Seules les données validées sont consolidées. »).
7. **« Non disponible » n'est pas zéro.** Une absence de donnée s'affiche `–` ou « Non disponible », jamais `0`.
8. **Bilingue** : chaque écran doit être vérifié en FR et en EN.
9. **Rapports impeccables** : les rapports PDF sont le premier support de marque que les prêteurs verront. Alignements, unités, empreinte, pagination, aucune coquille.
10. **Marque discrète chez le client** : dans les rapports clients, « Généré avec TRIVALINK » plutôt qu'une marque envahissante ; thème par client à terme.

## 5. Rédaction (microcopie)

- Français soutenu mais simple ; vouvoiement ; verbes d'action sur les boutons (« Soumettre », « Créer une action », « Ouvrir un accès auditeur »).
- Vocabulaire métier exact : « écart », « pièce justificative », « valider », « clore » (un écart), « clôturer » / « terminer » (une action). Voir 02-glossaire.md.
- Périodes : « T3 2026 » en FR, « Q3 2026 » en EN.
- Nombres : espace insécable comme séparateur de milliers en FR, virgule décimale.
- Aucun « ORCHEA », « TRIVANCE » ou « XEYRO » dans l'interface : ce sont d'anciens noms.
