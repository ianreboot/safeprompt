import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'ian.ho@rebootmedia.net')
    .single();
  
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Profile data:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkProfile();
