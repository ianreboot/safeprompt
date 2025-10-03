-- Fix Admin Panel RLS Policies
-- Problem: Admin panel shows 0 users/subscribers
-- Root Cause: RLS policies on profiles table block all queries via ANON_KEY
-- Solution: Add policy allowing internal/admin users to read all profiles

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;

-- Create comprehensive SELECT policy
CREATE POLICY "Users and admins can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Allow users to read their own profile
  auth.uid() = id
  OR
  -- Allow internal/admin users to read all profiles
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.subscription_tier = 'internal'
  )
);

-- Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Show current policies for verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
