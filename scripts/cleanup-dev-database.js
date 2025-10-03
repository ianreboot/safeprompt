#!/usr/bin/env node
/**
 * Clean up DEV database - keep only ian.ho@rebootmedia.net
 * Remove all other users: yuenho, arsh, linpap, ian@rebootmedia.net
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '/home/projects/.env' });

const devSupabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

const keepEmail = 'ian.ho@rebootmedia.net';

console.log('🧹 Cleaning up DEV database');
console.log('Database:', process.env.SAFEPROMPT_SUPABASE_URL);
console.log(`Keeping only: ${keepEmail}`);
console.log('');

// Get all users
const { data: users } = await devSupabase.auth.admin.listUsers();

console.log(`Found ${users.users.length} users in DEV database:`);
users.users.forEach(u => console.log(`  - ${u.email}`));
console.log('');

// Delete all except ian.ho@rebootmedia.net
for (const user of users.users) {
  if (user.email === keepEmail) {
    console.log(`✅ Keeping ${user.email}`);
    continue;
  }

  console.log(`❌ Deleting ${user.email}...`);

  // Delete user (this will cascade to profiles due to foreign key)
  const { error } = await devSupabase.auth.admin.deleteUser(user.id);

  if (error) {
    console.error(`  Error deleting ${user.email}:`, error.message);
  } else {
    console.log(`  Deleted successfully`);
  }
}

// Verify cleanup
console.log('');
console.log('='.repeat(60));
console.log('CLEANUP COMPLETE');
console.log('='.repeat(60));
console.log('');

const { data: remainingUsers } = await devSupabase.auth.admin.listUsers();

console.log(`Remaining users in DEV: ${remainingUsers.users.length}`);
remainingUsers.users.forEach(u => console.log(`  ✓ ${u.email}`));

// Verify ian.ho profile
const ianUser = remainingUsers.users.find(u => u.email === keepEmail);
if (ianUser) {
  const { data: profile } = await devSupabase
    .from('profiles')
    .select('*')
    .eq('id', ianUser.id)
    .single();

  console.log('');
  console.log('Ian Ho Profile (DEV):');
  console.log('  API Key:', profile?.api_key);
  console.log('  Tier:', profile?.subscription_tier);
  console.log('  API Limit:', profile?.api_requests_limit);
}

console.log('');
console.log('✅ DEV database cleanup complete');
console.log('DEV database is now ready for testing/development only');
