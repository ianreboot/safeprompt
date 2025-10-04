-- Migration: Add alerts and monitoring system
-- Purpose: Track errors, costs, and webhook failures for admin monitoring
-- Created: 2025-10-04

-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  alert_type TEXT NOT NULL, -- 'error_rate', 'openrouter_spend', 'stripe_webhook', 'system'
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ
);

-- Create index for quick queries
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.alerts(resolved) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);

-- Create error logs table for tracking API errors
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  endpoint TEXT NOT NULL,
  error_message TEXT,
  error_stack TEXT,
  request_method TEXT,
  request_headers JSONB,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create index for error rate calculations
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_endpoint ON public.error_logs(endpoint);

-- Create cost tracking table for OpenRouter spend
CREATE TABLE IF NOT EXISTS public.cost_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  service TEXT NOT NULL, -- 'openrouter', 'stripe', etc.
  amount_usd DECIMAL(10, 4) NOT NULL,
  metadata JSONB DEFAULT '{}',
  profile_id UUID REFERENCES public.profiles(id)
);

-- Create index for daily spend calculations
CREATE INDEX IF NOT EXISTS idx_cost_logs_created_at ON public.cost_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_logs_service ON public.cost_logs(service);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON TABLE public.alerts TO postgres, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.error_logs TO postgres, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.cost_logs TO postgres, anon, authenticated;

-- Add RLS policies
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_logs ENABLE ROW LEVEL SECURITY;

-- Alerts: Only admins can view
CREATE POLICY alerts_select ON public.alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Alerts: System can insert
CREATE POLICY alerts_insert ON public.alerts
  FOR INSERT
  WITH CHECK (TRUE); -- Service role can always insert

-- Alerts: Admins can update (resolve alerts)
CREATE POLICY alerts_update ON public.alerts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Error logs: System can insert
CREATE POLICY error_logs_insert ON public.error_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- Error logs: Admins can view
CREATE POLICY error_logs_select ON public.error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Cost logs: System can insert
CREATE POLICY cost_logs_insert ON public.cost_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- Cost logs: Admins can view
CREATE POLICY cost_logs_select ON public.cost_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Create function to calculate error rate (last hour)
CREATE OR REPLACE FUNCTION get_error_rate()
RETURNS TABLE (
  error_count BIGINT,
  total_requests BIGINT,
  error_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as error_count,
    (SELECT COUNT(*) FROM public.api_logs WHERE created_at > NOW() - INTERVAL '1 hour') as total_requests,
    CASE
      WHEN (SELECT COUNT(*) FROM public.api_logs WHERE created_at > NOW() - INTERVAL '1 hour') > 0
      THEN (COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour')::DECIMAL /
            (SELECT COUNT(*) FROM public.api_logs WHERE created_at > NOW() - INTERVAL '1 hour')::DECIMAL) * 100
      ELSE 0
    END as error_rate
  FROM public.error_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate daily spend
CREATE OR REPLACE FUNCTION get_daily_spend(service_name TEXT)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(amount_usd), 0)
    FROM public.cost_logs
    WHERE service = service_name
      AND created_at > CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.alerts IS 'System alerts for monitoring errors, costs, and failures';
COMMENT ON TABLE public.error_logs IS 'API error logs for calculating error rates';
COMMENT ON TABLE public.cost_logs IS 'Cost tracking for external services (OpenRouter, Stripe, etc.)';
