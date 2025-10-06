-- SafePrompt Phase 1A Manual Deployment to DEV
-- Run this in Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/sql/new

-- ============================================
-- STEP 1: Verify and update base schema
-- ============================================

-- Check if profiles table needs tier column (for backward compatibility)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'tier'
    ) THEN
        -- Add tier column as alias to subscription_tier
        ALTER TABLE profiles ADD COLUMN tier TEXT GENERATED ALWAYS AS (subscription_tier) STORED;
    END IF;
END $$;

-- Add preferences column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'preferences'
    ) THEN
        ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- ============================================
-- STEP 2: Apply Session Storage Migration
-- ============================================

-- Create validation_sessions table
CREATE TABLE IF NOT EXISTS validation_sessions (
  session_token TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours') NOT NULL,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_fingerprint TEXT,
  user_agent_fingerprint TEXT,
  request_count INTEGER DEFAULT 0 NOT NULL,
  CONSTRAINT history_is_array CHECK (jsonb_typeof(history) = 'array'),
  CONSTRAINT flags_is_object CHECK (jsonb_typeof(flags) = 'object'),
  CONSTRAINT reasonable_request_count CHECK (request_count >= 0 AND request_count <= 10000),
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON validation_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON validation_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON validation_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON validation_sessions(created_at);

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM validation_sessions
  WHERE expires_at < NOW()
     OR created_at < NOW() - INTERVAL '2 hours';
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE validation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_select_own ON validation_sessions
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY sessions_internal_access ON validation_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND subscription_tier = 'internal'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON validation_sessions TO authenticated;
GRANT SELECT ON validation_sessions TO anon;

-- ============================================
-- STEP 3: Apply Threat Intelligence Migration
-- ============================================

-- threat_intelligence_samples table
CREATE TABLE IF NOT EXISTS threat_intelligence_samples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_text TEXT,
  prompt_hash TEXT NOT NULL,
  client_ip INET,
  ip_hash TEXT NOT NULL,
  attack_vectors TEXT[] NOT NULL,
  threat_severity TEXT NOT NULL CHECK (threat_severity IN ('low', 'medium', 'high', 'critical')),
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  session_id TEXT,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'pro')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  anonymized_at TIMESTAMPTZ,
  CONSTRAINT pii_anonymization_check CHECK (
    (created_at >= NOW() - INTERVAL '24 hours' AND prompt_text IS NOT NULL AND client_ip IS NOT NULL)
    OR (created_at < NOW() - INTERVAL '24 hours' AND prompt_text IS NULL AND client_ip IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_threat_samples_created ON threat_intelligence_samples(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_samples_ip_hash ON threat_intelligence_samples(ip_hash);
CREATE INDEX IF NOT EXISTS idx_threat_samples_prompt_hash ON threat_intelligence_samples(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_threat_samples_anonymized ON threat_intelligence_samples(anonymized_at) WHERE anonymized_at IS NULL;

-- ip_reputation table
CREATE TABLE IF NOT EXISTS ip_reputation (
  ip_hash TEXT PRIMARY KEY,
  total_samples INTEGER DEFAULT 0,
  blocked_samples INTEGER DEFAULT 0,
  block_rate NUMERIC(3,2) GENERATED ALWAYS AS (
    CASE WHEN total_samples > 0 THEN blocked_samples::numeric / total_samples::numeric ELSE 0 END
  ) STORED,
  reputation_score NUMERIC(3,2),
  auto_block BOOLEAN DEFAULT false,
  primary_attack_types TEXT[],
  first_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_sample_counts CHECK (total_samples >= 0 AND blocked_samples >= 0 AND blocked_samples <= total_samples),
  CONSTRAINT valid_reputation_score CHECK (reputation_score >= 0 AND reputation_score <= 1)
);

CREATE INDEX IF NOT EXISTS idx_ip_reputation_auto_block ON ip_reputation(auto_block) WHERE auto_block = true;
CREATE INDEX IF NOT EXISTS idx_ip_reputation_score ON ip_reputation(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_ip_reputation_last_seen ON ip_reputation(last_seen DESC);

-- ip_allowlist table
CREATE TABLE IF NOT EXISTS ip_allowlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL UNIQUE,
  ip_hash TEXT NOT NULL UNIQUE,
  description TEXT,
  purpose TEXT CHECK (purpose IN ('ci_cd', 'internal_tools', 'security_research', 'customer_request')),
  added_by UUID NOT NULL REFERENCES profiles(id),
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ip_allowlist_hash ON ip_allowlist(ip_hash);
CREATE INDEX IF NOT EXISTS idx_ip_allowlist_expires ON ip_allowlist(expires_at) WHERE expires_at IS NOT NULL;

-- Anonymization function
CREATE OR REPLACE FUNCTION anonymize_threat_samples()
RETURNS TABLE(rows_anonymized INTEGER, execution_time INTERVAL) AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  rows_updated INTEGER;
BEGIN
  start_time := clock_timestamp();
  UPDATE threat_intelligence_samples
  SET prompt_text = NULL,
      client_ip = NULL,
      anonymized_at = NOW()
  WHERE created_at < NOW() - INTERVAL '24 hours'
    AND anonymized_at IS NULL
    AND (prompt_text IS NOT NULL OR client_ip IS NOT NULL);
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  end_time := clock_timestamp();
  RETURN QUERY SELECT rows_updated, end_time - start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
ALTER TABLE threat_intelligence_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_allowlist ENABLE ROW LEVEL SECURITY;

-- threat_intelligence_samples policies
CREATE POLICY samples_internal_full ON threat_intelligence_samples FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND subscription_tier = 'internal')
);

-- ip_reputation policies
CREATE POLICY reputation_read_all ON ip_reputation FOR SELECT USING (true);
CREATE POLICY reputation_internal_write ON ip_reputation FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND subscription_tier = 'internal')
);

-- ip_allowlist policies
CREATE POLICY allowlist_read_all ON ip_allowlist FOR SELECT USING (true);
CREATE POLICY allowlist_internal_manage ON ip_allowlist FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND subscription_tier = 'internal')
);

-- Grants
GRANT SELECT ON threat_intelligence_samples TO authenticated;
GRANT SELECT ON ip_reputation TO authenticated;
GRANT SELECT ON ip_allowlist TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify deployment:

-- 1. Check all tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'validation_sessions', 'threat_intelligence_samples', 'ip_reputation', 'ip_allowlist')
ORDER BY tablename;

-- 2. Check profiles columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('subscription_tier', 'tier', 'preferences')
ORDER BY column_name;

-- 3. Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('validation_sessions', 'threat_intelligence_samples', 'ip_reputation', 'ip_allowlist');

-- Expected results:
-- 1. All 5 tables present
-- 2. profiles has subscription_tier, tier (computed), and preferences columns
-- 3. All tables have rowsecurity = true
