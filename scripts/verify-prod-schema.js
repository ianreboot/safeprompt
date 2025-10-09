#!/usr/bin/env node
/**
 * Verify PROD database schema exists
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

const supabase = createClient(
  'https://adyfhzbcsqzgqvyimycv.supabase.co',
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Verifying PROD database schema...\n');

// Check if tables exist by querying them
const tables = ['validation_sessions', 'session_requests', 'session_attack_patterns'];

for (const table of tables) {
  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`❌ Table '${table}': ERROR - ${error.message}`);
  } else {
    console.log(`✅ Table '${table}': EXISTS (${count || 0} rows)`);
  }
}

console.log('\n✅ Schema verification complete');
