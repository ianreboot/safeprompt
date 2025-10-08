-- ============================================================================
-- Migration: Custom Lists Schema (Custom Whitelist/Blacklist Feature)
-- Date: 2025-10-08
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================================
--
-- BACKGROUND:
-- Adds custom whitelist/blacklist functionality to SafePrompt.
-- - Free tier: Read-only default lists
-- - Paid tiers: Can create custom rules and edit defaults
-- - Three-layer merging: defaults → profile custom → request custom
--
-- FEATURE: Custom Lists V2 (Mission ID: CUSTOM_LISTS_V2)
-- SOURCE: /home/projects/safeprompt/CUSTOM_LISTS_DETAILS_01.md
-- ============================================================================

-- ====================
-- PROFILES TABLE: Add Custom Lists Columns
-- ====================

-- Add custom_whitelist column (user's custom whitelist phrases)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'custom_whitelist'
  ) THEN
    ALTER TABLE profiles ADD COLUMN custom_whitelist JSONB DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN profiles.custom_whitelist IS 'User custom whitelist phrases (paid tiers only)';
  END IF;
END $$;

-- Add custom_blacklist column (user's custom blacklist phrases)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'custom_blacklist'
  ) THEN
    ALTER TABLE profiles ADD COLUMN custom_blacklist JSONB DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN profiles.custom_blacklist IS 'User custom blacklist phrases (paid tiers only)';
  END IF;
END $$;

-- Add removed_defaults column (phrases removed from default lists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'removed_defaults'
  ) THEN
    ALTER TABLE profiles ADD COLUMN removed_defaults JSONB DEFAULT '{"whitelist": [], "blacklist": []}'::jsonb;
    COMMENT ON COLUMN profiles.removed_defaults IS 'Default phrases user has removed (paid tiers only)';
  END IF;
END $$;

-- Add uses_default_whitelist column (whether to use default whitelist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'uses_default_whitelist'
  ) THEN
    ALTER TABLE profiles ADD COLUMN uses_default_whitelist BOOLEAN DEFAULT TRUE NOT NULL;
    COMMENT ON COLUMN profiles.uses_default_whitelist IS 'Whether user uses default whitelist (defaults to true)';
  END IF;
END $$;

-- Add uses_default_blacklist column (whether to use default blacklist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'uses_default_blacklist'
  ) THEN
    ALTER TABLE profiles ADD COLUMN uses_default_blacklist BOOLEAN DEFAULT TRUE NOT NULL;
    COMMENT ON COLUMN profiles.uses_default_blacklist IS 'Whether user uses default blacklist (defaults to true)';
  END IF;
END $$;

-- ====================
-- CUSTOM RULE USAGE TABLE
-- ====================
-- Tracks when custom rules match for analytics and debugging

CREATE TABLE IF NOT EXISTS custom_rule_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User association
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  api_key_id UUID,  -- Foreign key added later if api_keys table exists

  -- Rule match details
  rule_type TEXT NOT NULL CHECK (rule_type IN ('whitelist', 'blacklist')),
  matched_phrase TEXT NOT NULL,
  rule_source TEXT NOT NULL CHECK (rule_source IN ('default', 'profile', 'request')),

  -- Action taken
  action TEXT NOT NULL CHECK (action IN ('allowed', 'blocked', 'escalated_to_ai')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),

  -- Context
  prompt_length INTEGER,
  prompt_hash TEXT,  -- SHA256 for deduplication
  final_decision BOOLEAN,  -- Final safe/unsafe decision

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  session_id TEXT  -- Optional session tracking
);

-- Add foreign key constraint to api_keys if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'api_keys' AND table_schema = 'public'
  ) THEN
    -- Add foreign key constraint if it doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'custom_rule_usage_api_key_id_fkey'
      AND table_name = 'custom_rule_usage'
    ) THEN
      ALTER TABLE custom_rule_usage
        ADD CONSTRAINT custom_rule_usage_api_key_id_fkey
        FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Add missing columns if table already exists (for gradual schema evolution)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_rule_usage' AND column_name = 'session_id') THEN
    ALTER TABLE custom_rule_usage ADD COLUMN session_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_rule_usage' AND column_name = 'prompt_hash') THEN
    ALTER TABLE custom_rule_usage ADD COLUMN prompt_hash TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_rule_usage' AND column_name = 'final_decision') THEN
    ALTER TABLE custom_rule_usage ADD COLUMN final_decision BOOLEAN;
  END IF;
END $$;

-- ====================
-- INDEXES
-- ====================

-- Index for user's custom lists (frequent updates)
CREATE INDEX IF NOT EXISTS idx_profiles_custom_lists
  ON profiles(id)
  WHERE custom_whitelist != '[]'::jsonb OR custom_blacklist != '[]'::jsonb;

-- Index for profiles using default lists
CREATE INDEX IF NOT EXISTS idx_profiles_uses_defaults
  ON profiles(uses_default_whitelist, uses_default_blacklist)
  WHERE uses_default_whitelist = TRUE OR uses_default_blacklist = TRUE;

-- Index for custom rule usage by user
CREATE INDEX IF NOT EXISTS idx_custom_rule_usage_user
  ON custom_rule_usage(user_id, created_at DESC);

-- Index for custom rule usage by type
CREATE INDEX IF NOT EXISTS idx_custom_rule_usage_type
  ON custom_rule_usage(rule_type, created_at DESC);

-- Index for custom rule usage analytics
CREATE INDEX IF NOT EXISTS idx_custom_rule_usage_analytics
  ON custom_rule_usage(rule_type, rule_source, action, created_at DESC);

-- Index for prompt hash deduplication
CREATE INDEX IF NOT EXISTS idx_custom_rule_usage_prompt_hash
  ON custom_rule_usage(prompt_hash)
  WHERE prompt_hash IS NOT NULL;

-- ====================
-- RLS POLICIES
-- ====================

-- Enable RLS on custom_rule_usage
ALTER TABLE custom_rule_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own custom rule usage
DROP POLICY IF EXISTS custom_rule_usage_select_own ON custom_rule_usage;
CREATE POLICY custom_rule_usage_select_own ON custom_rule_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Internal/admin can view all custom rule usage
DROP POLICY IF EXISTS custom_rule_usage_internal_access ON custom_rule_usage;
CREATE POLICY custom_rule_usage_internal_access ON custom_rule_usage
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND subscription_tier = 'internal'
    )
  );

-- Service role can insert custom rule usage logs
DROP POLICY IF EXISTS custom_rule_usage_service_insert ON custom_rule_usage;
CREATE POLICY custom_rule_usage_service_insert ON custom_rule_usage
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ====================
-- GRANTS
-- ====================

GRANT SELECT ON custom_rule_usage TO authenticated;
GRANT SELECT, INSERT ON custom_rule_usage TO service_role;

-- ====================
-- TABLE COMMENTS
-- ====================

COMMENT ON TABLE custom_rule_usage IS 'Tracks when custom whitelist/blacklist rules match for analytics';
COMMENT ON COLUMN custom_rule_usage.rule_type IS 'whitelist or blacklist';
COMMENT ON COLUMN custom_rule_usage.rule_source IS 'default (built-in), profile (user custom), or request (API request)';
COMMENT ON COLUMN custom_rule_usage.action IS 'allowed, blocked, or escalated_to_ai';
COMMENT ON COLUMN custom_rule_usage.prompt_hash IS 'SHA256 hash for deduplication';
