#!/usr/bin/env node
require('dotenv').config({ path: '/home/projects/.env' });
const fs = require('fs');

const PROJECT_REF = process.env.SAFEPROMPT_PROD_PROJECT_REF;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function deploySchema() {
  console.log('🚀 DEPLOYING PRODUCTION DATABASE SCHEMA\n');
  console.log('Project:', PROJECT_REF);
  console.log('URL:', process.env.SAFEPROMPT_PROD_SUPABASE_URL);
  console.log('\n' + '='.repeat(70) + '\n');

  // Read the setup.sql file
  const sql = fs.readFileSync('/home/projects/safeprompt/database/setup.sql', 'utf8');

  console.log('📄 Executing setup.sql...\n');

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
    console.log('✅ Schema deployed successfully!\n');
    if (data && data.length > 0) {
      console.log('Result:', JSON.stringify(data, null, 2));
    }
    return true;
  } else {
    console.log('❌ Schema deployment failed!\n');
    console.log('Error:', JSON.stringify(data, null, 2));
    return false;
  }
}

async function verifySchema() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFYING SCHEMA DEPLOYMENT');
  console.log('='.repeat(70) + '\n');

  // Check tables
  const tablesSql = `
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
  `.trim();

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: tablesSql })
    }
  );

  const tables = await response.json();

  console.log('📊 Tables Created:');
  tables.forEach(t => {
    console.log(`  - ${t.tablename} (RLS: ${t.rls_enabled ? '✅' : '❌'})`);
  });

  // Check RLS policies
  const policiesSql = `
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
  `.trim();

  const policyResponse = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: policiesSql })
    }
  );

  const policies = await policyResponse.json();

  console.log('\n🔐 RLS Policies Created:');
  let currentTable = '';
  policies.forEach(p => {
    if (p.tablename !== currentTable) {
      currentTable = p.tablename;
      console.log(`\n  ${p.tablename}:`);
    }
    console.log(`    - ${p.policyname} (${p.cmd})`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ PRODUCTION DATABASE READY');
  console.log('='.repeat(70));
}

async function main() {
  const success = await deploySchema();
  if (success) {
    await verifySchema();
  }
}

main().catch(console.error);
