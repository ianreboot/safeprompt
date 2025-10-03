#!/usr/bin/env node
/**
 * Fix RLS Policies for SafePrompt DEV Database
 * Applies same RLS fixes from PROD to DEV environment
 */

require('dotenv').config({ path: '/home/projects/.env' });

const PROJECT_REF = 'vkyggknknyfallmnrmfu'; // DEV database
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
  console.log('🔧 APPLYING RLS FIX TO DEV DATABASE');
  console.log('Project:', PROJECT_REF);
  console.log('='.repeat(70));

  // Step 1: Create function in public schema
  const createFunctionSQL = `
CREATE OR REPLACE FUNCTION public.is_internal_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND subscription_tier = 'internal'
  );
$$;
  `.trim();

  await executeSQL(createFunctionSQL, 'Creating is_internal_user() in public schema');

  // Step 2: Drop ALL existing SELECT policies
  const dropSQL = `
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Internal users can read all profiles" ON profiles;
  `.trim();

  await executeSQL(dropSQL, 'Dropping all SELECT policies');

  // Step 3: Create combined policy (users OR internal)
  const createPolicySQL = `
CREATE POLICY "Allow profile reads"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR
  public.is_internal_user() = true
);
  `.trim();

  await executeSQL(createPolicySQL, 'Creating combined SELECT policy');

  // Step 4: Verify
  const verifySQL = `
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;
  `.trim();

  const result = await executeSQL(verifySQL, 'Verifying policies');

  if (result.success && result.data) {
    console.log('\n📋 CURRENT POLICIES:');
    result.data.forEach(p => {
      console.log(`\n   ${p.policyname} (${p.cmd})`);
      console.log(`   USING: ${p.qual?.substring(0, 100)}...`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ FIX COMPLETE');
  console.log('='.repeat(70));
  console.log('\nHow it works:');
  console.log('  • Users can read their own profile (auth.uid() = id)');
  console.log('  • Internal users can read ALL profiles (via SECURITY DEFINER function)');
  console.log('  • Function bypasses RLS - no recursion!');
}

fixRLS().catch(console.error);
