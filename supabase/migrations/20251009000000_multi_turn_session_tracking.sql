-- Multi-Turn Attack Detection: Session Tracking Infrastructure
-- Purpose: Track consecutive validation requests to detect multi-turn attack patterns
-- Created: 2025-10-09

-- Clean up existing objects first
DROP TABLE IF EXISTS session_attack_patterns CASCADE;
DROP TABLE IF EXISTS session_requests CASCADE;
DROP TABLE IF EXISTS validation_sessions CASCADE;
DROP FUNCTION IF EXISTS update_session_activity() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS calculate_session_risk_score(UUID) CASCADE;
DROP FUNCTION IF EXISTS detect_multiturn_patterns(UUID) CASCADE;

-- ============================================================
-- TABLE: validation_sessions
-- Tracks user sessions across multiple validation requests
-- ============================================================
CREATE TABLE validation_sessions (
  -- Primary identification
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User tracking (nullable for anonymous requests)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Device/client identification
  client_ip_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of IP address
  device_fingerprint JSONB NOT NULL,   -- Browser/device characteristics

  -- Session metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Request tracking
  request_count INTEGER DEFAULT 0,

  -- Risk analysis
  escalation_pattern TEXT[], -- Track progression: ['safe', 'safe', 'medium', 'attack']
  risk_score FLOAT DEFAULT 0.0, -- Cumulative risk score across session
  max_risk_level TEXT DEFAULT 'safe', -- Highest risk level seen

  -- Attack detection flags
  suspected_reconnaissance BOOLEAN DEFAULT FALSE,
  suspected_context_building BOOLEAN DEFAULT FALSE,
  suspected_gradual_escalation BOOLEAN DEFAULT FALSE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  blocked_at TIMESTAMP WITH TIME ZONE,
  blocked_reason TEXT
);

-- Indexes for performance
CREATE INDEX idx_sessions_client_ip ON validation_sessions(client_ip_hash);
CREATE INDEX idx_sessions_user_id ON validation_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_sessions_active ON validation_sessions(is_active, last_activity) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_risk ON validation_sessions(risk_score DESC) WHERE risk_score > 0.5;

-- ============================================================
-- TABLE: session_requests
-- Individual validation requests within a session
-- ============================================================
CREATE TABLE session_requests (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES validation_sessions(session_id) ON DELETE CASCADE,

  -- Request data
  prompt_text TEXT NOT NULL,
  prompt_hash VARCHAR(64) NOT NULL, -- SHA-256 for duplicate detection

  -- Validation results
  validation_result JSONB NOT NULL, -- Full validator response
  is_safe BOOLEAN NOT NULL,
  confidence FLOAT NOT NULL,
  threats TEXT[],
  stage TEXT, -- Which validation stage caught it

  -- Request metadata
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sequence_number INTEGER NOT NULL, -- Order within session

  -- Pattern detection
  risk_level TEXT NOT NULL, -- 'safe', 'low', 'medium', 'high'
  attack_indicators TEXT[], -- Specific patterns detected
  business_signals TEXT[], -- Legitimate business indicators

  -- Context analysis
  references_previous_requests BOOLEAN DEFAULT FALSE,
  builds_fake_context BOOLEAN DEFAULT FALSE,
  claims_authorization BOOLEAN DEFAULT FALSE,

  CONSTRAINT valid_risk_level CHECK (risk_level IN ('safe', 'low', 'medium', 'high'))
);

-- Indexes for performance
CREATE INDEX idx_requests_session ON session_requests(session_id, sequence_number);
CREATE INDEX idx_requests_timestamp ON session_requests(timestamp DESC);
CREATE INDEX idx_requests_unsafe ON session_requests(session_id) WHERE is_safe = FALSE;
CREATE INDEX idx_requests_hash ON session_requests(prompt_hash);

-- ============================================================
-- TABLE: session_attack_patterns
-- Detected multi-turn attack patterns
-- ============================================================
CREATE TABLE session_attack_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES validation_sessions(session_id) ON DELETE CASCADE,

  -- Pattern identification
  pattern_type TEXT NOT NULL, -- 'sudden_escalation', 'context_priming', 'reconnaissance', etc.
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Pattern details
  request_sequence INTEGER[], -- Sequence numbers involved in pattern
  pattern_description TEXT NOT NULL,
  confidence FLOAT NOT NULL,

  -- Evidence
  evidence JSONB NOT NULL, -- Supporting data for pattern detection

  -- Action taken
  action_taken TEXT NOT NULL, -- 'blocked', 'flagged', 'logged'

  CONSTRAINT valid_pattern_type CHECK (pattern_type IN (
    'sudden_escalation',
    'gradual_escalation',
    'context_priming',
    'fake_history_building',
    'reconnaissance_attack',
    'privilege_escalation',
    'social_engineering_chain',
    'rag_poisoning_sequence',
    'encoding_chain',
    'role_confusion'
  ))
);

CREATE INDEX idx_attack_patterns_session ON session_attack_patterns(session_id, detected_at);
CREATE INDEX idx_attack_patterns_type ON session_attack_patterns(pattern_type);

-- ============================================================
-- FUNCTION: Update session activity
-- Automatically update last_activity and request_count
-- ============================================================
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE validation_sessions
  SET
    last_activity = NOW(),
    request_count = request_count + 1,
    escalation_pattern = array_append(escalation_pattern, NEW.risk_level)
  WHERE session_id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_activity
  AFTER INSERT ON session_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- ============================================================
-- FUNCTION: Clean up expired sessions
-- Remove sessions older than 24 hours
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM validation_sessions
  WHERE expires_at < NOW()
  RETURNING COUNT(*) INTO deleted_count;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Calculate session risk score
-- Analyze escalation pattern and update risk score
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_session_risk_score(p_session_id UUID)
RETURNS FLOAT AS $$
DECLARE
  v_pattern TEXT[];
  v_risk_score FLOAT := 0.0;
  v_recent_unsafe INTEGER;
  v_total_requests INTEGER;
BEGIN
  -- Get session data
  SELECT
    escalation_pattern,
    request_count
  INTO v_pattern, v_total_requests
  FROM validation_sessions
  WHERE session_id = p_session_id;

  -- Count unsafe requests in last 5 requests
  SELECT COUNT(*)
  INTO v_recent_unsafe
  FROM session_requests
  WHERE session_id = p_session_id
    AND is_safe = FALSE
    AND sequence_number > GREATEST(0, v_total_requests - 5);

  -- Base risk: percentage of unsafe requests
  v_risk_score := v_recent_unsafe::FLOAT / LEAST(5, v_total_requests);

  -- Escalation detection: sudden jump from safe to unsafe
  IF array_length(v_pattern, 1) >= 3 THEN
    -- Last 3 requests: [safe, safe, high] = sudden escalation (+0.3)
    IF v_pattern[array_length(v_pattern, 1)] = 'high'
       AND v_pattern[array_length(v_pattern, 1) - 1] = 'safe'
       AND v_pattern[array_length(v_pattern, 1) - 2] = 'safe' THEN
      v_risk_score := v_risk_score + 0.3;
    END IF;
  END IF;

  -- Gradual escalation: safe → medium → high (+0.2)
  IF array_length(v_pattern, 1) >= 3 THEN
    IF v_pattern[array_length(v_pattern, 1)] = 'high'
       AND v_pattern[array_length(v_pattern, 1) - 1] = 'medium'
       AND v_pattern[array_length(v_pattern, 1) - 2] = 'safe' THEN
      v_risk_score := v_risk_score + 0.2;
    END IF;
  END IF;

  -- Cap at 1.0
  v_risk_score := LEAST(1.0, v_risk_score);

  -- Update session
  UPDATE validation_sessions
  SET
    risk_score = v_risk_score,
    max_risk_level = CASE
      WHEN v_risk_score >= 0.8 THEN 'high'
      WHEN v_risk_score >= 0.5 THEN 'medium'
      WHEN v_risk_score >= 0.3 THEN 'low'
      ELSE 'safe'
    END
  WHERE session_id = p_session_id;

  RETURN v_risk_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Detect multi-turn attack patterns
-- Analyze recent requests for attack patterns
-- ============================================================
CREATE OR REPLACE FUNCTION detect_multiturn_patterns(p_session_id UUID)
RETURNS TABLE(
  pattern_type TEXT,
  confidence FLOAT,
  description TEXT
) AS $$
DECLARE
  v_recent_requests RECORD;
  v_context_claims INTEGER := 0;
  v_pattern TEXT[];
BEGIN
  -- Get last 5 requests
  SELECT array_agg(risk_level ORDER BY sequence_number)
  INTO v_pattern
  FROM session_requests
  WHERE session_id = p_session_id
    AND sequence_number > (
      SELECT GREATEST(0, request_count - 5)
      FROM validation_sessions
      WHERE session_id = p_session_id
    );

  -- Pattern 1: Sudden Escalation (safe → safe → safe → attack)
  IF array_length(v_pattern, 1) >= 4
     AND v_pattern[array_length(v_pattern, 1)] = 'high'
     AND v_pattern[1] = 'safe'
     AND v_pattern[2] = 'safe'
     AND v_pattern[3] = 'safe' THEN
    RETURN QUERY SELECT
      'sudden_escalation'::TEXT,
      0.9::FLOAT,
      'Multiple safe requests followed by sudden attack - potential reconnaissance'::TEXT;
  END IF;

  -- Pattern 2: Context Building (count fake context claims)
  SELECT COUNT(*)
  INTO v_context_claims
  FROM session_requests
  WHERE session_id = p_session_id
    AND (builds_fake_context = TRUE OR claims_authorization = TRUE)
    AND sequence_number > (
      SELECT GREATEST(0, request_count - 5)
      FROM validation_sessions
      WHERE session_id = p_session_id
    );

  IF v_context_claims >= 2 THEN
    RETURN QUERY SELECT
      'fake_history_building'::TEXT,
      0.8::FLOAT,
      format('Repetitive context claims (%s times) across recent requests', v_context_claims)::TEXT;
  END IF;

  -- Pattern 3: Gradual Escalation (safe → medium → high)
  IF array_length(v_pattern, 1) >= 3
     AND v_pattern[array_length(v_pattern, 1)] = 'high'
     AND v_pattern[array_length(v_pattern, 1) - 1] = 'medium'
     AND v_pattern[array_length(v_pattern, 1) - 2] = 'safe' THEN
    RETURN QUERY SELECT
      'gradual_escalation'::TEXT,
      0.85::FLOAT,
      'Progressive risk increase from safe to high over multiple requests'::TEXT;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- RLS (Row Level Security) Policies
-- Enable RLS and create policies for security
-- ============================================================
ALTER TABLE validation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attack_patterns ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API)
CREATE POLICY service_role_all_validation_sessions ON validation_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all_session_requests ON session_requests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all_attack_patterns ON session_attack_patterns
  FOR ALL USING (auth.role() = 'service_role');

-- Allow users to see only their own sessions
CREATE POLICY users_own_sessions ON validation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY users_own_requests ON session_requests
  FOR SELECT USING (
    session_id IN (
      SELECT session_id FROM validation_sessions WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- COMMENTS for documentation
-- ============================================================
COMMENT ON TABLE validation_sessions IS 'Tracks user sessions across multiple validation requests for multi-turn attack detection';
COMMENT ON TABLE session_requests IS 'Individual validation requests within a session with full context';
COMMENT ON TABLE session_attack_patterns IS 'Detected multi-turn attack patterns across session requests';
COMMENT ON COLUMN validation_sessions.escalation_pattern IS 'Array tracking risk level progression: [safe, safe, medium, high]';
COMMENT ON COLUMN validation_sessions.device_fingerprint IS 'Browser/device characteristics for attack correlation';
COMMENT ON FUNCTION calculate_session_risk_score IS 'Analyzes escalation pattern and calculates cumulative risk score (0.0-1.0)';
COMMENT ON FUNCTION detect_multiturn_patterns IS 'Detects multi-turn attack patterns like sudden escalation, context building, gradual escalation';
