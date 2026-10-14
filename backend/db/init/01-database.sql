-- Base de développement (Docker Compose). Le propriétaire est trivalink_owner.
SELECT 'CREATE DATABASE trivalink OWNER trivalink_owner'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'trivalink')\gexec
