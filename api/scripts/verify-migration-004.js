#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_PROD_SUPABASE_URL;
const supabaseServiceKey = process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
  console.log('🔍 Verifying Migration 004: Alerts System');
  console.log('');

  let allPassed = true;

  // Check alerts table
  console.log('Checking alerts table...');
  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .select('*')
    .limit(1);

  if (alertsError) {
    console.log('❌ Alerts table not found:', alertsError.message);
    allPassed = false;
  } else {
    console.log('✅ Alerts table exists');
  }

  // Check error_logs table
  console.log('Checking error_logs table...');
  const { data: errorLogs, error: errorLogsError } = await supabase
    .from('error_logs')
    .select('*')
    .limit(1);

  if (errorLogsError) {
    console.log('❌ Error_logs table not found:', errorLogsError.message);
    allPassed = false;
  } else {
    console.log('✅ Error_logs table exists');
  }

  // Check cost_logs table
  console.log('Checking cost_logs table...');
  const { data: costLogs, error: costLogsError } = await supabase
    .from('cost_logs')
    .select('*')
    .limit(1);

  if (costLogsError) {
    console.log('❌ Cost_logs table not found:', costLogsError.message);
    allPassed = false;
  } else {
    console.log('✅ Cost_logs table exists');
  }

  // Test inserting an alert
  console.log('');
  console.log('Testing alert insertion...');
  const { data: testAlert, error: insertError } = await supabase
    .from('alerts')
    .insert({
      alert_type: 'system',
      severity: 'info',
      title: 'Migration 004 Verification',
      message: 'Testing alert system - this is a test alert',
      metadata: { test: true }
    })
    .select()
    .single();

  if (insertError) {
    console.log('❌ Failed to insert test alert:', insertError.message);
    allPassed = false;
  } else {
    console.log('✅ Test alert created:', testAlert.id);

    // Clean up test alert
    await supabase
      .from('alerts')
      .delete()
      .eq('id', testAlert.id);
    console.log('✅ Test alert cleaned up');
  }

  console.log('');
  if (allPassed) {
    console.log('✅ Migration 004 verified successfully!');
  } else {
    console.log('❌ Migration 004 verification failed');
    process.exit(1);
  }
}

verifyMigration();
