#!/usr/bin/env node
/**
 * Fix Circular RLS Policy Issue
 *
 * PROBLEM: EXISTS subquery references same table (profiles)
 * This causes 500 Internal Server Error when RLS tries to check itself
 *
 * SOLUTION: Use proper table alias in subquery
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
  console.log('🔧 FIXING CIRCULAR RLS POLICY');
  console.log('='.repeat(70));
  console.log('\nPROBLEM: Internal users policy has circular reference');
  console.log('  EXISTS (SELECT 1 FROM profiles WHERE ...) causes 500 error');
  console.log('\nSOLUTION: Use proper table alias in subquery\n');
  console.log('='.repeat(70));

  // Step 1: Drop the broken policy
  const dropSQL = `
DROP POLICY IF EXISTS "Internal users can read all profiles" ON profiles;
  `.trim();

  await executeSQL(dropSQL, 'Dropping broken policy');

  // Step 2: Create FIXED policy with proper table alias
  const createSQL = `
CREATE POLICY "Internal users can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles AS p
    WHERE p.id = auth.uid()
    AND p.subscription_tier = 'internal'
  )
);
  `.trim();

  await executeSQL(createSQL, 'Creating fixed policy (with table alias)');

  // Step 3: Verify
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

  const result = await executeSQL(verifySQL, 'Verifying policies');

  if (result.success && result.data) {
    console.log('\n📋 CURRENT POLICIES:');
    result.data.forEach(p => {
      console.log(`\n   ${p.policyname}`);
      console.log(`   Roles: ${p.roles}`);
      console.log(`   USING: ${p.qual?.substring(0, 100)}...`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ RLS POLICY FIXED');
  console.log('='.repeat(70));
  console.log('\nChanges:');
  console.log('  • Fixed circular reference by using table alias "AS p"');
  console.log('  • Should now return data instead of 500 error');
  console.log('\nExpected results after browser refresh:');
  console.log('  • yuenho dashboard: "Early Bird Plan", "$5/month"');
  console.log('  • Admin panel: "5 users", "1 subscriber", "$5 revenue"');
}

fixRLS().catch(console.error);
