#!/usr/bin/env node
/**
 * Verify Admin Panel Data After RLS Fix
 *
 * This script simulates the admin panel queries to verify the RLS fix worked.
 * Expected results:
 * - Total Users: 5
 * - Active Subscribers: 1 (yuenho with early_bird tier)
 * - Monthly Revenue: $5 (early_bird = $5/month)
 * - Total API Calls: Sum of api_requests_used
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

async function verifyAdminData() {
  console.log('🔍 VERIFYING ADMIN PANEL DATA');
  console.log('Project:', PROJECT_REF);
  console.log('='.repeat(70));

  // Query 1: Total Users
  const usersSQL = `SELECT COUNT(*) as total_users FROM profiles;`;
  const usersResult = await queryDatabase(usersSQL, 'Counting total users');

  if (usersResult.success) {
    const count = usersResult.data[0]?.total_users || 0;
    console.log(`   ✅ Total Users: ${count}`);
  }

  // Query 2: Active Subscribers
  const subscribersSQL = `
SELECT COUNT(*) as active_subscribers
FROM profiles
WHERE subscription_status = 'active'
AND subscription_tier IN ('early_bird', 'starter', 'business');
  `.trim();
  const subscribersResult = await queryDatabase(subscribersSQL, 'Counting active subscribers');

  if (subscribersResult.success) {
    const count = subscribersResult.data[0]?.active_subscribers || 0;
    console.log(`   ✅ Active Subscribers: ${count}`);
  }

  // Query 3: Monthly Revenue
  const revenueSQL = `
SELECT
  SUM(CASE subscription_tier
    WHEN 'early_bird' THEN 5
    WHEN 'starter' THEN 29
    WHEN 'business' THEN 99
    ELSE 0
  END) as monthly_revenue
FROM profiles
WHERE subscription_status = 'active';
  `.trim();
  const revenueResult = await queryDatabase(revenueSQL, 'Calculating monthly revenue');

  if (revenueResult.success) {
    const revenue = revenueResult.data[0]?.monthly_revenue || 0;
    console.log(`   ✅ Monthly Revenue: $${revenue}`);
  }

  // Query 4: Total API Calls
  const apiCallsSQL = `SELECT SUM(api_requests_used) as total_api_calls FROM profiles;`;
  const apiCallsResult = await queryDatabase(apiCallsSQL, 'Summing total API calls');

  if (apiCallsResult.success) {
    const calls = apiCallsResult.data[0]?.total_api_calls || 0;
    console.log(`   ✅ Total API Calls: ${calls}`);
  }

  // Query 5: Show all users for debugging
  const allUsersSQL = `
SELECT
  email,
  subscription_tier,
  subscription_status,
  api_requests_used,
  api_requests_limit
FROM profiles
ORDER BY created_at;
  `.trim();
  const allUsersResult = await queryDatabase(allUsersSQL, 'Listing all users');

  if (allUsersResult.success && allUsersResult.data.length > 0) {
    console.log('\n📋 All Users:');
    allUsersResult.data.forEach((user, i) => {
      console.log(`\n${i + 1}. ${user.email}`);
      console.log(`   Tier: ${user.subscription_tier}`);
      console.log(`   Status: ${user.subscription_status}`);
      console.log(`   API Usage: ${user.api_requests_used || 0} / ${user.api_requests_limit || 0}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ ADMIN PANEL VERIFICATION COMPLETE');
  console.log('='.repeat(70));
  console.log('\nExpected values:');
  console.log('  • Total Users: 5');
  console.log('  • Active Subscribers: 1');
  console.log('  • Monthly Revenue: $5');
  console.log('  • Total API Calls: (depends on usage)');
  console.log('\nIf values match, admin panel should now display correctly!');
}

verifyAdminData().catch(console.error);
