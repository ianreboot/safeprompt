-- Session storage for multi-turn attack detection
-- Quarter 1 Phase 1 Task 1.1
-- Created: 2025-10-06

-- Create validation_sessions table
CREATE TABLE IF NOT EXISTS validation_sessions (
  -- Primary key: cryptographic session token
  session_token TEXT PRIMARY KEY,

  -- User association (optional - can validate without user account)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours') NOT NULL,  -- REDUCED from 24h

  -- Session data (MINIMAL for multi-turn detection only)
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  flags JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata for analysis (ANONYMIZED)
  ip_fingerprint TEXT,  -- SHA256(ip + daily_salt) - changes daily, cannot reverse
  user_agent_fingerprint TEXT,  -- Hash only, not full UA
  request_count INTEGER DEFAULT 0 NOT NULL,

  -- Constraints
  CONSTRAINT history_is_array CHECK (jsonb_typeof(history) = 'array'),
  CONSTRAINT flags_is_object CHECK (jsonb_typeof(flags) = 'object'),
  CONSTRAINT reasonable_request_count CHECK (request_count >= 0 AND request_count <= 10000),
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON validation_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON validation_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON validation_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON validation_sessions(created_at);

-- Auto-cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM validation_sessions
  WHERE expires_at < NOW()
     OR created_at < NOW() - INTERVAL '2 hours';  -- Hard limit: delete after 2h regardless

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;

  RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (runs every hour via pg_cron or external scheduler)
-- Note: Actual scheduling should be configured in Supabase dashboard or via cron job

-- Table comments
COMMENT ON TABLE validation_sessions IS 'Stores validation history for multi-turn attack detection';
COMMENT ON COLUMN validation_sessions.session_token IS 'Cryptographic token identifying the validation session';
COMMENT ON COLUMN validation_sessions.history IS 'Array of validation events: [{prompt, result, timestamp, threats, confidence}]';
COMMENT ON COLUMN validation_sessions.flags IS 'Detected suspicious patterns: {context_priming: bool, ticket_fabrication: bool, rag_poisoning_attempt: bool}';
COMMENT ON COLUMN validation_sessions.request_count IS 'Number of validations in this session (rate limiting)';

-- RLS policies
ALTER TABLE validation_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY sessions_select_own ON validation_sessions
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Internal system can access all sessions (for API validation)
CREATE POLICY sessions_internal_access ON validation_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND tier = 'internal'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON validation_sessions TO authenticated;
GRANT SELECT ON validation_sessions TO anon;
