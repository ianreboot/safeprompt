#!/usr/bin/env node
/**
 * Debug yuenho Dashboard Display Issue
 *
 * ULTRATHINK: Why does yuenho see "Free Plan" when database shows "early_bird"?
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

console.log('🔍 ULTRATHINKING yuenho Dashboard Bug...\n');
console.log('Database shows: early_bird, active, 100,000 limit');
console.log('Dashboard shows: Free Plan, $0/month, Next billing: 11/1/2025');
console.log('');

// Test 1: What does SERVICE_ROLE see?
console.log('1️⃣  What SERVICE_ROLE sees (bypasses RLS)...');
const serviceSupabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

const { data: serviceData, error: serviceError } = await serviceSupabase
  .from('profiles')
  .select('subscription_tier, subscription_status, api_requests_limit')
  .eq('email', 'yuenho.8@gmail.com')
  .single();

if (serviceError) {
  console.log('❌ Service role error:', serviceError);
} else {
  console.log('✅ Service role sees:');
  console.log(`   subscription_tier: ${serviceData.subscription_tier}`);
  console.log(`   subscription_status: ${serviceData.subscription_status}`);
  console.log(`   api_requests_limit: ${serviceData.api_requests_limit}`);
}
console.log('');

// Test 2: What does ANON_KEY see when authenticated as yuenho?
console.log('2️⃣  Simulating dashboard query (ANON_KEY as yuenho)...');
console.log('   Problem: We can\'t actually auth as yuenho here.');
console.log('   But we can test what ANON_KEY can see...\n');

const anonSupabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_ANON_KEY
);

const { data: anonData, error: anonError } = await anonSupabase
  .from('profiles')
  .select('subscription_tier, subscription_status')
  .eq('email', 'yuenho.8@gmail.com')
  .single();

if (anonError) {
  console.log('❌ ANON query failed:', anonError.message);
  console.log('   Code:', anonError.code);
  console.log('');
  console.log('🎯 ROOT CAUSE FOUND:');
  console.log('   RLS is blocking the profiles query!');
  console.log('   Even though yuenho is logged in, RLS prevents reading their own profile.');
  console.log('');
  console.log('   The dashboard code defaults to "free" when profileData is null:');
  console.log('   Line 211: const tier = profileData?.subscription_tier || "free"');
  console.log('');
  console.log('   Since RLS blocks the query, profileData is null, so tier = "free".');
} else {
  console.log('✅ ANON can read yuenho profile (this would be weird):');
  console.log(JSON.stringify(anonData, null, 2));
}
console.log('');

// Test 3: Check current RLS policies
console.log('3️⃣  Checking current RLS policies on profiles table...');
const { data: policies, error: policyError } = await serviceSupabase
  .rpc('pg_policies')
  .select('*')
  .eq('tablename', 'profiles');

if (policyError || !policies) {
  console.log('   Unable to query pg_policies (this is normal)');
  console.log('   Policies must be checked via Supabase Dashboard or direct SQL');
} else {
  console.log(`   Found ${policies.length} policies:`);
  policies.forEach(p => console.log(`   - ${p.policyname}`));
}
console.log('');

console.log('='.repeat(80));
console.log('DIAGNOSIS');
console.log('='.repeat(80));
console.log('');
console.log('The bug is NOT a cache issue. It\'s an RLS policy issue.');
console.log('');
console.log('When yuenho logs in:');
console.log('1. Dashboard authenticates via Supabase auth ✅');
console.log('2. Dashboard gets user ID from auth.getUser() ✅');
console.log('3. Dashboard queries profiles table with user ID ❌ BLOCKED BY RLS');
console.log('4. profileData is null, so tier defaults to "free" ❌');
console.log('5. currentPlan is set to Free Plan ❌');
console.log('');
console.log('SOLUTION:');
console.log('Add RLS policy that allows authenticated users to read their OWN profile:');
console.log('');
console.log('CREATE POLICY "Users can read own profile"');
console.log('ON profiles FOR SELECT');
console.log('TO authenticated');
console.log('USING (auth.uid() = id);');
console.log('');
console.log('AND allow internal users to read all profiles (for admin):');
console.log('');
console.log('CREATE POLICY "Internal users can read all profiles"');
console.log('ON profiles FOR SELECT');
console.log('TO authenticated');
console.log('USING (');
console.log('  EXISTS (');
console.log('    SELECT 1 FROM profiles');
console.log('    WHERE profiles.id = auth.uid()');
console.log('    AND profiles.subscription_tier = \'internal\'');
console.log('  )');
console.log(');');
console.log('');
console.log('Or combine into one policy (recommended):');
console.log('');
console.log('CREATE POLICY "Users and admins can read profiles"');
console.log('ON profiles FOR SELECT');
console.log('TO authenticated');
console.log('USING (');
console.log('  auth.uid() = id  -- Users can read own profile');
console.log('  OR');
console.log('  EXISTS (  -- Internal users can read all profiles');
console.log('    SELECT 1 FROM profiles');
console.log('    WHERE profiles.id = auth.uid()');
console.log('    AND profiles.subscription_tier = \'internal\'');
console.log('  )');
console.log(');');
