#!/usr/bin/env node
/**
 * Fix RLS for api_logs and waitlist tables
 */

require('dotenv').config({ path: '/home/projects/.env' });

const PROJECT_REF = process.env.SAFEPROMPT_PROD_PROJECT_REF;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function executeSQL(sql, description) {
  console.log(`\n📝 ${description}...`);

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
    console.log('   ✅ Success');
    return { success: true, data };
  } else {
    console.log('   ❌ Failed:', data);
    return { success: false, error: data };
  }
}

async function fixRLS() {
  console.log('🔧 FIXING RLS FOR API_LOGS AND WAITLIST');
  console.log('='.repeat(70));

  // Fix api_logs table
  console.log('\n1. API_LOGS TABLE');
  console.log('-'.repeat(70));

  const apiLogsSQL = `
-- Users can read their own API logs
CREATE POLICY "Users can read own api logs"
ON api_logs FOR SELECT
TO authenticated
USING (
  profile_id = auth.uid()
  OR
  public.is_internal_user() = true
);

-- Allow inserting logs (for API calls)
CREATE POLICY "Allow api log creation"
ON api_logs FOR INSERT
TO authenticated, anon
WITH CHECK (true);
  `.trim();

  await executeSQL(apiLogsSQL, 'Creating api_logs RLS policies');

  // Fix waitlist table
  console.log('\n2. WAITLIST TABLE');
  console.log('-'.repeat(70));

  const waitlistSQL = `
-- Allow anyone to join waitlist
CREATE POLICY "Anyone can join waitlist"
ON waitlist FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only internal users can read waitlist
CREATE POLICY "Internal users can read waitlist"
ON waitlist FOR SELECT
TO authenticated
USING (public.is_internal_user() = true);
  `.trim();

  await executeSQL(waitlistSQL, 'Creating waitlist RLS policies');

  // Verify
  console.log('\n3. VERIFICATION');
  console.log('-'.repeat(70));

  const verifySQL = `
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('api_logs', 'waitlist')
ORDER BY tablename, policyname;
  `.trim();

  const result = await executeSQL(verifySQL, 'Verifying new policies');

  if (result.success && result.data) {
    console.log('\n📋 POLICIES CREATED:');
    result.data.forEach(p => {
      console.log(`   ${p.tablename}.${p.policyname} (${p.cmd})`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ RLS POLICIES COMPLETE');
  console.log('='.repeat(70));
  console.log('\nFixed:');
  console.log('  • api_logs: Users can read own logs, internal users read all');
  console.log('  • waitlist: Anyone can join, internal users can view');
}

fixRLS().catch(console.error);
