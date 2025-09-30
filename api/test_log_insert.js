import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
  console.log('Testing direct insert to api_logs...\n');

  // Get ian.ho profile ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('api_key', 'sp_test_unlimited_dogfood_key_2025')
    .single();

  console.log('Profile ID:', profile?.id);

  if (!profile) {
    console.log('❌ Could not find profile');
    return;
  }

  // Try to insert a log
  console.log('\nAttempting insert...');
  const { data, error } = await supabase
    .from('api_logs')
    .insert({
      profile_id: profile.id,
      endpoint: '/api/v1/validate',
      response_time_ms: 100,
      safe: true,
      threats: [],
      prompt_length: 20
    })
    .select();

  if (error) {
    console.log('❌ Insert failed:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);
  } else {
    console.log('✅ Insert successful!');
    console.log('   Log ID:', data[0].id);
  }

  // Check total count
  const { count } = await supabase
    .from('api_logs')
    .select('*', { count: 'exact', head: true });

  console.log('\nTotal logs in database:', count);
}

testInsert();