-- Intelligence Logging Table (Phase 1A Task 1A.61)
-- Tracks intelligence collection events for monitoring and analytics

CREATE TABLE IF NOT EXISTS intelligence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event metadata
  event_type TEXT NOT NULL, -- 'sample_stored', 'sample_anonymized', 'collection_skipped', 'collection_error'
  collection_result TEXT NOT NULL, -- 'success', 'skipped', 'error'
  skip_reason TEXT, -- 'ip_allowlisted', 'opt_out_or_safe', etc.

  -- User context
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subscription_tier TEXT,

  -- Request details
  prompt_length INTEGER,
  threat_severity TEXT, -- 'low', 'medium', 'high', 'critical'
  ip_hash TEXT, -- SHA-256 hash of IP address

  -- Anonymization tracking
  samples_anonymized INTEGER, -- For 'sample_anonymized' events

  -- Additional context
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_intelligence_logs_event_type ON intelligence_logs(event_type);
CREATE INDEX idx_intelligence_logs_created_at ON intelligence_logs(created_at);
CREATE INDEX idx_intelligence_logs_user_id ON intelligence_logs(user_id);
CREATE INDEX idx_intelligence_logs_collection_result ON intelligence_logs(collection_result);
CREATE INDEX idx_intelligence_logs_subscription_tier ON intelligence_logs(subscription_tier);

-- RLS Policies
ALTER TABLE intelligence_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all logs
CREATE POLICY "Admin full access to intelligence logs"
  ON intelligence_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.subscription_tier = 'internal'
    )
  );

-- Users can view their own logs
CREATE POLICY "Users can view own intelligence logs"
  ON intelligence_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can insert logs
CREATE POLICY "Service role can insert intelligence logs"
  ON intelligence_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON intelligence_logs TO authenticated;
GRANT INSERT ON intelligence_logs TO service_role;

COMMENT ON TABLE intelligence_logs IS 'Logs of intelligence collection events for monitoring and analytics (Phase 1A)';


-- ============================================================================
-- Job Metrics Table (Phase 1A Tasks 1A.62-1A.63)
-- Tracks background job execution metrics for monitoring and alerting
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job identification
  job_name TEXT NOT NULL, -- 'anonymization', 'ip_reputation_update', 'session_cleanup'
  job_status TEXT NOT NULL, -- 'success' or 'error'

  -- Performance metrics
  duration_ms INTEGER, -- Execution duration in milliseconds
  records_processed INTEGER DEFAULT 0, -- Number of records processed

  -- Error tracking
  error_message TEXT,

  -- Additional context
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_job_metrics_job_name ON job_metrics(job_name);
CREATE INDEX idx_job_metrics_created_at ON job_metrics(created_at);
CREATE INDEX idx_job_metrics_job_status ON job_metrics(job_status);
CREATE INDEX idx_job_metrics_job_name_status ON job_metrics(job_name, job_status);

-- RLS Policies
ALTER TABLE job_metrics ENABLE ROW LEVEL SECURITY;

-- Admin can view all metrics
CREATE POLICY "Admin full access to job metrics"
  ON job_metrics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.subscription_tier = 'internal'
    )
  );

-- Service role can insert metrics
CREATE POLICY "Service role can insert job metrics"
  ON job_metrics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON job_metrics TO authenticated;
GRANT INSERT ON job_metrics TO service_role;

COMMENT ON TABLE job_metrics IS 'Background job execution metrics for monitoring success rates and performance (Phase 1A)';
