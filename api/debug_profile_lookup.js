import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

const INTERNAL_API_KEY = 'sp_test_unlimited_dogfood_key_2025';

async function testProfileLookup() {
  console.log('Testing profile lookup for internal API key...\n');

  // Method 1: Query by api_key (what the code does)
  console.log('Method 1: Query by api_key field');
  const { data: profile1, error: error1 } = await supabase
    .from('profiles')
    .select('id, email, api_key')
    .eq('api_key', INTERNAL_API_KEY)
    .single();

  if (error1) {
    console.log('❌ Error:', error1.message);
    console.log('   Code:', error1.code);
  } else if (profile1) {
    console.log('✅ Found profile:');
    console.log('   ID:', profile1.id);
    console.log('   Email:', profile1.email);
    console.log('   API Key:', profile1.api_key);
  } else {
    console.log('⚠️  No profile found');
  }

  // Method 2: Query by api_key_hash (backup check)
  console.log('\nMethod 2: Query by email');
  const { data: profile2, error: error2 } = await supabase
    .from('profiles')
    .select('id, email, api_key')
    .eq('email', 'ian.ho@rebootmedia.net')
    .single();

  if (error2) {
    console.log('❌ Error:', error2.message);
  } else if (profile2) {
    console.log('✅ Found profile:');
    console.log('   ID:', profile2.id);
    console.log('   Email:', profile2.email);
    console.log('   API Key:', profile2.api_key);
  }

  // Try a test insert
  console.log('\nTesting INSERT to api_logs...');
  const { data: insertData, error: insertError } = await supabase
    .from('api_logs')
    .insert({
      profile_id: profile1?.id || profile2?.id,
      endpoint: '/api/v1/validate/test',
      response_time_ms: 123,
      safe: true,
      threats: [],
      prompt_length: 25
    })
    .select();

  if (insertError) {
    console.log('❌ Insert failed:', insertError.message);
  } else {
    console.log('✅ Insert successful!');
    console.log('   Log ID:', insertData[0].id);
  }
}

testProfileLookup();