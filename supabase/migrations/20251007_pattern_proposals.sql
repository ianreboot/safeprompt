-- Phase 6.2: Pattern Discovery Pipeline
-- Create tables for pattern proposals, attack campaigns, and honeypot requests

-- ============================================================================
-- TABLE: pattern_proposals
-- Stores AI-discovered patterns for admin review and approval
-- ============================================================================

CREATE TABLE IF NOT EXISTS pattern_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern details
  proposed_pattern TEXT NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('substring', 'encoding', 'regex', 'ai_proposed')),
  reasoning TEXT NOT NULL,

  -- Frequency data
  frequency_count INTEGER NOT NULL DEFAULT 0,
  example_matches JSONB NOT NULL DEFAULT '{}',

  -- Review workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deployed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,

  -- Deployment tracking
  deployed_to_production BOOLEAN NOT NULL DEFAULT FALSE,
  deployed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pattern_proposals
CREATE INDEX idx_pattern_proposals_status ON pattern_proposals(status);
CREATE INDEX idx_pattern_proposals_reviewed_at ON pattern_proposals(reviewed_at);
CREATE INDEX idx_pattern_proposals_created_at ON pattern_proposals(created_at);
CREATE INDEX idx_pattern_proposals_pattern_type ON pattern_proposals(pattern_type);

-- Updated_at trigger for pattern_proposals
CREATE OR REPLACE FUNCTION update_pattern_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pattern_proposals_updated_at
  BEFORE UPDATE ON pattern_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_proposals_updated_at();

-- RLS policies for pattern_proposals (admin-only access)
ALTER TABLE pattern_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY pattern_proposals_admin_all ON pattern_proposals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'ian.ho@rebootmedia.net'
    )
  );

-- ============================================================================
-- TABLE: attack_campaigns
-- Tracks coordinated attacks (multiple IPs, same technique, short timeframe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS attack_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Detection metadata
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Campaign characteristics
  request_count INTEGER NOT NULL DEFAULT 0,
  unique_ips INTEGER NOT NULL DEFAULT 0,
  pattern_type TEXT,
  similarity_score REAL CHECK (similarity_score >= 0 AND similarity_score <= 1),

  -- Response tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'false_positive')),
  response_action TEXT,
  notes TEXT,

  -- Admin review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for attack_campaigns
CREATE INDEX idx_attack_campaigns_detected_at ON attack_campaigns(detected_at);
CREATE INDEX idx_attack_campaigns_status ON attack_campaigns(status);
CREATE INDEX idx_attack_campaigns_window_start ON attack_campaigns(window_start);

-- Updated_at trigger for attack_campaigns
CREATE OR REPLACE FUNCTION update_attack_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attack_campaigns_updated_at
  BEFORE UPDATE ON attack_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_attack_campaigns_updated_at();

-- RLS policies for attack_campaigns (admin-only access)
ALTER TABLE attack_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY attack_campaigns_admin_all ON attack_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'ian.ho@rebootmedia.net'
    )
  );

-- ============================================================================
-- TABLE: honeypot_requests
-- Logs requests to fake endpoints for attack learning
-- ============================================================================

CREATE TABLE IF NOT EXISTS honeypot_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request details
  endpoint TEXT NOT NULL,
  full_request JSONB NOT NULL DEFAULT '{}',

  -- Source tracking
  ip_hash TEXT NOT NULL,
  user_agent TEXT,

  -- Pattern analysis
  detected_patterns TEXT[] DEFAULT '{}',
  auto_deployed BOOLEAN NOT NULL DEFAULT FALSE,
  deployed_pattern_id UUID REFERENCES pattern_proposals(id),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for honeypot_requests
CREATE INDEX idx_honeypot_requests_created_at ON honeypot_requests(created_at);
CREATE INDEX idx_honeypot_requests_endpoint ON honeypot_requests(endpoint);
CREATE INDEX idx_honeypot_requests_auto_deployed ON honeypot_requests(auto_deployed);
CREATE INDEX idx_honeypot_requests_ip_hash ON honeypot_requests(ip_hash);

-- RLS policies for honeypot_requests (admin-only access)
ALTER TABLE honeypot_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY honeypot_requests_admin_all ON honeypot_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'ian.ho@rebootmedia.net'
    )
  );

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Function to cleanup old honeypot requests (>90 days)
CREATE OR REPLACE FUNCTION cleanup_honeypot_requests()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM honeypot_requests
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_honeypot_requests() TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE pattern_proposals IS 'AI-discovered attack patterns awaiting admin review and approval';
COMMENT ON TABLE attack_campaigns IS 'Coordinated attack campaigns detected across multiple IPs';
COMMENT ON TABLE honeypot_requests IS 'Requests to fake endpoints for attack pattern learning';

COMMENT ON COLUMN pattern_proposals.proposed_pattern IS 'The pattern to add to validation (substring, regex, or encoding type)';
COMMENT ON COLUMN pattern_proposals.frequency_count IS 'Number of times this pattern appeared in analyzed samples';
COMMENT ON COLUMN pattern_proposals.status IS 'pending=awaiting review, approved=ready to deploy, rejected=not useful, deployed=live in production';

COMMENT ON COLUMN attack_campaigns.similarity_score IS 'Levenshtein or cosine similarity between requests (0-1)';
COMMENT ON COLUMN attack_campaigns.response_action IS 'Action taken: blocked_ips, added_pattern, investigated, etc.';

COMMENT ON COLUMN honeypot_requests.auto_deployed IS 'Whether pattern from this request was automatically deployed (honeypot-only auto-learning)';
