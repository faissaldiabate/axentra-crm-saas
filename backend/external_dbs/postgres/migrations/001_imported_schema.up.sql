-- Only include standard PostgreSQL extensions that are commonly available
-- Install extensions in their default schemas (usually public)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Removed Supabase-specific extensions and schema specifications:
-- pg_graphql - Supabase GraphQL extension  
-- supabase_vault - Supabase vault extension
-- pg_stat_statements - requires superuser privileges and postgresql.conf changes
-- WITH SCHEMA extensions - Supabase-specific schema
