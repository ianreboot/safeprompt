#!/usr/bin/env node
/**
 * Drop deprecated tables from SafePrompt database
 * Tables to drop: users, api_keys, validation_logs
 */

require('dotenv').config({ path: '/home/projects/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function dropDeprecatedTables() {
  console.log('🗑️  Dropping deprecated tables from SafePrompt database...\n');

  const tablesToDrop = ['users', 'api_keys', 'validation_logs'];

  for (const table of tablesToDrop) {
    console.log(`Checking if ${table} exists...`);

    // Try to query the table to see if it exists
    const { data, error } = await supabase
      .from(table)
      .select('count')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log(`  ✓ ${table} - already doesn't exist\n`);
      continue;
    }

    if (!error) {
      // Table exists, need to drop it via RPC
      console.log(`  ⚠️  ${table} exists - attempting to drop...`);

      // Try using rpc to execute SQL
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('exec_sql', { sql_query: `DROP TABLE IF EXISTS ${table} CASCADE;` });

      if (rpcError) {
        console.log(`  ❌ Cannot drop ${table} via RPC: ${rpcError.message}`);
        console.log(`  💡 Please manually drop this table in Supabase SQL Editor:`);
        console.log(`     DROP TABLE IF EXISTS ${table} CASCADE;\n`);
      } else {
        console.log(`  ✅ Successfully dropped ${table}\n`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('MANUAL ACTION REQUIRED');
  console.log('='.repeat(60));
  console.log('\nThe Supabase service role key cannot execute DDL operations.');
  console.log('Please run this SQL manually in Supabase SQL Editor:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/sql/new');
  console.log('2. Copy and paste this SQL:\n');
  console.log('   DROP TABLE IF EXISTS users CASCADE;');
  console.log('   DROP TABLE IF EXISTS api_keys CASCADE;');
  console.log('   DROP TABLE IF EXISTS validation_logs CASCADE;\n');
  console.log('3. Click "Run" to execute');
  console.log('='.repeat(60));
}

dropDeprecatedTables().catch(console.error);
