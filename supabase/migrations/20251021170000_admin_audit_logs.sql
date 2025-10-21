-- Admin Audit Logs Table
-- Captures all admin operations for security monitoring and compliance
-- SECURITY: Immutable audit trail - no updates/deletes allowed via RLS

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Admin who performed the action
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,

  -- Action details
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_email TEXT,

  -- Additional context
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,

  -- Result
  success BOOLEAN NOT NULL,
  error_message TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user_id ON admin_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can insert new audit logs
CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs"
  ON admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- SECURITY: No update or delete policies - audit logs are immutable

-- Comments for documentation
COMMENT ON TABLE admin_audit_logs IS 'Immutable audit trail of all admin operations';
COMMENT ON COLUMN admin_audit_logs.action IS 'Action type - see ADMIN_ACTIONS in audit-log.ts';
COMMENT ON COLUMN admin_audit_logs.details IS 'Additional context (e.g., credit notes, old/new values)';
COMMENT ON COLUMN admin_audit_logs.success IS 'Whether the operation succeeded or failed';
