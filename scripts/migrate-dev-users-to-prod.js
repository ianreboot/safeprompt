#!/usr/bin/env node
/**
 * Migrate specific users from DEV database to PROD database
 * Users: arsh.s@rebootmedia.net, linpap@gmail.com
 * Create them as free tier users in PROD
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '/home/projects/.env' });

const prodSupabase = createClient(
  process.env.SAFEPROMPT_PROD_SUPABASE_URL,
  process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
);

const usersToMigrate = [
  'arsh.s@rebootmedia.net',
  'linpap@gmail.com'
];

console.log('🔄 Migrating users from DEV to PROD');
console.log('Target database:', process.env.SAFEPROMPT_PROD_SUPABASE_URL);
console.log('');

for (const email of usersToMigrate) {
  console.log(`Migrating ${email}...`);

  // Create user with temporary password
  const tempPassword = `TempMigrated${Math.random().toString(36).slice(2)}!`;

  const { data: authData, error: authError } = await prodSupabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      migrated_from: 'dev_database',
      migration_date: new Date().toISOString(),
      account_type: 'free'
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log(`  ⚠️  ${email} already exists in PROD - skipping`);
      continue;
    }
    console.error(`  ❌ Failed to create ${email}:`, authError.message);
    continue;
  }

  const userId = authData.user.id;
  console.log(`  ✅ Created user ID: ${userId}`);

  // Wait for trigger to create profile
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Update profile to free tier
  const { error: profileError } = await prodSupabase
    .from('profiles')
    .update({
      subscription_status: 'inactive',
      subscription_tier: 'free',
      api_requests_limit: 10000,
      api_requests_used: 0
    })
    .eq('id', userId);

  if (profileError) {
    console.error(`  ❌ Failed to update profile for ${email}:`, profileError.message);
  } else {
    console.log(`  ✅ Profile configured as free tier`);
  }

  // Send password reset email so they can set their own password
  const { error: resetError } = await prodSupabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://dashboard.safeprompt.dev/reset-password'
  });

  if (resetError) {
    console.error(`  ❌ Failed to send password reset email:`, resetError.message);
  } else {
    console.log(`  ✅ Password reset email sent`);
  }

  console.log('');
}

// Verify migration
console.log('='.repeat(60));
console.log('MIGRATION COMPLETE');
console.log('='.repeat(60));
console.log('');
console.log('Verifying PROD database...');

const { data: prodProfiles } = await prodSupabase
  .from('profiles')
  .select('email, subscription_tier, subscription_status')
  .order('created_at', { ascending: false });

console.log('');
console.log(`Total users in PROD: ${prodProfiles.length}`);
prodProfiles.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.email} - ${p.subscription_tier || 'free'} (${p.subscription_status || 'inactive'})`);
});

console.log('');
console.log('📧 Migrated users will receive password reset emails');
console.log('They can set their own passwords at: https://dashboard.safeprompt.dev/reset-password');
