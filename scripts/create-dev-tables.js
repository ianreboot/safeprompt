#!/usr/bin/env node

/**
 * Create missing tables in DEV database
 * Creates intelligence_logs and job_metrics tables needed for Phase 1A monitoring
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/projects/.env' });

const SUPABASE_URL = process.env.SAFEPROMPT_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createTables() {
  console.log('🔧 Creating missing tables in DEV database...\n');

  // Check if tables exist
  const { data: existingLogs, error: logsError } = await supabase
    .from('intelligence_logs')
    .select('id')
    .limit(1);

  const { data: existingMetrics, error: metricsError } = await supabase
    .from('job_metrics')
    .select('id')
    .limit(1);

  if (!logsError) {
    console.log('✅ intelligence_logs table already exists');
  } else if (logsError.code === '42P01') {
    console.log('❌ intelligence_logs table missing - needs manual SQL execution');
    console.log('   Run the SQL from: /home/projects/safeprompt/supabase/migrations/20251007010000_create_missing_tables.sql');
  } else {
    console.log('⚠️  intelligence_logs check error:', logsError.message);
  }

  if (!metricsError) {
    console.log('✅ job_metrics table already exists');
  } else if (metricsError.code === '42P01') {
    console.log('❌ job_metrics table missing - needs manual SQL execution');
    console.log('   Run the SQL from: /home/projects/safeprompt/supabase/migrations/20251007010000_create_missing_tables.sql');
  } else {
    console.log('⚠️  job_metrics check error:', metricsError.message);
  }

  console.log('\n📝 Manual SQL execution required:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Copy contents of: /home/projects/safeprompt/supabase/migrations/20251007010000_create_missing_tables.sql');
  console.log('   4. Execute the SQL');
  console.log('   5. Re-run Phase 1A validation script');
}

createTables().catch(console.error);
