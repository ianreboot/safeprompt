-- Phase 1C: IP Management & Dashboard Intelligence
-- Quarter 1 - IP Whitelist/Blacklist + Admin Operations
-- Created: 2025-10-07
-- Purpose: Admin dashboard for IP management, false positive mitigation, audit trail

-- ====================
-- IP WHITELIST TABLE
-- ====================
-- System-wide whitelist: IPs that should NEVER be blocked
-- Use cases: Internal IPs, CI/CD systems, trusted partners

CREATE TABLE IF NOT EXISTS ip_whitelist (
  ip INET PRIMARY KEY,
  reason TEXT NOT NULL,  -- Required documentation for whitelist entry
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,  -- Optional expiration for temporary whitelist
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for expiration cleanup job
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_expires_at ON ip_whitelist(expires_at) WHERE expires_at IS NOT NULL;

-- Comment for documentation
COMMENT ON TABLE ip_whitelist IS 'System-wide IP whitelist (never block). Admin-only management.';
COMMENT ON COLUMN ip_whitelist.reason IS 'Required justification for whitelist entry';
COMMENT ON COLUMN ip_whitelist.expires_at IS 'Automatic removal after expiration (NULL = permanent)';

-- ====================
-- IP BLACKLIST TABLE
-- ====================
-- System-wide blacklist: IPs that should ALWAYS be blocked
-- Use cases: Known attackers, threat feed IPs, repeat offenders

CREATE TABLE IF NOT EXISTS ip_blacklist (
  ip INET PRIMARY KEY,
  reason TEXT NOT NULL,  -- Required documentation for blacklist entry
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source TEXT,  -- Optional: threat feed name, incident reference
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,  -- Optional expiration for temporary blocks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ip_blacklist_severity ON ip_blacklist(severity);
CREATE INDEX IF NOT EXISTS idx_ip_blacklist_expires_at ON ip_blacklist(expires_at) WHERE expires_at IS NOT NULL;

-- Comment for documentation
COMMENT ON TABLE ip_blacklist IS 'System-wide IP blacklist (always block). Admin-only management.';
COMMENT ON COLUMN ip_blacklist.severity IS 'Threat severity level for prioritization';
COMMENT ON COLUMN ip_blacklist.source IS 'Optional documentation: threat feed, incident ID, etc.';

-- ====================
-- IP ADMIN ACTIONS (AUDIT TRAIL)
-- ====================
-- Complete audit trail of all admin IP management operations
-- GDPR/SOC2 compliance requirement

CREATE TABLE IF NOT EXISTS ip_admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('block', 'unblock', 'whitelist_add', 'whitelist_remove', 'blacklist_add', 'blacklist_remove', 'reputation_update')),
  ip INET NOT NULL,
  admin_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,  -- Required justification for all admin actions
  before_state JSONB,  -- State before action (NULL for new entries)
  after_state JSONB,  -- State after action (NULL for deletions)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_ip_admin_actions_created_at ON ip_admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_admin_actions_admin_user_id ON ip_admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_ip_admin_actions_ip ON ip_admin_actions(ip);
CREATE INDEX IF NOT EXISTS idx_ip_admin_actions_action_type ON ip_admin_actions(action_type);

-- Comment for documentation
COMMENT ON TABLE ip_admin_actions IS 'Complete audit trail of all IP management operations (compliance requirement)';
COMMENT ON COLUMN ip_admin_actions.reason IS 'Required justification for audit trail and compliance';
COMMENT ON COLUMN ip_admin_actions.before_state IS 'JSON snapshot of state before action (for rollback capability)';
COMMENT ON COLUMN ip_admin_actions.after_state IS 'JSON snapshot of state after action';

-- ====================
-- UPDATE IP REPUTATION TABLE
-- ====================
-- Add manual blocking fields to existing ip_reputation table

ALTER TABLE ip_reputation
  ADD COLUMN IF NOT EXISTS manually_blocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS manual_block_reason TEXT,
  ADD COLUMN IF NOT EXISTS manual_block_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manual_block_at TIMESTAMP WITH TIME ZONE;

-- Index for filtering manually blocked IPs
CREATE INDEX IF NOT EXISTS idx_ip_reputation_manually_blocked ON ip_reputation(manually_blocked) WHERE manually_blocked = TRUE;

-- Comments
COMMENT ON COLUMN ip_reputation.manually_blocked IS 'TRUE if IP was manually blocked by admin (overrides automatic scoring)';
COMMENT ON COLUMN ip_reputation.manual_block_reason IS 'Admin-provided reason for manual block';
COMMENT ON COLUMN ip_reputation.manual_block_by IS 'Admin user who performed manual block';
COMMENT ON COLUMN ip_reputation.manual_block_at IS 'Timestamp of manual block action';

-- ====================
-- ADMIN ROLES TABLE
-- ====================
-- Define which users have admin permissions for IP management
-- Separate from subscription tiers (admins can be free/pro/internal)

CREATE TABLE IF NOT EXISTS admin_roles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  permissions JSONB NOT NULL DEFAULT '{}',  -- Granular permissions: {"ip_management": true, "customer_support": true}
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,  -- NULL = active, timestamp = revoked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for active admin checks
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON admin_roles(user_id) WHERE is_admin = TRUE AND revoked_at IS NULL;

-- Comments
COMMENT ON TABLE admin_roles IS 'Admin user permissions for SafePrompt internal operations';
COMMENT ON COLUMN admin_roles.permissions IS 'Granular permissions object (JSON)';
COMMENT ON COLUMN admin_roles.revoked_at IS 'NULL = active admin, timestamp = access revoked';

-- ====================
-- HELPER FUNCTIONS
-- ====================

-- Function to check if IP is whitelisted (used in IP reputation flow)
CREATE OR REPLACE FUNCTION is_ip_whitelisted(check_ip INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM ip_whitelist
    WHERE ip = check_ip
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

COMMENT ON FUNCTION is_ip_whitelisted IS 'Check if IP is in whitelist and not expired';

-- Function to check if IP is blacklisted (used in IP reputation flow)
CREATE OR REPLACE FUNCTION is_ip_blacklisted(check_ip INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM ip_blacklist
    WHERE ip = check_ip
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

COMMENT ON FUNCTION is_ip_blacklisted IS 'Check if IP is in blacklist and not expired';

-- Function to check if user is admin (used in API endpoints)
CREATE OR REPLACE FUNCTION is_user_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_roles
    WHERE user_id = check_user_id
      AND is_admin = TRUE
      AND revoked_at IS NULL
  );
END;
$$;

COMMENT ON FUNCTION is_user_admin IS 'Check if user has active admin permissions';

-- ====================
-- AUTOMATIC CLEANUP JOB (EXPIRED ENTRIES)
-- ====================
-- This function will be called by a cron job to remove expired whitelist/blacklist entries

CREATE OR REPLACE FUNCTION cleanup_expired_ip_lists()
RETURNS TABLE (
  whitelist_removed INTEGER,
  blacklist_removed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  whitelist_count INTEGER;
  blacklist_count INTEGER;
BEGIN
  -- Remove expired whitelist entries
  WITH deleted_whitelist AS (
    DELETE FROM ip_whitelist
    WHERE expires_at IS NOT NULL AND expires_at < NOW()
    RETURNING *
  )
  SELECT COUNT(*) INTO whitelist_count FROM deleted_whitelist;

  -- Remove expired blacklist entries
  WITH deleted_blacklist AS (
    DELETE FROM ip_blacklist
    WHERE expires_at IS NOT NULL AND expires_at < NOW()
    RETURNING *
  )
  SELECT COUNT(*) INTO blacklist_count FROM deleted_blacklist;

  -- Return counts for monitoring
  RETURN QUERY SELECT whitelist_count, blacklist_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_ip_lists IS 'Hourly cleanup job: Remove expired whitelist/blacklist entries';

-- ====================
-- ROW LEVEL SECURITY (RLS)
-- ====================
-- Admins-only access to all IP management tables

ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Whitelist: Admins can do everything, others can only read
CREATE POLICY ip_whitelist_admin_all ON ip_whitelist
  FOR ALL
  TO authenticated
  USING (is_user_admin(auth.uid()));

CREATE POLICY ip_whitelist_read_only ON ip_whitelist
  FOR SELECT
  TO authenticated
  USING (TRUE);  -- All users can see whitelist (transparency)

-- Blacklist: Admins-only access (security)
CREATE POLICY ip_blacklist_admin_only ON ip_blacklist
  FOR ALL
  TO authenticated
  USING (is_user_admin(auth.uid()));

-- Admin Actions: Admins can insert, everyone can read (transparency/audit)
CREATE POLICY ip_admin_actions_insert ON ip_admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_user_admin(auth.uid()));

CREATE POLICY ip_admin_actions_read_all ON ip_admin_actions
  FOR SELECT
  TO authenticated
  USING (TRUE);  -- Full transparency for audit trail

-- Admin Roles: Admins-only access
CREATE POLICY admin_roles_admin_only ON admin_roles
  FOR ALL
  TO authenticated
  USING (is_user_admin(auth.uid()));

-- ====================
-- SEED DATA (INITIAL ADMIN USER)
-- ====================
-- Add first admin user (ian.ho@rebootmedia.net) - requires manual update of user_id

-- IMPORTANT: Replace this UUID with actual user_id from profiles table
-- Query: SELECT id FROM profiles WHERE email = 'ian.ho@rebootmedia.net';

-- INSERT INTO admin_roles (user_id, is_admin, permissions, granted_by)
-- VALUES (
--   'YOUR_USER_ID_HERE'::UUID,
--   TRUE,
--   '{"ip_management": true, "customer_support": true, "system_admin": true}'::JSONB,
--   'YOUR_USER_ID_HERE'::UUID  -- Self-granted for first admin
-- );

-- ====================
-- VERIFICATION QUERIES
-- ====================
-- Run these after migration to verify success:

-- SELECT COUNT(*) AS whitelist_count FROM ip_whitelist;
-- SELECT COUNT(*) AS blacklist_count FROM ip_blacklist;
-- SELECT COUNT(*) AS admin_count FROM admin_roles WHERE is_admin = TRUE AND revoked_at IS NULL;
-- SELECT * FROM ip_admin_actions ORDER BY created_at DESC LIMIT 5;

-- Test helper functions:
-- SELECT is_ip_whitelisted('192.168.1.1'::INET);  -- Should return FALSE (no entries yet)
-- SELECT is_ip_blacklisted('1.2.3.4'::INET);  -- Should return FALSE (no entries yet)
-- SELECT is_user_admin(auth.uid());  -- Should return TRUE for admin user

-- ====================
-- ROLLBACK (IF NEEDED)
-- ====================
-- DROP TABLE IF EXISTS ip_whitelist CASCADE;
-- DROP TABLE IF EXISTS ip_blacklist CASCADE;
-- DROP TABLE IF EXISTS ip_admin_actions CASCADE;
-- DROP TABLE IF EXISTS admin_roles CASCADE;
-- DROP FUNCTION IF EXISTS is_ip_whitelisted CASCADE;
-- DROP FUNCTION IF EXISTS is_ip_blacklisted CASCADE;
-- DROP FUNCTION IF EXISTS is_user_admin CASCADE;
-- DROP FUNCTION IF EXISTS cleanup_expired_ip_lists CASCADE;
-- ALTER TABLE ip_reputation DROP COLUMN IF EXISTS manually_blocked;
-- ALTER TABLE ip_reputation DROP COLUMN IF EXISTS manual_block_reason;
-- ALTER TABLE ip_reputation DROP COLUMN IF EXISTS manual_block_by;
-- ALTER TABLE ip_reputation DROP COLUMN IF EXISTS manual_block_at;
