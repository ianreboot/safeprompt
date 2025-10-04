#!/usr/bin/env node
/**
 * Check if admin user exists and get auth status
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_PROD_SUPABASE_URL;
const supabaseServiceKey = process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Checking admin user status...');
console.log('');

async function checkAdminUser() {
  // Check profiles table
  console.log('1. Checking profiles table:');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'ian.ho@rebootmedia.net')
    .single();

  if (profileError) {
    console.log('❌ Error:', profileError.message);
  } else {
    console.log('✅ Profile found:');
    console.log('   Email:', profile.email);
    console.log('   is_admin:', profile.is_admin);
    console.log('   Subscription tier:', profile.subscription_tier);
    console.log('   User ID:', profile.id);
  }
  console.log('');

  // Check auth.users
  console.log('2. Checking auth.users:');
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.log('❌ Error:', usersError.message);
  } else {
    const adminUser = users.find(u => u.email === 'ian.ho@rebootmedia.net');
    if (adminUser) {
      console.log('✅ Auth user found:');
      console.log('   Email:', adminUser.email);
      console.log('   Email confirmed:', adminUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('   Created:', adminUser.created_at);
      console.log('   User ID:', adminUser.id);
    } else {
      console.log('❌ No auth user found for ian.ho@rebootmedia.net');
      console.log('');
      console.log('Available users:');
      users.forEach(u => {
        console.log(`   - ${u.email} (${u.id})`);
      });
    }
  }
}

checkAdminUser();
