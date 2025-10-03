#!/usr/bin/env node
/**
 * Debug RLS Policies - Check Exact Policy Definitions
 */

require('dotenv').config({ path: '/home/projects/.env' });

const PROJECT_REF = process.env.SAFEPROMPT_PROD_PROJECT_REF;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function queryDatabase(sql, description) {
  console.log(`\n📊 ${description}...`);

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
    console.log('   ❌ Query failed:', data);
    return { success: false, error: data };
  }
}

async function debugRLS() {
  console.log('🔍 DEBUGGING RLS POLICIES');
  console.log('='.repeat(70));

  // Check if RLS is enabled
  const rlsEnabledSQL = `
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';
  `.trim();

  const rlsResult = await queryDatabase(rlsEnabledSQL, 'Checking if RLS is enabled');
  if (rlsResult.success) {
    console.log('   RLS Enabled:', rlsResult.data[0]?.rowsecurity);
  }

  // Get ALL policy details
  const policiesSQL = `
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;
  `.trim();

  const policiesResult = await queryDatabase(policiesSQL, 'Fetching all policy details');

  if (policiesResult.success && policiesResult.data) {
    console.log('\n📋 ALL POLICIES ON PROFILES TABLE:\n');
    policiesResult.data.forEach((p, i) => {
      console.log(`${i + 1}. ${p.policyname}`);
      console.log(`   Command: ${p.cmd}`);
      console.log(`   Roles: ${p.roles}`);
      console.log(`   Permissive: ${p.permissive}`);
      console.log(`   USING clause: ${p.qual}`);
      console.log(`   WITH CHECK: ${p.with_check || 'N/A'}`);
      console.log('');
    });
  }

  // Test query as authenticated user (simulate what frontend does)
  const testQuerySQL = `
SELECT current_user, current_setting('request.jwt.claims', true) as jwt_claims;
  `.trim();

  const testResult = await queryDatabase(testQuerySQL, 'Checking current auth context');
  if (testResult.success) {
    console.log('   Current user:', testResult.data[0]?.current_user);
    console.log('   JWT claims:', testResult.data[0]?.jwt_claims);
  }

  // Check yuenho's actual data
  const yuenhoSQL = `
SELECT id, email, subscription_tier, subscription_status
FROM profiles
WHERE email = 'yuenho.8@gmail.com';
  `.trim();

  const yuenhoResult = await queryDatabase(yuenhoSQL, 'Fetching yuenho data directly');
  if (yuenhoResult.success && yuenhoResult.data.length > 0) {
    console.log('\n✅ yuenho data in database:');
    console.log('   Email:', yuenhoResult.data[0].email);
    console.log('   Tier:', yuenhoResult.data[0].subscription_tier);
    console.log('   Status:', yuenhoResult.data[0].subscription_status);
    console.log('   ID:', yuenhoResult.data[0].id);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎯 DIAGNOSIS');
  console.log('='.repeat(70));
  console.log('\nThe Management API uses service role (bypasses RLS).');
  console.log('Frontend uses ANON key (respects RLS).');
  console.log('\nIf policies show correct USING clauses but frontend still fails,');
  console.log('the issue is likely in how auth.uid() is being set in the frontend.');
}

debugRLS().catch(console.error);
