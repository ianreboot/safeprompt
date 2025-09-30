import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from multiple sources
dotenv.config({ path: path.join(__dirname, '../dashboard/.env.local') });
dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Using Supabase URL:', supabaseUrl);
console.log('Service key loaded:', supabaseKey ? 'Yes' : 'No');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccount() {
  console.log('\n🔍 Checking ian.ho@rebootmedia.net account...\n');
  
  // Check profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'ian.ho@rebootmedia.net')
    .single();
    
  if (profileError) {
    console.log('❌ Profile Error:', profileError.message);
    console.log('   Code:', profileError.code);
  } else if (profile) {
    console.log('✅ PROFILE FOUND:');
    console.log('   Email:', profile.email);
    console.log('   Tier:', profile.subscription_tier);
    console.log('   Status:', profile.subscription_status);
    console.log('   API Key Hint:', profile.api_key_hint);
    console.log('   Request Limit:', profile.api_requests_limit);
    console.log('   Requests Used:', profile.api_requests_used);
    console.log('   Created:', profile.created_at);
    console.log('');
  } else {
    console.log('⚠️  No profile found\n');
  }
  
  // Check auth users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.log('❌ Auth Error:', authError.message);
  } else {
    const user = users.find(u => u.email === 'ian.ho@rebootmedia.net');
    if (user) {
      console.log('✅ AUTH USER FOUND:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Email Confirmed:', user.email_confirmed_at ? 'Yes (' + user.email_confirmed_at + ')' : 'No');
      console.log('   Created:', user.created_at);
      console.log('   Last Sign In:', user.last_sign_in_at || 'Never');
      console.log('');
    } else {
      console.log('⚠️  No auth user found\n');
    }
  }
}

checkAccount().catch(console.error);
