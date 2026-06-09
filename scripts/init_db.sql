-- ════════════════════════════════════════════════════════════════
--  Family Office – PostgreSQL Initialisation Script
--  Runs once when the Docker container is first created.
--  Alembic handles schema creation; this script sets up
--  extensions, roles, and performance settings.
-- ════════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- trigram fuzzy search
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- GIN indexes on scalars
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- query performance stats

-- ── Timezone ──────────────────────────────────────────────────────
SET timezone = 'UTC';

-- ── Performance settings ──────────────────────────────────────────
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_min_duration_statement = 200;   -- log queries > 200ms
ALTER SYSTEM SET track_activity_query_size = 4096;

-- ── Read-only analytics role ──────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'analytics_reader') THEN
    CREATE ROLE analytics_reader;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE family_office TO analytics_reader;
GRANT USAGE ON SCHEMA public TO analytics_reader;
-- Tables will be granted after Alembic creates them:
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_reader;

SELECT 'Database initialised successfully.' AS status;
