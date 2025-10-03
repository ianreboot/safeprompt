import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 Setting ian.ho@rebootmedia.net to internal tier...\n');

async function setInternal() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'internal',
        subscription_status: 'active',
        api_requests_limit: 999999999
      })
      .eq('email', 'ian.ho@rebootmedia.net')
      .select();

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Profile updated to internal tier');
      console.log('   Tier:', data[0].subscription_tier);
      console.log('   Status:', data[0].subscription_status);
      console.log('   Limit:', data[0].api_requests_limit);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setInternal();
