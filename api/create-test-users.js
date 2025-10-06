#!/usr/bin/env node
// Create test users for Phase 1A testing via Supabase Admin API
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createTestUsers() {
  console.log('Creating test users for Phase 1A...\n');

  const users = [
    {
      email: 'test-free@safeprompt.dev',
      tier: 'free',
      preferences: { intelligence_sharing: true }
    },
    {
      email: 'test-pro@safeprompt.dev',
      tier: 'pro',
      preferences: { intelligence_sharing: true, auto_block_enabled: true }
    },
    {
      email: 'test-pro-optout@safeprompt.dev',
      tier: 'pro',
      preferences: { intelligence_sharing: false, auto_block_enabled: false }
    },
    {
      email: 'test-internal@safeprompt.dev',
      tier: 'internal',
      preferences: {}
    }
  ];

  const createdUsers = [];

  for (const user of users) {
    console.log(`Creating ${user.email}...`);

    // Step 1: Create auth user with service role key
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      email_confirm: true,  // Auto-confirm email
      password: 'TestPassword123!',  // Temporary password
      user_metadata: {
        test_account: true,
        tier: user.tier
      }
    });

    if (authError) {
      console.error(`  ❌ Auth error for ${user.email}:`, authError.message);
      continue;
    }

    console.log(`  ✅ Auth user created: ${authData.user.id}`);

    // Step 2: Create profile (should be auto-created by trigger, but we'll update it)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: user.tier,
        preferences: user.preferences,
        api_key: `sp_test_${user.tier}_${Math.random().toString(36).substring(2, 18)}`
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (profileError) {
      console.error(`  ❌ Profile error for ${user.email}:`, profileError.message);
      continue;
    }

    console.log(`  ✅ Profile updated: ${user.tier}`);
    console.log(`  🔑 API Key: ${profileData.api_key}\n`);

    createdUsers.push({
      ...profileData,
      email: user.email
    });
  }

  // Export environment variables
  console.log('\n=== Export these environment variables: ===\n');
  createdUsers.forEach(user => {
    const varName = user.email.includes('free') ? 'TEST_FREE_ID' :
                    user.email.includes('optout') ? 'TEST_PRO_OPTOUT_ID' :
                    user.email.includes('pro@') ? 'TEST_PRO_ID' :
                    'TEST_INTERNAL_ID';
    const keyName = varName.replace('_ID', '_KEY');
    console.log(`export ${varName}="${user.id}"`);
    console.log(`export ${keyName}="${user.api_key}"`);
  });
  console.log('\n');

  return createdUsers;
}

createTestUsers().catch(console.error);
