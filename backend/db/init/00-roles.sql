-- Rôles PostgreSQL de TRIVALINK (à exécuter une fois par cluster, en superutilisateur).
-- Docker Compose et la CI l'exécutent automatiquement. En production, l'équipe d'exploitation
-- crée ces rôles avec des mots de passe issus du gestionnaire de secrets.
--
--   trivalink_owner : propriétaire du schéma, exécute les migrations. Jamais utilisé par l'API.
--   trivalink_app   : rôle de l'API. Soumis à la Row-Level Security, sans UPDATE/DELETE sur audit_log.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'trivalink_owner') THEN
    CREATE ROLE trivalink_owner LOGIN PASSWORD 'trivalink_owner_dev';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'trivalink_app') THEN
    CREATE ROLE trivalink_app LOGIN PASSWORD 'trivalink_app_dev' NOBYPASSRLS;
  END IF;
END $$;
