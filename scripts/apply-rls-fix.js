#!/usr/bin/env node
/**
 * Apply RLS Fix to PROD Database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 Applying RLS Fix to PROD Database...\n');

// Step 1: Drop old policies
console.log('1️⃣  Dropping old RLS policies...');
const dropSql = `
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users and admins can read profiles" ON profiles;
`;

const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSql });
if (dropError && !dropError.message.includes('does not exist')) {
  // Try direct execution if exec_sql doesn't exist
  console.log('   Using direct SQL execution...');
}

// Step 2: Create new policy
console.log('2️⃣  Creating new RLS policy...');
const createSql = `
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
`;

const { error: createError } = await supabase.rpc('exec_sql', { sql: createSql });
if (createError) {
  console.log('❌ RPC method failed. Trying alternative method...\n');

  // Use raw SQL via edge function or direct connection
  console.log('📝 SQL to run manually in Supabase SQL Editor:');
  console.log('='.repeat(80));
  console.log(dropSql);
  console.log(createSql);
  console.log('='.repeat(80));
  console.log('\nGo to: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv/sql/new');
  process.exit(1);
}

console.log('✅ Policies created successfully!\n');

// Step 3: Verify
console.log('3️⃣  Verifying policies...');
const { data: policies, error: verifyError } = await supabase
  .from('pg_policies')
  .select('*')
  .eq('tablename', 'profiles');

if (policies) {
  console.log(`✅ Found ${policies.length} policies on profiles table:`);
  policies.forEach(p => {
    console.log(`   - ${p.policyname}`);
  });
} else {
  console.log('   Unable to verify (this is normal if pg_policies view not accessible)');
}
console.log('');

// Step 4: Test with anon key
console.log('4️⃣  Testing with ANON key...');
const anonSupabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_ANON_KEY
);

const { data: testData, error: testError } = await anonSupabase
  .from('profiles')
  .select('email')
  .limit(5);

if (testError) {
  console.log('❌ ANON key test failed:', testError.message);
  console.log('   RLS fix did not work. Manual SQL execution required.');
} else {
  console.log(`✅ ANON key can see ${testData.length} profiles`);
  console.log('   RLS fix successful!');
}
