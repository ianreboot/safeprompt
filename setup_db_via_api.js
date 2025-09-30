import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_SUPABASE_URL;
const supabaseKey = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Setting up SafePrompt database via Service Role Key...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('1. Creating profiles table...');
    
    // We'll use a series of queries that the service role can execute
    // Note: CREATE TABLE might not work via RPC, so we'll check if table exists first
    
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tablesError && tablesError.code === 'PGRST204') {
      console.log('   ❌ Profiles table does not exist');
      console.log('   ⚠️  Cannot create tables via service role key alone');
      console.log('\n📋 SOLUTION: Database password required for DDL operations');
      console.log('🔍 Checking for database password...\n');
      
      // Check if we can get connection info from Supabase
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError) {
        console.log(`✅ Service role key works - found ${authUsers.users.length} auth users`);
        console.log('\n🚨 NEXT STEP: Get database password from Supabase Dashboard');
        console.log('   1. Go to: https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/settings/database');
        console.log('   2. Click "Connection string" tab');
        console.log('   3. Copy the database password');
        console.log('   4. Add to /home/projects/.env as: SAFEPROMPT_SUPABASE_DB_PASSWORD="password"');
        console.log('\n   Then re-run this script to execute SQL via psql\n');
      }
    } else if (!tablesError) {
      console.log('   ✅ Profiles table already exists!');
      console.log(`   Found ${tables?.length || 0} profiles`);
      
      // Check if ian.ho exists
      const { data: ianProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'ian.ho@rebootmedia.net')
        .single();
        
      if (ianProfile) {
        console.log('\n✅ ian.ho@rebootmedia.net profile EXISTS:');
        console.log('   Tier:', ianProfile.subscription_tier);
        console.log('   Status:', ianProfile.subscription_status);
        console.log('   Limit:', ianProfile.api_requests_limit);
        console.log('   Used:', ianProfile.api_requests_used);
      } else {
        console.log('\n⚠️  ian.ho@rebootmedia.net profile MISSING');
        console.log('   Need to create it via INSERT');
      }
    } else {
      console.log('   Error:', tablesError.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupDatabase();
