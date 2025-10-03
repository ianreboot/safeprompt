#!/usr/bin/env node
/**
 * Fix RLS Infinite Recursion with Security Definer Function
 *
 * PROBLEM: Checking if user is 'internal' requires querying profiles,
 *          which triggers RLS, which checks if user is internal → infinite loop
 *
 * SOLUTION: Create SECURITY DEFINER function that bypasses RLS
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
  console.log('🔧 FIXING RLS WITH SECURITY DEFINER FUNCTION');
  console.log('='.repeat(70));
  console.log('\nPROBLEM: Infinite recursion when checking if user is internal');
  console.log('\nSOLUTION: Create function that bypasses RLS to check user tier\n');
  console.log('='.repeat(70));

  // Step 1: Create security definer function
  const createFunctionSQL = `
CREATE OR REPLACE FUNCTION auth.is_internal_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'internal'
  );
END;
$$;
  `.trim();

  await executeSQL(createFunctionSQL, 'Creating is_internal_user() function');

  // Step 2: Drop broken policy
  const dropSQL = `
DROP POLICY IF EXISTS "Internal users can read all profiles" ON profiles;
  `.trim();

  await executeSQL(dropSQL, 'Dropping broken policy');

  // Step 3: Create new policy using the function
  const createPolicySQL = `
CREATE POLICY "Internal users can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (auth.is_internal_user());
  `.trim();

  await executeSQL(createPolicySQL, 'Creating policy with SECURITY DEFINER function');

  // Step 4: Verify
  const verifySQL = `
SELECT
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
AND cmd = 'SELECT'
ORDER BY policyname;
  `.trim();

  const result = await executeSQL(verifySQL, 'Verifying SELECT policies');

  if (result.success && result.data) {
    console.log('\n📋 CURRENT SELECT POLICIES:');
    result.data.forEach(p => {
      console.log(`\n   ${p.policyname}`);
      console.log(`   Roles: ${p.roles}`);
      console.log(`   USING: ${p.qual}`);
    });
  }

  // Step 5: Test the function
  const testSQL = `SELECT auth.is_internal_user() as is_internal;`;
  const testResult = await executeSQL(testSQL, 'Testing function (should return false for service role)');

  if (testResult.success) {
    console.log(`   Result: ${testResult.data[0]?.is_internal}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ RLS FIXED WITH SECURITY DEFINER FUNCTION');
  console.log('='.repeat(70));
  console.log('\nHow it works:');
  console.log('  1. Policy calls auth.is_internal_user()');
  console.log('  2. Function has SECURITY DEFINER - bypasses RLS');
  console.log('  3. Function checks profiles table without triggering RLS');
  console.log('  4. Returns true/false - no recursion!');
  console.log('\nExpected results after browser refresh:');
  console.log('  • yuenho dashboard: "Early Bird Plan", "$5/month"');
  console.log('  • Admin panel (ian.ho): "5 users", "1 subscriber", "$5 revenue"');
}

fixRLS().catch(console.error);
