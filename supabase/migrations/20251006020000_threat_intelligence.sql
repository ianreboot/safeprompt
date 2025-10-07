-- Threat Intelligence & IP Reputation System
-- Quarter 1 Phase 1A - Competitive Moat Feature
-- Created: 2025-10-06
-- Legal Basis: 24-hour anonymization model (GDPR/CCPA compliant)

-- ====================
-- THREAT INTELLIGENCE SAMPLES
-- ====================
-- Stores full prompt data for 24 hours, then anonymizes
-- Free tier: Blocked requests only
-- Pro tier: All requests if opted in

CREATE TABLE IF NOT EXISTS threat_intelligence_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- PROMPT DATA (TEMPORARY - deleted after 24h)
  prompt_text TEXT,  -- Full prompt for analysis (NULL after anonymization)
  prompt_hash TEXT NOT NULL,  -- SHA256 hash (permanent, for deduplication)
  prompt_length INTEGER NOT NULL,  -- Metadata only
  prompt_compressed BYTEA,  -- gzip compressed (NULL after anonymization)

  -- VALIDATION RESULT (PERMANENT - no PII)
  validation_result JSONB NOT NULL,  -- Full validation response
  attack_vectors TEXT[] NOT NULL DEFAULT '{}',  -- e.g., ['context_priming', 'xss']
  threat_severity TEXT NOT NULL CHECK (threat_severity IN ('low', 'medium', 'high', 'critical')),
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  detection_method TEXT,  -- e.g., 'pattern', 'ai_pass1', 'session_analysis'

  -- IP DATA (TEMPORARY - deleted after 24h)
  client_ip INET,  -- Full IP address (NULL after anonymization)
  ip_hash TEXT NOT NULL,  -- SHA256(ip) for permanent tracking

  -- IP METADATA (PERMANENT - not PII)
  ip_country CHAR(2),  -- Country code from geolocation
  ip_is_proxy BOOLEAN DEFAULT FALSE,  -- VPN/proxy detection
  ip_is_hosting BOOLEAN DEFAULT FALSE,  -- Datacenter/hosting IP
  ip_isp TEXT,  -- Internet service provider

  -- BEHAVIORAL FINGERPRINT (PERMANENT - no PII)
  session_metadata JSONB,  -- Behavioral patterns (timing, entropy, etc.)
  user_agent_category TEXT,  -- 'browser', 'automated', 'mobile', etc. (not full UA)
  request_timing_pattern TEXT,  -- 'regular_intervals', 'burst', 'human_like'

  -- USER ASSOCIATION
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'pro')),
  intelligence_sharing BOOLEAN NOT NULL DEFAULT TRUE,  -- User consent flag

  -- TIMESTAMPS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  anonymized_at TIMESTAMP WITH TIME ZONE,  -- When PII was removed
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days') NOT NULL,

  -- ANALYSIS STATE
  reviewed BOOLEAN DEFAULT FALSE,
  ai_analysis JSONB,  -- AI-extracted patterns
  pattern_extracted BOOLEAN DEFAULT FALSE,

  -- CONSTRAINTS
  CONSTRAINT valid_expiration CHECK (expires_at > created_at),
  CONSTRAINT must_anonymize_eventually CHECK (
    anonymized_at IS NOT NULL OR
    created_at > NOW() - INTERVAL '24 hours'
  )
);

-- Add missing columns if table already exists (for gradual schema evolution)
DO $$
BEGIN
  -- Add core columns first
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'profile_id') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'subscription_tier') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro'));
  END IF;

  -- Add columns from Phase 1A updates
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'intelligence_sharing') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN intelligence_sharing BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'reviewed') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN reviewed BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'ai_analysis') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN ai_analysis JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'pattern_extracted') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN pattern_extracted BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'anonymized_at') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN anonymized_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'expires_at') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days') NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'prompt_compressed') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN prompt_compressed BYTEA;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'detection_method') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN detection_method TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'ip_country') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN ip_country CHAR(2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'ip_is_proxy') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN ip_is_proxy BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'ip_is_hosting') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN ip_is_hosting BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'ip_isp') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN ip_isp TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'session_metadata') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN session_metadata JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'user_agent_category') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN user_agent_category TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threat_intelligence_samples' AND column_name = 'request_timing_pattern') THEN
    ALTER TABLE threat_intelligence_samples ADD COLUMN request_timing_pattern TEXT;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_threat_samples_unreviewed
  ON threat_intelligence_samples(reviewed, created_at)
  WHERE reviewed = FALSE;

CREATE INDEX IF NOT EXISTS idx_threat_samples_ip_hash
  ON threat_intelligence_samples(ip_hash, created_at);

CREATE INDEX IF NOT EXISTS idx_threat_samples_attacks
  ON threat_intelligence_samples USING GIN(attack_vectors);

CREATE INDEX IF NOT EXISTS idx_threat_samples_sharing
  ON threat_intelligence_samples(intelligence_sharing, created_at);

CREATE INDEX IF NOT EXISTS idx_threat_samples_severity
  ON threat_intelligence_samples(threat_severity, created_at);

CREATE INDEX IF NOT EXISTS idx_threat_samples_anonymization
  ON threat_intelligence_samples(anonymized_at, created_at)
  WHERE anonymized_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_threat_samples_profile
  ON threat_intelligence_samples(profile_id, created_at);

-- Table comments
COMMENT ON TABLE threat_intelligence_samples IS 'Stores validation data for threat intelligence analysis - anonymizes after 24 hours';
COMMENT ON COLUMN threat_intelligence_samples.prompt_text IS 'Full prompt text - DELETED after 24 hours (PII)';
COMMENT ON COLUMN threat_intelligence_samples.prompt_hash IS 'SHA256 hash of prompt - permanent identifier';
COMMENT ON COLUMN threat_intelligence_samples.client_ip IS 'Full IP address - DELETED after 24 hours (PII)';
COMMENT ON COLUMN threat_intelligence_samples.ip_hash IS 'SHA256 hash of IP - permanent tracking without PII';
COMMENT ON COLUMN threat_intelligence_samples.intelligence_sharing IS 'User consent for intelligence collection';

-- ====================
-- IP REPUTATION DATABASE
-- ====================
-- Hash-based IP reputation (cannot reverse to identify individuals)
-- Updated hourly from threat intelligence samples

CREATE TABLE IF NOT EXISTS ip_reputation (
  ip_hash TEXT PRIMARY KEY,  -- SHA256(ip) - cannot reverse

  -- REPUTATION METRICS (auto-calculated)
  total_requests INTEGER DEFAULT 0 CHECK (total_requests >= 0),
  blocked_requests INTEGER DEFAULT 0 CHECK (blocked_requests >= 0),
  block_rate DECIMAL(5,4) CHECK (block_rate >= 0 AND block_rate <= 1),

  -- ATTACK PROFILE
  attack_types TEXT[],  -- Most common attack vectors
  severity_avg DECIMAL(3,2) CHECK (severity_avg >= 0 AND severity_avg <= 10),
  confidence_avg DECIMAL(3,2) CHECK (confidence_avg >= 0 AND confidence_avg <= 1),

  -- GEOLOCATION (not PII - cannot identify individual)
  country_code CHAR(2),
  is_proxy BOOLEAN DEFAULT FALSE,
  is_vpn BOOLEAN DEFAULT FALSE,
  is_hosting BOOLEAN DEFAULT FALSE,
  isp TEXT,

  -- TEMPORAL TRACKING
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_attack TIMESTAMP WITH TIME ZONE,

  -- REPUTATION SCORE (0.0 = clean, 1.0 = confirmed attacker)
  reputation_score DECIMAL(3,2) DEFAULT 0.0 CHECK (reputation_score >= 0 AND reputation_score <= 1),
  auto_block BOOLEAN DEFAULT FALSE,  -- High-confidence bad actor flag

  -- METADATA
  sample_count INTEGER DEFAULT 1 CHECK (sample_count > 0),  -- Number of samples contributing
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for IP reputation lookups
CREATE INDEX IF NOT EXISTS idx_ip_reputation_score
  ON ip_reputation(reputation_score DESC);

CREATE INDEX IF NOT EXISTS idx_ip_reputation_autoblock
  ON ip_reputation(auto_block)
  WHERE auto_block = TRUE;

CREATE INDEX IF NOT EXISTS idx_ip_reputation_country
  ON ip_reputation(country_code);

CREATE INDEX IF NOT EXISTS idx_ip_reputation_last_seen
  ON ip_reputation(last_seen DESC);

-- Table comments
COMMENT ON TABLE ip_reputation IS 'Hash-based IP reputation database - cannot identify individuals';
COMMENT ON COLUMN ip_reputation.ip_hash IS 'SHA256(ip) - one-way hash, cannot reverse';
COMMENT ON COLUMN ip_reputation.reputation_score IS '0.0 = clean, 1.0 = confirmed attacker';
COMMENT ON COLUMN ip_reputation.auto_block IS 'Block automatically if enabled by user';

-- ====================
-- IP ALLOWLIST (TESTING & CI/CD)
-- ====================
-- IPs that should NEVER be blocked (test suites, CI/CD, internal systems)

CREATE TABLE IF NOT EXISTS ip_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- IP SPECIFICATION
  ip_address INET UNIQUE NOT NULL,  -- Full IP or CIDR range
  ip_hash TEXT UNIQUE NOT NULL,  -- SHA256(ip) for fast lookup

  -- ALLOWLIST METADATA
  description TEXT NOT NULL,  -- e.g., 'GitHub Actions CI/CD', 'Internal test server'
  purpose TEXT NOT NULL CHECK (purpose IN ('testing', 'ci_cd', 'internal', 'monitoring', 'admin')),

  -- MANAGEMENT
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- Admin who added it
  expires_at TIMESTAMP WITH TIME ZONE,  -- Optional expiration
  active BOOLEAN DEFAULT TRUE NOT NULL,

  -- AUDIT
  last_used TIMESTAMP WITH TIME ZONE,  -- Last time this IP was checked
  use_count INTEGER DEFAULT 0 CHECK (use_count >= 0)
);

-- Indexes for fast allowlist lookup
CREATE INDEX IF NOT EXISTS idx_ip_allowlist_hash
  ON ip_allowlist(ip_hash)
  WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_ip_allowlist_active
  ON ip_allowlist(active, ip_address);

CREATE INDEX IF NOT EXISTS idx_ip_allowlist_purpose
  ON ip_allowlist(purpose);

-- Table comments
COMMENT ON TABLE ip_allowlist IS 'IPs that should never be blocked (testing, CI/CD, internal)';
COMMENT ON COLUMN ip_allowlist.ip_hash IS 'SHA256(ip) for fast lookup without exposing IP';
COMMENT ON COLUMN ip_allowlist.purpose IS 'Why this IP is allowlisted';

-- ====================
-- ANONYMIZATION FUNCTION
-- ====================
-- Deletes PII after 24 hours (GDPR/CCPA compliance)

CREATE OR REPLACE FUNCTION anonymize_threat_samples()
RETURNS INTEGER AS $$
DECLARE
  rows_anonymized INTEGER;
BEGIN
  UPDATE threat_intelligence_samples
  SET
    prompt_text = NULL,
    prompt_compressed = NULL,
    client_ip = NULL,
    anonymized_at = NOW()
  WHERE
    anonymized_at IS NULL
    AND created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS rows_anonymized = ROW_COUNT;

  RETURN rows_anonymized;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION anonymize_threat_samples IS 'Removes PII from samples older than 24 hours (runs hourly)';

-- ====================
-- CLEANUP FUNCTION (90-day retention)
-- ====================

CREATE OR REPLACE FUNCTION cleanup_expired_threat_samples()
RETURNS INTEGER AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM threat_intelligence_samples
  WHERE expires_at < NOW();

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;

  RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_threat_samples IS 'Deletes samples older than 90 days (runs daily)';

-- ====================
-- RLS POLICIES
-- ====================

ALTER TABLE threat_intelligence_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_allowlist ENABLE ROW LEVEL SECURITY;

-- Users can only access their own samples
DROP POLICY IF EXISTS threat_samples_select_own ON threat_intelligence_samples;
CREATE POLICY threat_samples_select_own ON threat_intelligence_samples
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Internal/admin can access all samples
DROP POLICY IF EXISTS threat_samples_internal_access ON threat_intelligence_samples;
CREATE POLICY threat_samples_internal_access ON threat_intelligence_samples
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND tier = 'internal'
    )
  );

-- IP reputation is read-only for authenticated users
DROP POLICY IF EXISTS ip_reputation_select_all ON ip_reputation;
CREATE POLICY ip_reputation_select_all ON ip_reputation
  FOR SELECT
  TO authenticated
  USING (true);

-- Only internal/admin can modify IP reputation
DROP POLICY IF EXISTS ip_reputation_modify_internal ON ip_reputation;
CREATE POLICY ip_reputation_modify_internal ON ip_reputation
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND tier = 'internal'
    )
  );

-- Only admin can manage allowlist
DROP POLICY IF EXISTS ip_allowlist_admin_only ON ip_allowlist;
CREATE POLICY ip_allowlist_admin_only ON ip_allowlist
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND tier = 'internal'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON threat_intelligence_samples TO authenticated;
GRANT SELECT ON ip_reputation TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ip_reputation TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ip_allowlist TO service_role;
GRANT EXECUTE ON FUNCTION anonymize_threat_samples() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_threat_samples() TO service_role;
