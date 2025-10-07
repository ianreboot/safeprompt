# SafePrompt Migration Pattern

## Quick Reference: Idempotent Migration Checklist

Before creating ANY migration, ensure EVERY database object uses the idempotent pattern:

```sql
-- Tables
CREATE TABLE IF NOT EXISTS table_name (...);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);

-- Functions
CREATE OR REPLACE FUNCTION function_name() ...

-- Triggers
DROP TRIGGER IF EXISTS trigger_name ON table_name;
CREATE TRIGGER trigger_name ...

-- Policies
DROP POLICY IF EXISTS policy_name ON table_name;
CREATE POLICY policy_name ...

-- RLS
DO $$ BEGIN
  ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Columns
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE;
```

## Why This Matters

**Without idempotency**: Migration fails halfway → Objects partially created → Next attempt fails → Manual database cleanup required

**With idempotency**: Migration fails halfway → Next attempt succeeds → All objects safely created or skipped

## Full Documentation

See `/home/projects/docs/SUPABASE_MIGRATION_BEST_PRACTICES.md` for complete patterns and examples.

## Filename Format

```
YYYYMMDDHHMMSS_description.sql  ✅ CORRECT
20251007030000_pattern_proposals.sql

YYYYMMDD_description.sql  ❌ WRONG
20251007_pattern_proposals.sql
```
