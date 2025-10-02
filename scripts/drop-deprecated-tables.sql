-- Drop deprecated tables from SafePrompt database
-- Run this in Supabase SQL Editor

-- 1. Drop deprecated "users" table (replaced by "profiles")
DROP TABLE IF EXISTS users CASCADE;

-- 2. Drop deprecated "api_keys" table (moved to profiles.api_key)
DROP TABLE IF EXISTS api_keys CASCADE;

-- 3. Drop deprecated "validation_logs" table (replaced by "api_logs")
DROP TABLE IF EXISTS validation_logs CASCADE;

-- Verify tables are gone
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
