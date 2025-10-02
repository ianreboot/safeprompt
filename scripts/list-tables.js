#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function listTables() {
  console.log('Checking SafePrompt database...\n');
  console.log('Project URL:', process.env.SAFEPROMPT_SUPABASE_URL);

  // Try to query a known Supabase system table to verify connection
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Auth error:', authError.message);
  } else {
    console.log(`\nFound ${authUsers?.users?.length || 0} users in auth.users`);
    if (authUsers?.users?.length > 0) {
      console.log('Sample users:');
      authUsers.users.slice(0, 3).forEach(u => {
        console.log(`  - ${u.email} (${u.id})`);
      });
    }
  }

  // Try various table names that might exist
  const tablesToCheck = ['profiles', 'api_logs', 'waitlist', 'subscriptions'];

  console.log('\nChecking for tables:');
  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log(`  ✗ ${table} - does not exist`);
      } else {
        console.log(`  ? ${table} - ${error.message}`);
      }
    } else {
      console.log(`  ✓ ${table} - exists`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('IMPORTANT: The profiles table needs to be created!');
  console.log('='.repeat(60));
  console.log('\nTo create it:');
  console.log('1. Go to Supabase SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${process.env.SAFEPROMPT_SUPABASE_URL.split('//')[1].split('.')[0]}/sql/new`);
  console.log('\n2. Run the SQL from: /home/projects/safeprompt/database/add-internal-flag.sql');
  console.log('   or: /home/projects/safeprompt/scripts/setup-database.js');
  console.log('\n3. Then run: node scripts/create-test-user.js');
}

listTables().catch(console.error);