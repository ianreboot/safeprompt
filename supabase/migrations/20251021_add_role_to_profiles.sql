-- Add role field to profiles table for RBAC
-- Default all users to 'user', specific emails can be promoted to 'admin'

-- Add role column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'admin'));

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Set ian.ho@rebootmedia.net as admin (if exists)
UPDATE profiles
SET role = 'admin'
WHERE email = 'ian.ho@rebootmedia.net';

-- Comment for future reference
COMMENT ON COLUMN profiles.role IS 'User role for RBAC: user (default) or admin';
