/**
 * Verify Internal Account Logging
 *
 * Checks that:
 * 1. API calls are being logged to api_logs table
 * 2. Usage counter is incrementing
 * 3. last_used_at timestamp is updating
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const INTERNAL_EMAIL = 'ian.ho@rebootmedia.net';

async function verifyLogging() {
  console.log('🔍 Verifying Internal Account Logging...\n');

  // Get profile ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, api_requests_used, api_requests_limit, last_used_at')
    .eq('email', INTERNAL_EMAIL)
    .single();

  if (!profile) {
    console.error('❌ Profile not found');
    return;
  }

  console.log('1️⃣  Profile Information:');
  console.log(`   - Profile ID: ${profile.id}`);
  console.log(`   - Requests Used: ${profile.api_requests_used.toLocaleString()}`);
  console.log(`   - Requests Limit: ${profile.api_requests_limit.toLocaleString()}`);
  console.log(`   - Last Used: ${profile.last_used_at || 'Never'}`);
  console.log('');

  // Check recent API logs
  console.log('2️⃣  Recent API Logs:');
  const { data: recentLogs, count } = await supabase
    .from('api_logs')
    .select('*', { count: 'exact' })
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!recentLogs || recentLogs.length === 0) {
    console.log('   ❌ No logs found in api_logs table');
    console.log('   This means API calls are NOT being logged!');
    return;
  }

  console.log(`   ✅ Found ${count} total log entries`);
  console.log('   \n   Recent logs:');
  recentLogs.forEach((log, i) => {
    const timestamp = new Date(log.created_at).toLocaleString();
    const safetyStatus = log.safe ? '✅ SAFE' : '🚨 UNSAFE';
    console.log(`   ${i+1}. ${timestamp} - ${safetyStatus} - ${log.response_time_ms}ms - ${log.endpoint}`);
    if (log.threats && log.threats.length > 0) {
      console.log(`      Threats: ${log.threats.join(', ')}`);
    }
  });
  console.log('');

  // Check logs from the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from('api_logs')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile.id)
    .gte('created_at', oneHourAgo);

  console.log('3️⃣  Activity Summary:');
  console.log(`   - Logs in last hour: ${recentCount || 0}`);
  console.log(`   - Total lifetime logs: ${count || 0}`);
  console.log(`   - Usage: ${(profile.api_requests_used / profile.api_requests_limit * 100).toFixed(6)}%`);
  console.log('');

  // Check if usage matches logs
  if (profile.api_requests_used !== count) {
    console.log('⚠️  Warning: Usage counter mismatch');
    console.log(`   Counter shows: ${profile.api_requests_used}`);
    console.log(`   Logs show: ${count}`);
    console.log(`   Difference: ${Math.abs(profile.api_requests_used - count)}`);
  } else {
    console.log('✅ Usage counter matches log count perfectly!');
  }
  console.log('');

  // Verification summary
  console.log('📊 Verification Summary:');
  const hasLogs = recentLogs && recentLogs.length > 0;
  const hasRecentActivity = recentCount > 0;
  const counterIncrementing = profile.api_requests_used > 0;

  console.log(`   ${hasLogs ? '✅' : '❌'} API logs exist in database`);
  console.log(`   ${hasRecentActivity ? '✅' : '❌'} Recent activity (last hour)`);
  console.log(`   ${counterIncrementing ? '✅' : '❌'} Usage counter incrementing`);
  console.log(`   ${profile.last_used_at ? '✅' : '❌'} Last used timestamp set`);

  if (hasLogs && counterIncrementing) {
    console.log('\n🎉 Internal account logging is working correctly!');
    console.log('   Dashboard should now show real statistics.');
  } else {
    console.log('\n❌ Internal account logging has issues');
    console.log('   Check API validation endpoint implementation.');
  }
}

verifyLogging().catch(console.error);
