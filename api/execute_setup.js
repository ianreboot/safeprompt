import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_SUPABASE_URL;
const supabaseKey = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Executing database setup via RPC...\n');

// Read and split SQL file
const sql = fs.readFileSync('/tmp/setup_safeprompt_db.sql', 'utf8');

// We'll execute the key INSERTs via the client since we can't run DDL via RPC
async function setupDatabase() {
  try {
    // First check if we can query auth
    const { data: authData } = await supabase.auth.admin.listUsers();
    const ianUser = authData.users.find(u => u.email === 'ian.ho@rebootmedia.net');
    
    if (!ianUser) {
      console.log('❌ ian.ho user not found');
      return;
    }
    
    console.log('✅ Found ian.ho user:', ianUser.id);
    
    // Try to insert directly into profiles table
    console.log('\nAttempting to insert profile...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: ianUser.id,
        email: 'ian.ho@rebootmedia.net',
        subscription_tier: 'early_bird',
        subscription_status: 'active',
        api_key_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Hash of internal key
        api_key_hint: '2025',
        api_requests_limit: 999999,
        api_requests_used: 0,
        is_active: true
      })
      .select();
    
    if (profileError) {
      if (profileError.code === 'PGRST204' || profileError.code === 'PGRST205') {
        console.log('❌ Table does not exist yet');
        console.log('\n📋 SQL MUST be run manually in Supabase Dashboard:');
        console.log('   https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/sql/new');
        console.log('\n   Copy SQL from: /tmp/setup_safeprompt_db.sql');
      } else {
        console.log('❌ Error:', profileError.message);
        console.log('   Code:', profileError.code);
      }
    } else {
      console.log('✅ Profile created/updated successfully!');
      console.log(profile);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupDatabase();
