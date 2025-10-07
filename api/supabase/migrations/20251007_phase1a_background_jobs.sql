-- Phase 1A Background Jobs (Cron Functions)
-- These functions are called by pg_cron or can be triggered manually

-- ============================================================================
-- JOB 1: Session Cleanup (Delete sessions older than 2 hours)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS TABLE(sessions_deleted INTEGER) AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete sessions older than 2 hours
  DELETE FROM validation_sessions
  WHERE last_activity < NOW() - INTERVAL '2 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN QUERY SELECT deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_sessions IS
'Deletes validation sessions older than 2 hours. Run hourly via pg_cron.';


-- ============================================================================
-- JOB 2: Sample Anonymization (Remove PII after 24 hours)
-- ============================================================================
CREATE OR REPLACE FUNCTION anonymize_old_intelligence_samples()
RETURNS TABLE(samples_anonymized INTEGER) AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Anonymize samples older than 24 hours by:
  -- 1. Setting prompt_text to NULL
  -- 2. Setting ip_address to NULL (if column exists)
  -- 3. Keeping prompt_hash and ip_hash for pattern matching
  -- 4. Setting anonymized_at timestamp
  UPDATE intelligence_samples
  SET
    prompt_text = NULL,
    anonymized_at = NOW()
  WHERE
    created_at < NOW() - INTERVAL '24 hours'
    AND anonymized_at IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN QUERY SELECT updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION anonymize_old_intelligence_samples IS
'Anonymizes intelligence samples older than 24 hours by removing PII. Run hourly via pg_cron.';


-- ============================================================================
-- JOB 3: IP Reputation Update (Recalculate scores from samples)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_ip_reputation_scores()
RETURNS TABLE(ips_updated INTEGER) AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update reputation scores and auto_block flags based on recent activity
  UPDATE ip_reputation
  SET
    reputation_score = 1 - (blocked_samples::numeric / GREATEST(total_samples, 1)::numeric),
    auto_block = (
      -- Auto-block if: block_rate > 70% AND at least 10 samples
      (blocked_samples::numeric / GREATEST(total_samples, 1)::numeric) > 0.7
      AND total_samples >= 10
    ),
    last_seen = NOW()
  WHERE
    last_seen > NOW() - INTERVAL '7 days'; -- Only update recently active IPs

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN QUERY SELECT updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_ip_reputation_scores IS
'Recalculates IP reputation scores and auto_block flags. Run hourly via pg_cron.';


-- ============================================================================
-- JOB 4: Intelligence Metrics Snapshot (for analytics)
-- ============================================================================
CREATE OR REPLACE FUNCTION capture_intelligence_metrics()
RETURNS TABLE(
  active_samples INTEGER,
  anonymized_samples INTEGER,
  tracked_ips INTEGER,
  blocked_ips INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM intelligence_samples WHERE anonymized_at IS NULL) as active_samples,
    (SELECT COUNT(*)::INTEGER FROM intelligence_samples WHERE anonymized_at IS NOT NULL) as anonymized_samples,
    (SELECT COUNT(*)::INTEGER FROM ip_reputation) as tracked_ips,
    (SELECT COUNT(*)::INTEGER FROM ip_reputation WHERE auto_block = true) as blocked_ips;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION capture_intelligence_metrics IS
'Captures current intelligence system metrics for monitoring dashboards.';


-- ============================================================================
-- MANUAL TRIGGER FUNCTIONS (for admin panel)
-- ============================================================================

-- Force immediate anonymization (admin triggered)
CREATE OR REPLACE FUNCTION force_anonymize_all_eligible()
RETURNS TABLE(samples_anonymized INTEGER) AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Anonymize ALL samples older than 24 hours, even if anonymized_at was set
  UPDATE intelligence_samples
  SET
    prompt_text = NULL,
    anonymized_at = COALESCE(anonymized_at, NOW())
  WHERE
    created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN QUERY SELECT updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION force_anonymize_all_eligible IS
'Manually triggered function to force anonymization of all eligible samples.';


-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users (for manual triggers via API)
GRANT EXECUTE ON FUNCTION cleanup_old_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION anonymize_old_intelligence_samples TO authenticated;
GRANT EXECUTE ON FUNCTION update_ip_reputation_scores TO authenticated;
GRANT EXECUTE ON FUNCTION capture_intelligence_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION force_anonymize_all_eligible TO authenticated;

-- Grant to service role for cron jobs
GRANT EXECUTE ON FUNCTION cleanup_old_sessions TO service_role;
GRANT EXECUTE ON FUNCTION anonymize_old_intelligence_samples TO service_role;
GRANT EXECUTE ON FUNCTION update_ip_reputation_scores TO service_role;
GRANT EXECUTE ON FUNCTION capture_intelligence_metrics TO service_role;


-- ============================================================================
-- CRON SCHEDULING (pg_cron extension required)
-- ============================================================================

-- NOTE: These cron jobs need to be set up via Supabase Dashboard or SQL Editor
-- as they require superuser privileges

-- Example cron job setup (run in Supabase SQL Editor as admin):
/*

-- Enable pg_cron extension (one-time, requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule session cleanup (every hour)
SELECT cron.schedule(
  'cleanup-old-sessions',
  '0 * * * *', -- Every hour at :00
  $$SELECT cleanup_old_sessions()$$
);

-- Schedule sample anonymization (every hour, offset by 15 minutes)
SELECT cron.schedule(
  'anonymize-old-samples',
  '15 * * * *', -- Every hour at :15
  $$SELECT anonymize_old_intelligence_samples()$$
);

-- Schedule IP reputation updates (every hour, offset by 30 minutes)
SELECT cron.schedule(
  'update-ip-reputation',
  '30 * * * *', -- Every hour at :30
  $$SELECT update_ip_reputation_scores()$$
);

-- Schedule metrics capture (every 6 hours)
SELECT cron.schedule(
  'capture-intelligence-metrics',
  '0 */6 * * *', -- Every 6 hours
  $$SELECT capture_intelligence_metrics()$$
);

-- View all scheduled jobs
SELECT * FROM cron.job;

-- Remove a job (if needed)
-- SELECT cron.unschedule('cleanup-old-sessions');

*/


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test cleanup function
-- SELECT * FROM cleanup_old_sessions();

-- Test anonymization function
-- SELECT * FROM anonymize_old_intelligence_samples();

-- Test IP reputation update
-- SELECT * FROM update_ip_reputation_scores();

-- Test metrics capture
-- SELECT * FROM capture_intelligence_metrics();

-- Check what would be anonymized (without running the function)
-- SELECT COUNT(*) as eligible_for_anonymization
-- FROM intelligence_samples
-- WHERE created_at < NOW() - INTERVAL '24 hours'
-- AND anonymized_at IS NULL;

-- Check what would be deleted (sessions)
-- SELECT COUNT(*) as eligible_for_deletion
-- FROM validation_sessions
-- WHERE last_activity < NOW() - INTERVAL '2 hours';
