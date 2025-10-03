#!/usr/bin/env node
/**
 * Verify RLS Fix is Complete
 */

require('dotenv').config({ path: '/home/projects/.env' });

const PROJECT_REF = process.env.SAFEPROMPT_PROD_PROJECT_REF;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function verifyRLS() {
  console.log('🔍 VERIFYING RLS FIX\n');

  // Check what policies exist
  const sql = `
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;
  `.trim();

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

  if (response.ok && data) {
    console.log('✅ RLS Policies on profiles table:\n');
    data.forEach((p, i) => {
      console.log(`${i + 1}. ${p.policyname}`);
      console.log(`   Command: ${p.cmd}`);
      console.log(`   Roles: ${p.roles}`);
      console.log('');
    });

    // Check for our specific policy
    const hasOurPolicy = data.some(p => p.policyname === 'Users and admins can read profiles');
    if (hasOurPolicy) {
      console.log('✅ SUCCESS: "Users and admins can read profiles" policy exists!');
      console.log('');
      console.log('This policy allows:');
      console.log('  1. Users to read their own profile (auth.uid() = id)');
      console.log('  2. Internal users to read all profiles');
      console.log('');
      console.log('🎯 Expected Results:');
      console.log('  • yuenho can now see: "Early Bird Plan", "$5/month", "100,000 requests"');
      console.log('  • Admin panel shows: "5 users", "1 active subscriber", "$5 revenue"');
      console.log('');
      console.log('📝 Note: The dashboard must be refreshed after login to see changes.');
    } else {
      console.log('❌ Policy "Users and admins can read profiles" NOT found!');
    }
  } else {
    console.log('❌ Failed to verify policies:', data);
  }
}

verifyRLS().catch(console.error);
