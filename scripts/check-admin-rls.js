#!/usr/bin/env node
/**
 * Check Admin Panel RLS Policies
 *
 * The admin panel shows 0 users/subscribers even though data exists.
 * This is an RLS (Row Level Security) issue.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Checking Admin Panel RLS Issue...\n');

// Test 1: Check if ian.ho can see profiles when authenticated
console.log('1️⃣  Checking if ian.ho@rebootmedia.net is an admin...');
const { data: ianProfile } = await supabase
  .from('profiles')
  .select('id, email, subscription_tier')
  .eq('email', 'ian.ho@rebootmedia.net')
  .single();

if (!ianProfile) {
  console.log('❌ ian.ho profile not found\n');
  process.exit(1);
}

console.log(`✅ Found ian.ho profile: ${ianProfile.id}`);
console.log(`   Tier: ${ianProfile.subscription_tier}\n`);

// Test 2: Query profiles with SERVICE_ROLE_KEY (should see all)
console.log('2️⃣  Querying profiles with SERVICE_ROLE_KEY...');
const { data: allProfiles, error: serviceError } = await supabase
  .from('profiles')
  .select('id, email, subscription_status, subscription_tier')
  .order('created_at', { ascending: false });

if (serviceError) {
  console.log('❌ Service role query failed:', serviceError);
} else {
  console.log(`✅ Service role sees ${allProfiles.length} profiles`);
  allProfiles.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.email} - ${p.subscription_tier} (${p.subscription_status})`);
  });
}
console.log('');

// Test 3: Query profiles with ANON_KEY (simulates dashboard query)
console.log('3️⃣  Querying profiles with ANON_KEY (like dashboard does)...');
const anonSupabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_ANON_KEY
);

const { data: anonProfiles, error: anonError } = await anonSupabase
  .from('profiles')
  .select('id, email, subscription_status, subscription_tier')
  .order('created_at', { ascending: false });

if (anonError) {
  console.log('❌ Anon query failed:', anonError);
  console.log('   This is the problem! RLS is blocking the query.\n');
} else {
  console.log(`✅ Anon role sees ${anonProfiles.length} profiles`);
  if (anonProfiles.length === 0) {
    console.log('   ⚠️  RLS is likely blocking all rows\n');
  }
}

// Test 4: Check RLS policies
console.log('4️⃣  Checking RLS policy configuration...');
console.log('   RLS policies should allow:');
console.log('   - Users to read their OWN profile');
console.log('   - Admin users (internal tier) to read ALL profiles');
console.log('   - Service role to bypass RLS\n');

console.log('='.repeat(80));
console.log('DIAGNOSIS');
console.log('='.repeat(80));
console.log('');

if (anonError || (anonProfiles && anonProfiles.length === 0)) {
  console.log('❌ PROBLEM FOUND: RLS policies are too restrictive');
  console.log('');
  console.log('The admin panel uses the ANON_KEY (not SERVICE_ROLE_KEY) for security.');
  console.log('But the RLS policies on the profiles table are blocking all queries.');
  console.log('');
  console.log('SOLUTION:');
  console.log('Add an RLS policy that allows internal/admin users to read all profiles:');
  console.log('');
  console.log('CREATE POLICY "Admin users can read all profiles"');
  console.log('ON profiles FOR SELECT');
  console.log('TO authenticated');
  console.log('USING (');
  console.log('  -- Allow users to read their own profile');
  console.log('  auth.uid() = id');
  console.log('  OR');
  console.log('  -- Allow internal/admin users to read all profiles');
  console.log('  EXISTS (');
  console.log('    SELECT 1 FROM profiles');
  console.log('    WHERE profiles.id = auth.uid()');
  console.log('    AND profiles.subscription_tier = \'internal\'');
  console.log('  )');
  console.log(');');
} else {
  console.log('✅ RLS policies appear to be working correctly');
}
console.log('');
