#!/usr/bin/env node
/**
 * Test RLS Policy Logic Directly
 */

require('dotenv').config({ path: '/home/projects/.env' });

const PROJECT_REF = process.env.SAFEPROMPT_PROD_PROJECT_REF;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function queryDatabase(sql, description) {
  console.log(`\n${description}...`);

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
    return { success: true, data };
  } else {
    console.log('   ❌ Failed:', data);
    return { success: false, error: data };
  }
}

async function testRLS() {
  console.log('🧪 TESTING RLS POLICY LOGIC');
  console.log('='.repeat(70));

  // Get ian.ho's ID
  const ianResult = await queryDatabase(
    `SELECT id, subscription_tier FROM profiles WHERE email = 'ian.ho@rebootmedia.net';`,
    '1. Getting ian.ho ID'
  );

  const ianId = ianResult.data[0].id;
  const ianTier = ianResult.data[0].subscription_tier;
  console.log(`   ID: ${ianId}`);
  console.log(`   Tier: ${ianTier}`);

  // Test the EXISTS clause logic
  const existsTest = await queryDatabase(
    `
SELECT
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = '${ianId}'
    AND profiles.subscription_tier = 'internal'
  ) as ian_is_internal;
    `,
    '2. Testing EXISTS clause'
  );

  console.log(`   Result: ${existsTest.data[0].ian_is_internal}`);

  // Test what profiles ian.ho SHOULD see with the current policy
  const shouldSeeSQL = `
SELECT email, subscription_tier
FROM profiles
WHERE
  id = '${ianId}'  -- Can see own profile
  OR
  EXISTS (
    SELECT 1 FROM profiles p2
    WHERE p2.id = '${ianId}'
    AND p2.subscription_tier = 'internal'
  );
  `;

  const shouldSeeResult = await queryDatabase(shouldSeeSQL, '3. Simulating RLS policy (what ian.ho SHOULD see)');

  console.log(`   ✅ Should see ${shouldSeeResult.data.length} profiles:`);
  shouldSeeResult.data.forEach(p => {
    console.log(`      - ${p.email} (${p.subscription_tier})`);
  });

  // Now check the ACTUAL policy definition
  const policyCheckSQL = `
SELECT
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
AND cmd = 'SELECT'
ORDER BY policyname;
  `;

  const policyResult = await queryDatabase(policyCheckSQL, '4. Checking actual RLS policies');

  console.log('\n📋 Current SELECT policies:');
  policyResult.data.forEach(p => {
    console.log(`\n   ${p.policyname}`);
    console.log(`   Roles: ${p.roles}`);
    console.log(`   USING: ${p.qual}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('🎯 DIAGNOSIS');
  console.log('='.repeat(70));

  if (shouldSeeResult.data.length === 5 && existsTest.data[0].ian_is_internal) {
    console.log('\n✅ RLS logic is CORRECT - ian.ho should see all 5 users');
    console.log('\n❌ PROBLEM IS IN FRONTEND:');
    console.log('   1. Session may not be properly established');
    console.log('   2. auth.uid() may not be set when query runs');
    console.log('   3. Supabase client may not have auth headers');
    console.log('\n💡 SOLUTION:');
    console.log('   Add console.error() to admin fetchData() to see actual error');
    console.log('   Check browser console at https://dashboard.safeprompt.dev/admin');
  } else if (shouldSeeResult.data.length === 1) {
    console.log('\n⚠️  Policy only allows ian.ho to see own profile');
    console.log('   The EXISTS clause is not working correctly');
  } else {
    console.log('\n❌ Unexpected result - needs investigation');
  }
}

testRLS().catch(console.error);
