#!/usr/bin/env node
require('dotenv').config({ path: '/home/projects/.env' });

const PROJECT_REF = 'vkyggknknyfallmnrmfu';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function executeSQL(description, sql) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔧 ${description}`);
  console.log('='.repeat(70));
  console.log('\nSQL:');
  console.log(sql);
  console.log('');

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
    console.log('✅ SUCCESS');
    if (data && data.length > 0) {
      console.log('Result:', JSON.stringify(data, null, 2));
    }
  } else {
    console.log('❌ FAILED');
    console.log('Error:', JSON.stringify(data, null, 2));
  }
  
  return response.ok;
}

async function executeAllFixes() {
  console.log('\n🚀 EXECUTING ALL SAFEPROMPT FIXES\n');

  // Fix 1: Add INSERT policy for profiles
  await executeSQL(
    'FIX 1: Add INSERT policy for profiles table',
    `
CREATE POLICY "Allow authenticated profile creation"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
    `.trim()
  );

  // Fix 2: Create missing profiles
  await executeSQL(
    'FIX 2: Create missing profiles for linpap and ian',
    `
-- First check which profiles are missing
DO $$
DECLARE
  missing_user RECORD;
BEGIN
  FOR missing_user IN 
    SELECT au.id, au.email 
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO profiles (id, email, subscription_tier, subscription_status)
    VALUES (missing_user.id, missing_user.email, 'free', 'inactive');
    
    RAISE NOTICE 'Created profile for %', missing_user.email;
  END LOOP;
END $$;

-- Return count of profiles
SELECT COUNT(*) as total_profiles FROM profiles;
    `.trim()
  );

  // Fix 3: Rename billing_events.user_id to profile_id
  await executeSQL(
    'FIX 3: Rename billing_events.user_id to profile_id',
    `
ALTER TABLE billing_events 
RENAME COLUMN user_id TO profile_id;
    `.trim()
  );

  // Fix 4: Add RLS policy for user billing history
  await executeSQL(
    'FIX 4: Add RLS policy for users to view own billing events',
    `
CREATE POLICY "Users can view own billing events"
ON billing_events FOR SELECT
TO authenticated
USING (profile_id = auth.uid());
    `.trim()
  );

  // Verify all fixes
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICATION');
  console.log('='.repeat(70));

  await executeSQL(
    'Verify profiles count matches auth.users',
    `
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) as counts_match;
    `.trim()
  );

  await executeSQL(
    'Verify billing_events column renamed',
    `
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'billing_events' 
  AND column_name IN ('user_id', 'profile_id');
    `.trim()
  );

  await executeSQL(
    'Verify all RLS policies on profiles',
    `
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
    `.trim()
  );

  console.log('\n' + '='.repeat(70));
  console.log('✅ ALL FIXES COMPLETED');
  console.log('='.repeat(70));
}

executeAllFixes().catch(console.error);
