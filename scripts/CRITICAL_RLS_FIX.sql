-- CRITICAL: Fix SafePrompt RLS Policies
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Project: adyfhzbcsqzgqvyimycv (PROD)

-- =============================================================================
-- PROBLEM DIAGNOSIS
-- =============================================================================
-- Both dashboard and admin issues have the SAME root cause:
-- RLS is blocking ALL queries to the profiles table.
--
-- Symptoms:
-- 1. yuenho sees "Free Plan" (database shows "early_bird")
--    → Dashboard query blocked, profileData is null, defaults to "free"
--
-- 2. Admin panel shows "0 users, $0 revenue"
--    → Admin query blocked by RLS
--
-- 3. Error: "permission denied for table users"
--    → RLS has NO policy allowing SELECT
-- =============================================================================

-- Step 1: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users and admins can read profiles" ON profiles;
DROP POLICY IF EXISTS "Internal users can read all profiles" ON profiles;

-- Step 2: Create comprehensive SELECT policy
CREATE POLICY "Users and admins can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Allow users to read their own profile (fixes yuenho dashboard)
  auth.uid() = id
  OR
  -- Allow internal/admin users to read all profiles (fixes admin panel)
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.subscription_tier = 'internal'
  )
);

-- Step 3: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- =============================================================================
-- EXPECTED RESULTS AFTER RUNNING THIS SQL
-- =============================================================================
-- ✅ yuenho dashboard shows: "Early Bird Plan", "$5/month", "100,000 requests"
-- ✅ Admin panel shows: "5 users", "1 active subscriber", "$5 revenue"
-- ✅ ian.ho admin can view all user details
-- =============================================================================

-- =============================================================================
-- VERIFICATION QUERIES (run these after applying the fix)
-- =============================================================================

-- Check yuenho data is accessible
-- SELECT subscription_tier, subscription_status, api_requests_limit
-- FROM profiles
-- WHERE email = 'yuenho.8@gmail.com';

-- Count active subscribers
-- SELECT COUNT(*) as active_subscribers
-- FROM profiles
-- WHERE subscription_status = 'active'
-- AND subscription_tier IN ('early_bird', 'starter', 'business');

-- Calculate revenue
-- SELECT
--   SUM(CASE subscription_tier
--     WHEN 'early_bird' THEN 5
--     WHEN 'starter' THEN 29
--     WHEN 'business' THEN 99
--     ELSE 0
--   END) as monthly_revenue
-- FROM profiles
-- WHERE subscription_status = 'active';
