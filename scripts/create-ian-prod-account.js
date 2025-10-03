#!/usr/bin/env node
/**
 * Create ian.ho@rebootmedia.net account in PRODUCTION database
 * This is the admin/internal user account with unlimited API access
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

const email = 'ian.ho@rebootmedia.net';
const temporaryPassword = 'TempIanPassword2025!';
const internalApiKey = 'sp_test_unlimited_dogfood_key_2025';

console.log('🔧 Creating ian.ho@rebootmedia.net in PRODUCTION database');
console.log('Database:', process.env.SAFEPROMPT_PROD_SUPABASE_URL);
console.log('');

// Step 1: Create the user in Supabase Auth
console.log('Step 1: Creating user in Supabase Auth...');
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password: temporaryPassword,
  email_confirm: true,  // Auto-confirm
  user_metadata: {
    role: 'admin',
    account_type: 'internal',
    note: 'Admin/internal user account with unlimited API access'
  }
});

if (authError) {
  console.error('❌ Failed to create user:', authError.message);
  process.exit(1);
}

const userId = authData.user.id;
console.log('✅ User created with ID:', userId);
console.log('');

// Step 2: Wait for trigger to create profile
console.log('Step 2: Waiting for profile creation trigger...');
await new Promise(resolve => setTimeout(resolve, 2000));

// Step 3: Update the profile with admin/internal settings
console.log('Step 3: Updating profile with admin settings...');

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .update({
    api_key: internalApiKey,
    api_key_hint: internalApiKey.slice(-4),
    subscription_status: 'inactive',  // Not a paid subscription
    subscription_tier: 'internal',    // Internal/admin tier
    api_requests_limit: 999999999,    // Unlimited
    api_requests_used: 0
  })
  .eq('id', userId)
  .select()
  .single();

if (profileError) {
  console.error('❌ Failed to update profile:', profileError.message);

  // Try to create profile manually if trigger didn't work
  console.log('Attempting to create profile manually...');
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      api_key: internalApiKey,
      api_key_hint: internalApiKey.slice(-4),
      subscription_status: 'inactive',
      subscription_tier: 'internal',
      api_requests_limit: 999999999,
      api_requests_used: 0
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create profile:', createError.message);
    process.exit(1);
  }

  console.log('✅ Profile created manually');
} else {
  console.log('✅ Profile updated successfully');
}

// Step 4: Verify everything
console.log('');
console.log('='.repeat(60));
console.log('✅ ADMIN ACCOUNT CREATED IN PRODUCTION');
console.log('='.repeat(60));
console.log('');
console.log('User can now log in at: https://dashboard.safeprompt.dev/login');
console.log('');
console.log('Login credentials:');
console.log('  Email:', email);
console.log('  Password:', temporaryPassword);
console.log('');
console.log('⚠️  IMPORTANT: User should reset their password immediately');
console.log('  They can use "Forgot Password" on the login page');
console.log('');
console.log('Account Status:');
console.log('  Role: Admin/Internal');
console.log('  Tier: internal');
console.log('  API Key:', internalApiKey);
console.log('  API Limit: 999,999,999 (unlimited)');
console.log('  Status: Active');
