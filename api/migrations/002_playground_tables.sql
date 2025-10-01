-- SafePrompt Playground Database Schema
-- Created: 2025-10-01
-- Purpose: Rate limiting, abuse detection, and usage tracking for playground

-- ============================================================
-- TABLE: playground_rate_limits
-- Purpose: Fast rate limit checks with IP hashing
-- ============================================================
CREATE TABLE IF NOT EXISTS playground_rate_limits (
  ip_hash text PRIMARY KEY,

  -- Request counters
  minute_count integer DEFAULT 0,
  hour_count integer DEFAULT 0,
  day_count integer DEFAULT 0,

  -- Timestamps for reset windows
  minute_reset_at timestamptz DEFAULT now(),
  hour_reset_at timestamptz DEFAULT now(),
  day_reset_at timestamptz DEFAULT now(),

  -- Abuse tracking
  abuse_score integer DEFAULT 0,
  permanent_ban boolean DEFAULT false,
  ban_reason text,

  -- Metadata
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  total_requests integer DEFAULT 0,

  updated_at timestamptz DEFAULT now()
);

-- Index for cleanup queries (remove old entries)
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_seen
  ON playground_rate_limits(last_seen);

-- Index for abuse monitoring
CREATE INDEX IF NOT EXISTS idx_rate_limits_abuse
  ON playground_rate_limits(abuse_score)
  WHERE abuse_score > 25;

-- ============================================================
-- TABLE: playground_requests
-- Purpose: Detailed logging for abuse detection and analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS playground_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request identification (hashed for privacy)
  ip_hash text NOT NULL,
  session_id text, -- Client-side session tracking (optional)

  -- Request details
  test_id text, -- NULL for custom prompts
  prompt_hash text NOT NULL, -- SHA-256 of prompt (for deduplication)
  prompt_length integer NOT NULL,

  -- Results
  protected_result jsonb, -- SafePrompt validation result
  unprotected_result jsonb, -- Unprotected AI result (sanitized)

  -- Performance
  response_time_ms integer,

  -- Abuse signals
  abuse_score integer DEFAULT 0,
  abuse_signals text[], -- Array of triggered signals

  -- Metadata
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Index for IP-based queries (abuse detection)
CREATE INDEX IF NOT EXISTS idx_requests_ip_created
  ON playground_requests(ip_hash, created_at DESC);

-- Index for abuse monitoring
CREATE INDEX IF NOT EXISTS idx_requests_abuse
  ON playground_requests(abuse_score, created_at DESC)
  WHERE abuse_score > 0;

-- Index for test analytics
CREATE INDEX IF NOT EXISTS idx_requests_test_id
  ON playground_requests(test_id, created_at DESC)
  WHERE test_id IS NOT NULL;

-- Index for time-based cleanup
CREATE INDEX IF NOT EXISTS idx_requests_created
  ON playground_requests(created_at DESC);

-- ============================================================
-- TABLE: playground_analytics
-- Purpose: Aggregated stats (optional - for dashboard)
-- ============================================================
CREATE TABLE IF NOT EXISTS playground_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,

  -- Usage stats
  total_requests integer DEFAULT 0,
  unique_ips integer DEFAULT 0,

  -- Test distribution
  gallery_requests integer DEFAULT 0, -- Pre-selected tests
  custom_requests integer DEFAULT 0,  -- User's own prompts

  -- Results
  attacks_detected integer DEFAULT 0,
  legitimate_allowed integer DEFAULT 0,

  -- Performance
  avg_response_time_ms integer,

  -- Abuse
  abuse_incidents integer DEFAULT 0,
  bans_issued integer DEFAULT 0,

  -- Cost tracking
  estimated_cost_usd decimal(10,4) DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_analytics_date
  ON playground_analytics(date DESC);

-- ============================================================
-- FUNCTION: Clean up old data (GDPR compliance)
-- Purpose: Auto-delete logs older than 7 days
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_playground_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete requests older than 7 days
  DELETE FROM playground_requests
  WHERE created_at < now() - interval '7 days';

  -- Delete rate limits for IPs not seen in 30 days
  DELETE FROM playground_rate_limits
  WHERE last_seen < now() - interval '30 days'
    AND permanent_ban = false;

  RAISE NOTICE 'Playground data cleanup completed';
END;
$$;

-- ============================================================
-- FUNCTION: Update rate limit counters
-- Purpose: Increment counters and reset windows as needed
-- ============================================================
CREATE OR REPLACE FUNCTION update_rate_limit(
  p_ip_hash text,
  p_abuse_score_delta integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_record playground_rate_limits;
  v_now timestamptz := now();
  v_allowed boolean := true;
  v_reason text := NULL;
BEGIN
  -- Get or create rate limit record
  INSERT INTO playground_rate_limits (ip_hash)
  VALUES (p_ip_hash)
  ON CONFLICT (ip_hash) DO NOTHING;

  SELECT * INTO v_record
  FROM playground_rate_limits
  WHERE ip_hash = p_ip_hash;

  -- Check for permanent ban
  IF v_record.permanent_ban THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'permanent_ban',
      'ban_reason', v_record.ban_reason
    );
  END IF;

  -- Reset windows if needed
  IF v_now > v_record.minute_reset_at THEN
    UPDATE playground_rate_limits
    SET minute_count = 0,
        minute_reset_at = v_now + interval '1 minute'
    WHERE ip_hash = p_ip_hash;
    v_record.minute_count := 0;
  END IF;

  IF v_now > v_record.hour_reset_at THEN
    UPDATE playground_rate_limits
    SET hour_count = 0,
        hour_reset_at = v_now + interval '1 hour'
    WHERE ip_hash = p_ip_hash;
    v_record.hour_count := 0;
  END IF;

  IF v_now > v_record.day_reset_at THEN
    UPDATE playground_rate_limits
    SET day_count = 0,
        day_reset_at = v_now + interval '1 day'
    WHERE ip_hash = p_ip_hash;
    v_record.day_count := 0;
  END IF;

  -- Check limits (5/min, 20/hour, 50/day)
  IF v_record.minute_count >= 5 THEN
    v_allowed := false;
    v_reason := 'minute_limit';
  ELSIF v_record.hour_count >= 20 THEN
    v_allowed := false;
    v_reason := 'hour_limit';
  ELSIF v_record.day_count >= 50 THEN
    v_allowed := false;
    v_reason := 'day_limit';
  END IF;

  -- Update counters if allowed
  IF v_allowed THEN
    UPDATE playground_rate_limits
    SET minute_count = minute_count + 1,
        hour_count = hour_count + 1,
        day_count = day_count + 1,
        total_requests = total_requests + 1,
        last_seen = v_now,
        abuse_score = GREATEST(0, abuse_score + p_abuse_score_delta),
        updated_at = v_now
    WHERE ip_hash = p_ip_hash;

    -- Check if abuse score triggers ban
    IF (v_record.abuse_score + p_abuse_score_delta) >= 100 THEN
      UPDATE playground_rate_limits
      SET permanent_ban = true,
          ban_reason = 'Abuse score exceeded 100'
      WHERE ip_hash = p_ip_hash;

      v_allowed := false;
      v_reason := 'abuse_ban';
    END IF;
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'reason', v_reason,
    'limits', jsonb_build_object(
      'minute', jsonb_build_object('count', v_record.minute_count, 'max', 5),
      'hour', jsonb_build_object('count', v_record.hour_count, 'max', 20),
      'day', jsonb_build_object('count', v_record.day_count, 'max', 50)
    ),
    'abuse_score', v_record.abuse_score + p_abuse_score_delta
  );
END;
$$;

-- ============================================================
-- RLS (Row Level Security) - Enable for security
-- ============================================================
ALTER TABLE playground_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE playground_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (API uses service role key)
CREATE POLICY "Service role full access on rate_limits"
  ON playground_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on requests"
  ON playground_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on analytics"
  ON playground_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- GRANT permissions to service role
-- ============================================================
GRANT ALL ON playground_rate_limits TO service_role;
GRANT ALL ON playground_requests TO service_role;
GRANT ALL ON playground_analytics TO service_role;

GRANT EXECUTE ON FUNCTION cleanup_playground_data() TO service_role;
GRANT EXECUTE ON FUNCTION update_rate_limit(text, integer) TO service_role;

-- ============================================================
-- COMMENTS (Documentation)
-- ============================================================
COMMENT ON TABLE playground_rate_limits IS 'Rate limiting and abuse tracking for playground requests';
COMMENT ON TABLE playground_requests IS 'Detailed logging of all playground requests (7-day retention)';
COMMENT ON TABLE playground_analytics IS 'Aggregated daily statistics for playground usage';

COMMENT ON FUNCTION cleanup_playground_data() IS 'Deletes playground data older than retention period (GDPR compliance)';
COMMENT ON FUNCTION update_rate_limit(text, integer) IS 'Atomically updates rate limit counters and checks limits';

-- ============================================================
-- DONE
-- ============================================================
-- Migration complete. Tables created with:
-- - Rate limiting (5/min, 20/hour, 50/day)
-- - Abuse detection (score-based banning)
-- - Privacy compliance (IP hashing, 7-day retention)
-- - Analytics aggregation
-- - RLS enabled for security
