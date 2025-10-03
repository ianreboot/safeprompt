#!/usr/bin/env node
/**
 * Fix Admin Panel RLS Policies
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 Fixing Admin Panel RLS Policies...\n');

// Drop existing policies
console.log('1️⃣  Dropping existing SELECT policies...');
await supabase.rpc('exec_sql', {
  sql: `
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users and admins can read profiles" ON profiles;
  `
}).catch(e => console.log('   (Policies may not exist yet, continuing...)'));

// Create new comprehensive policy
console.log('2️⃣  Creating new RLS policy...');
const { error } = await supabase.rpc('exec_sql', {
  sql: `
CREATE POLICY "Users and admins can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Allow users to read their own profile
  auth.uid() = id
  OR
  -- Allow internal/admin users to read all profiles
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.subscription_tier = 'internal'
  )
);
  `
});

if (error) {
  console.log('❌ Error creating policy:', error);
  console.log('\nNote: The exec_sql RPC function may not exist.');
  console.log('You need to run this SQL manually in Supabase SQL Editor:\n');
  console.log('-- Drop old policies');
  console.log('DROP POLICY IF EXISTS "Users can read own profile" ON profiles;');
  console.log('DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;');
  console.log('DROP POLICY IF EXISTS "Users and admins can read profiles" ON profiles;\n');
  console.log('-- Create new policy');
  console.log('CREATE POLICY "Users and admins can read profiles"');
  console.log('ON profiles FOR SELECT');
  console.log('TO authenticated');
  console.log('USING (');
  console.log('  auth.uid() = id');
  console.log('  OR');
  console.log('  EXISTS (');
  console.log('    SELECT 1 FROM profiles');
  console.log('    WHERE profiles.id = auth.uid()');
  console.log('    AND profiles.subscription_tier = \'internal\'');
  console.log('  )');
  console.log(');');
} else {
  console.log('✅ Policy created successfully!\n');

  // Test the policy
  console.log('3️⃣  Testing policy with ANON_KEY...');
  const anonSupabase = createClient(
    process.env.SAFEPROMPT_PROD_SUPABASE_URL,
    process.env.SAFEPROMPT_PROD_SUPABASE_ANON_KEY
  );

  const { data, error: testError } = await anonSupabase
    .from('profiles')
    .select('email')
    .limit(5);

  if (testError) {
    console.log('❌ Test failed:', testError);
  } else {
    console.log(`✅ Test passed! Can see ${data.length} profiles`);
  }
}
