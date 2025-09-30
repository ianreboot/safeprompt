import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function checkLogs() {
  console.log('🔍 Checking api_logs table for existing data...\n');
  
  // Check total count
  const { count: totalCount } = await supabase
    .from('api_logs')
    .select('*', { count: 'exact', head: true });
  
  console.log('Total logs in database:', totalCount || 0);
  
  if (totalCount && totalCount > 0) {
    // Get recent logs
    const { data: recentLogs } = await supabase
      .from('api_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log('\nRecent logs:');
    recentLogs?.forEach((log, i) => {
      console.log(`\n${i+1}. ${log.created_at}`);
      console.log('   Endpoint:', log.endpoint);
      console.log('   Safe:', log.safe);
      console.log('   Response time:', log.response_time_ms, 'ms');
    });
  } else {
    console.log('\n⚠️  NO LOGS FOUND - API is not writing to database!');
    console.log('   Despite API being used, no data is being logged.');
  }
  
  // Check ian.ho profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('api_requests_used, api_requests_limit')
    .eq('email', 'ian.ho@rebootmedia.net')
    .single();
  
  console.log('\n\nian.ho profile usage:');
  console.log('   Requests used:', profile?.api_requests_used || 0);
  console.log('   Requests limit:', profile?.api_requests_limit || 0);
  
  if ((profile?.api_requests_used || 0) === 0) {
    console.log('\n⚠️  Usage counter is 0 - API not incrementing requests!');
  }
}

checkLogs();
