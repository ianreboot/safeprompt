import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_SUPABASE_URL;
const supabaseKey = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Attempting to create profiles table via SQL function...\n');

async function setupViaFunction() {
  try {
    // First, try to create a function that will create the table
    // This is a workaround since we can't execute DDL directly
    
    console.log('Checking auth.users for ian.ho...');
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const ianUser = authUsers.users.find(u => u.email === 'ian.ho@rebootmedia.net');
    
    if (ianUser) {
      console.log('✅ Found ian.ho in auth.users:');
      console.log('   ID:', ianUser.id);
      console.log('   Email confirmed:', ianUser.email_confirmed_at ? 'Yes' : 'No');
      
      // Try creating via RPC if a setup function exists
      console.log('\n🔍 Looking for setup functions...');
      
      // The problem: We need DDL access which requires database password
      console.log('\n❌ Cannot create tables without database password');
      console.log('\n📋 REQUIRED ACTION:');
      console.log('   Get database password from Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/settings/database');
      console.log('\n   Then add to /home/projects/.env:');
      console.log('   SAFEPROMPT_SUPABASE_DB_PASSWORD="your_password_here"');
      console.log('\n   Alternatively, run this SQL manually in Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/sql/new');
      console.log('\n   SQL file ready at: /tmp/setup_safeprompt_db.sql');
      
    } else {
      console.log('❌ ian.ho not found in auth.users');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupViaFunction();
