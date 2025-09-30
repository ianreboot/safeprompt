import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_SUPABASE_URL;
const supabaseKey = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking SafePrompt database status...\n');
  
  // Check profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);
  
  if (profilesError) {
    console.log('❌ Profiles table:', profilesError.message);
    console.log('   Code:', profilesError.code);
  } else {
    console.log('✅ Profiles table EXISTS');
    console.log('   Total profiles:', profiles.length);
    
    // Check for ian.ho
    const { data: ian } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'ian.ho@rebootmedia.net')
      .single();
    
    if (ian) {
      console.log('\n✅ ian.ho@rebootmedia.net profile:');
      console.log('   Tier:', ian.subscription_tier);
      console.log('   Status:', ian.subscription_status);
      console.log('   Limit:', ian.api_requests_limit);
      console.log('   API Key Hint:', ian.api_key_hint);
    } else {
      console.log('\n⚠️  ian.ho profile not found');
    }
  }
  
  // Check waitlist table
  const { data: waitlist, error: waitlistError } = await supabase
    .from('waitlist')
    .select('*')
    .limit(1);
  
  if (waitlistError) {
    console.log('\n❌ Waitlist table:', waitlistError.message);
  } else {
    console.log('\n✅ Waitlist table EXISTS');
  }
}

checkTables();
