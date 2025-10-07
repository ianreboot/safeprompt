-- Create intelligence_logs and job_metrics tables for DEV database
-- These tables are needed for Phase 1A monitoring

CREATE TABLE IF NOT EXISTS intelligence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  collection_result TEXT NOT NULL,
  skip_reason TEXT,
  user_id UUID,
  subscription_tier TEXT,
  prompt_length INTEGER,
  threat_severity TEXT,
  ip_hash TEXT,
  samples_anonymized INTEGER,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_logs_event_type ON intelligence_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_logs_created_at ON intelligence_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_intelligence_logs_user_id ON intelligence_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_logs_collection_result ON intelligence_logs(collection_result);
CREATE INDEX IF NOT EXISTS idx_intelligence_logs_subscription_tier ON intelligence_logs(subscription_tier);

ALTER TABLE intelligence_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to intelligence logs" ON intelligence_logs;
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

DROP POLICY IF EXISTS "Users can view own intelligence logs" ON intelligence_logs;
CREATE POLICY "Users can view own intelligence logs"
  ON intelligence_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can insert intelligence logs" ON intelligence_logs;
CREATE POLICY "Service role can insert intelligence logs"
  ON intelligence_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

GRANT SELECT ON intelligence_logs TO authenticated;
GRANT INSERT ON intelligence_logs TO service_role;

-- Job Metrics Table
CREATE TABLE IF NOT EXISTS job_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  job_status TEXT NOT NULL,
  duration_ms INTEGER,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_metrics_job_name ON job_metrics(job_name);
CREATE INDEX IF NOT EXISTS idx_job_metrics_created_at ON job_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_job_metrics_job_status ON job_metrics(job_status);
CREATE INDEX IF NOT EXISTS idx_job_metrics_job_name_status ON job_metrics(job_name, job_status);

ALTER TABLE job_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to job metrics" ON job_metrics;
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

DROP POLICY IF EXISTS "Service role can insert job metrics" ON job_metrics;
CREATE POLICY "Service role can insert job metrics"
  ON job_metrics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

GRANT SELECT ON job_metrics TO authenticated;
GRANT INSERT ON job_metrics TO service_role;
