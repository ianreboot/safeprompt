#!/usr/bin/env node
/**
 * Fix RLS Policy Roles
 *
 * PROBLEM FOUND:
 * - "Admins can view all profiles" has role {public} - should be {authenticated}
 * - "Users can view own profile" has role {public} - should be {authenticated}
 *
 * When users are logged in, they have role "authenticated", not "public"
 * So policies targeting "public" don't apply to logged-in users!
 */

require('dotenv').config({ path: '/home/projects/.env' });

const PROJECT_REF = process.env.SAFEPROMPT_PROD_PROJECT_REF;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function executeSQL(sql, description) {
  console.log(`\n📝 ${description}...`);

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    }
  );

  const data = await response.json();

  if (response.ok) {
    console.log('   ✅ Success');
    return { success: true, data };
  } else {
    console.log('   ❌ Failed:', data);
    return { success: false, error: data };
  }
}

async function fixRLS() {
  console.log('🔧 FIXING RLS POLICY ROLES');
  console.log('='.repeat(70));
  console.log('\nPROBLEM: Policies have role "public" but logged-in users have role "authenticated"');
  console.log('SOLUTION: Drop all policies and recreate with correct roles\n');
  console.log('='.repeat(70));

  // Step 1: Drop ALL existing policies
  const dropSQL = `
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated profile creation" ON profiles;
DROP POLICY IF EXISTS "Users and admins can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  `.trim();

  await executeSQL(dropSQL, 'Dropping all existing policies');

  // Step 2: Create policies with CORRECT roles (authenticated, not public)

  // Policy 1: Users can read their own profile
  const policy1SQL = `
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);
  `.trim();
  await executeSQL(policy1SQL, 'Creating user read policy (authenticated role)');

  // Policy 2: Admins (internal tier) can read ALL profiles
  const policy2SQL = `
CREATE POLICY "Internal users can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.subscription_tier = 'internal'
  )
);
  `.trim();
  await executeSQL(policy2SQL, 'Creating admin read policy (authenticated role)');

  // Policy 3: Users can update their own profile
  const policy3SQL = `
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
  `.trim();
  await executeSQL(policy3SQL, 'Creating user update policy');

  // Policy 4: Allow profile creation during signup
  const policy4SQL = `
CREATE POLICY "Allow authenticated profile creation"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
  `.trim();
  await executeSQL(policy4SQL, 'Creating profile insert policy');

  // Step 3: Verify new policies
  const verifySQL = `
SELECT
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;
  `.trim();

  const result = await executeSQL(verifySQL, 'Verifying new policies');

  if (result.success && result.data) {
    console.log('\n📋 NEW POLICIES:');
    result.data.forEach(p => {
      console.log(`\n   ${p.policyname}`);
      console.log(`   Command: ${p.cmd}`);
      console.log(`   Roles: ${p.roles}`);
      console.log(`   USING: ${p.qual?.substring(0, 80)}...`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ RLS POLICIES FIXED');
  console.log('='.repeat(70));
  console.log('\nKey changes:');
  console.log('  • All policies now use role "authenticated" (not "public")');
  console.log('  • Users can read their own profile');
  console.log('  • Internal tier users can read ALL profiles (for admin panel)');
  console.log('\nExpected results:');
  console.log('  • yuenho dashboard: Shows "Early Bird Plan", "$5/month", "100,000 requests"');
  console.log('  • Admin panel: Shows "5 users", "1 subscriber", "$5 revenue"');
  console.log('\nNOTE: Users may need to refresh their browser (Ctrl+F5) to clear cache');
}

fixRLS().catch(console.error);
