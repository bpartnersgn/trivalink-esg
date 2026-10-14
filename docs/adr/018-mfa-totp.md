# ADR-018 · MFA TOTP sans dépendance

**Contexte.** CdC : MFA obligatoire pour les offres Entreprise et Institution. TL-PROD-4. Règle du
projet : aucune dépendance sans justification.

**Décision.**
- TOTP RFC 6238 (SHA-1, 6 chiffres, 30 s, tolérance ±1 pas) implémenté avec `node:crypto`
  (≈ 80 lignes, testé contre les vecteurs de la RFC). Rejeu interdit (`mfa_last_counter`).
- Secret chiffré AES-256-GCM en base avec une clé dérivée (HKDF) de `TRIVALINK_STORAGE_KEY`.
- 10 codes de secours à usage unique, stockés hachés, affichés une seule fois.
- Connexion en deux étapes : `POST /auth/login` renvoie un `mfa_token` (5 min, inutilisable comme
  jeton d'API), puis `POST /auth/mfa` avec le code ou un code de secours.
- `organizations.mfa_required` : une personne non enrôlée reçoit une session `enroll` qui n'ouvre
  que `/me` et l'enrôlement.
- L'administrateur peut réinitialiser la MFA d'un compte (téléphone perdu) ; c'est tracé.
- Les échecs de code comptent dans l'anti force brute de la connexion.

**Conséquences.** Le QR code est produit par le front à partir de `otpauth_uri`. WebAuthn et SSO
OIDC/SAML restent à faire (phase suivante).
