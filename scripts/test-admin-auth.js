#!/usr/bin/env node
/**
 * Test Admin Panel as Authenticated User
 * This simulates what the frontend actually does
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_PROD_SUPABASE_URL;
const supabaseAnonKey = process.env.SAFEPROMPT_PROD_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 TESTING ADMIN PANEL AS AUTHENTICATED USER');
console.log('='.repeat(70));

// Test 1: Service role (what works)
console.log('\n1️⃣  SERVICE ROLE TEST (bypasses RLS)...\n');
const serviceClient = createClient(supabaseUrl, serviceRoleKey);

const { data: serviceData, error: serviceError } = await serviceClient
  .from('profiles')
  .select('*')
  .limit(5);

if (serviceError) {
  console.log('❌ Service role error:', serviceError);
} else {
  console.log(`✅ Service role sees ${serviceData.length} users`);
  serviceData.forEach(u => {
    console.log(`   - ${u.email} (${u.subscription_tier})`);
  });
}

// Test 2: Check ian.ho's actual credentials
console.log('\n2️⃣  CHECKING IAN.HO PROFILE...\n');
const { data: ianData } = await serviceClient
  .from('profiles')
  .select('id, email, subscription_tier, subscription_status')
  .eq('email', 'ian.ho@rebootmedia.net')
  .single();

if (ianData) {
  console.log('✅ ian.ho profile:');
  console.log('   ID:', ianData.id);
  console.log('   Email:', ianData.email);
  console.log('   Tier:', ianData.subscription_tier);
  console.log('   Status:', ianData.subscription_status);
} else {
  console.log('❌ ian.ho profile not found!');
}

// Test 3: Try to sign in as ian.ho and query
console.log('\n3️⃣  ATTEMPTING TO SIGN IN AS IAN.HO...\n');
console.log('⚠️  NOTE: This will only work if we have ian.ho\'s password');
console.log('    Or if we use the admin\'s session token');

// Instead, let's test what the admin panel query looks like
console.log('\n4️⃣  SIMULATING ADMIN PANEL QUERY (with auth context)...\n');

// Check RLS policies one more time
const { data: policies } = await serviceClient.rpc('pg_policies').catch(() => ({ data: null }));

console.log('Attempting direct SQL to check RLS context...');

const PROJECT_REF = process.env.SAFEPROMPT_PROD_PROJECT_REF;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

// Query to simulate what happens when ian.ho is authenticated
const testSQL = `
-- First, let's see what ian.ho's ID is
SELECT id, email, subscription_tier FROM profiles WHERE email = 'ian.ho@rebootmedia.net';
`;

const response = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: testSQL })
  }
);

const result = await response.json();
console.log('\nian.ho user ID:', result[0]?.id);

// Now test the actual RLS policy logic
const testRLSSQL = `
-- Test if the RLS policy logic works
-- Simulate: auth.uid() = '${result[0]?.id}'

SELECT COUNT(*) as can_see_users
FROM profiles
WHERE
  -- User can see their own profile
  id = '${result[0]?.id}'
  OR
  -- OR user is internal and can see all
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = '${result[0]?.id}'
    AND profiles.subscription_tier = 'internal'
  );
`;

const rls_test = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: testRLSSQL })
  }
);

const rls_result = await rls_test.json();
console.log('\n🧪 RLS Logic Test (manual simulation):');
console.log('   If ian.ho is authenticated, can see:', rls_result[0]?.can_see_users, 'users');

// The real test: what does the admin panel actually see?
console.log('\n5️⃣  REAL ISSUE CHECK...\n');
console.log('The admin panel uses this query:');
console.log('  const { data } = await supabase.from("profiles").select("*")');
console.log('');
console.log('For RLS to work, the frontend must:');
console.log('  1. Have ian.ho logged in (✓ you said you are)');
console.log('  2. Use auth.getSession() to establish auth.uid() (check this!)');
console.log('  3. RLS policy must match (✓ we just fixed this)');
console.log('');
console.log('🎯 MOST LIKELY ISSUE:');
console.log('   The admin panel code is NOT calling auth.getSession() properly');
console.log('   or the session is not being sent with the query.');

console.log('\n='.repeat(70));
console.log('📋 NEXT STEPS:');
console.log('='.repeat(70));
console.log('1. Check browser console for any auth errors');
console.log('2. Check if admin panel checkAdminAccess() is calling getSession()');
console.log('3. Verify the Supabase client is initialized correctly');
console.log('4. Check if the session token is being sent in API requests');
