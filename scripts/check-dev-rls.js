#!/usr/bin/env node
/**
 * Check DEV Database RLS Policies
 */

require('dotenv').config({ path: '/home/projects/.env' });

const DEV_PROJECT_REF = 'vkyggknknyfallmnrmfu';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function queryDatabase(sql, description) {
  console.log(`\n📊 ${description}...`);

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${DEV_PROJECT_REF}/database/query`,
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
    console.log('   ❌ Failed:', data);
    return { success: false, error: data };
  }
}

async function checkDev() {
  console.log('🔍 CHECKING DEV DATABASE RLS POLICIES');
  console.log('Project:', DEV_PROJECT_REF);
  console.log('='.repeat(70));

  // Check if is_internal_user function exists
  const checkFunctionSQL = `
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'is_internal_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  `.trim();

  const funcResult = await queryDatabase(checkFunctionSQL, 'Checking for is_internal_user() function');

  if (funcResult.success && funcResult.data.length > 0) {
    console.log('   ✅ Function exists (SECURITY DEFINER:', funcResult.data[0].prosecdef + ')');
  } else {
    console.log('   ⚠️  Function NOT found - needs to be created');
  }

  // Check RLS policies on profiles
  const policiesSQL = `
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'api_logs', 'waitlist')
ORDER BY tablename, policyname;
  `.trim();

  const policiesResult = await queryDatabase(policiesSQL, 'Checking RLS policies');

  if (policiesResult.success) {
    const byTable = {};
    policiesResult.data.forEach(p => {
      if (!byTable[p.tablename]) byTable[p.tablename] = [];
      byTable[p.tablename].push(`${p.policyname} (${p.cmd})`);
    });

    console.log('\n📋 RLS Policies by table:');
    for (const [table, policies] of Object.entries(byTable)) {
      console.log(`\n   ${table}:`);
      policies.forEach(p => console.log(`      - ${p}`));
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎯 RECOMMENDATION');
  console.log('='.repeat(70));

  if (funcResult.success && funcResult.data.length > 0) {
    console.log('\n✅ DEV database has is_internal_user() function');
    console.log('   Likely safe, but verify policies match PROD');
  } else {
    console.log('\n⚠️  DEV database MISSING is_internal_user() function');
    console.log('   Run fix-rls-final.js against DEV to fix');
    console.log('   Or apply same policies manually');
  }
}

checkDev().catch(console.error);
