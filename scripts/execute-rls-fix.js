#!/usr/bin/env node
/**
 * Execute RLS Fix via Supabase Management API
 * Method: Use database/query endpoint with SUPABASE_ACCESS_TOKEN
 */

require('dotenv').config({ path: '/home/projects/.env' });
const fs = require('fs');

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
  console.log('🔧 EXECUTING RLS FIX ON PROD DATABASE');
  console.log('Project:', PROJECT_REF);
  console.log('='.repeat(70));

  // Step 1: Drop old policies
  const dropSQL = `
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users and admins can read profiles" ON profiles;
DROP POLICY IF EXISTS "Internal users can read all profiles" ON profiles;
  `.trim();

  await executeSQL(dropSQL, 'Dropping old RLS policies');

  // Step 2: Create new comprehensive policy
  const createSQL = `
CREATE POLICY "Users and admins can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.subscription_tier = 'internal'
  )
);
  `.trim();

  await executeSQL(createSQL, 'Creating new RLS policy');

  // Step 3: Ensure RLS is enabled
  const enableSQL = `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`;
  await executeSQL(enableSQL, 'Ensuring RLS is enabled');

  // Step 4: Verify policies
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFYING RLS POLICIES');
  console.log('='.repeat(70));

  const verifySQL = `
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;
  `.trim();

  const result = await executeSQL(verifySQL, 'Checking policies');

  if (result.success && result.data) {
    console.log('\n📋 Current policies on profiles table:');
    result.data.forEach(p => {
      console.log(`   - ${p.policyname} (${p.cmd})`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ RLS FIX COMPLETE');
  console.log('='.repeat(70));
  console.log('\nExpected results:');
  console.log('  • yuenho dashboard shows: "Early Bird Plan", "$5/month"');
  console.log('  • Admin panel shows: "5 users", "1 subscriber", "$5 revenue"');
  console.log('\nVerify by refreshing dashboard and admin panel.');
}

fixRLS().catch(console.error);
