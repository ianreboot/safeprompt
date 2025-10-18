#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: '/home/projects/.env' });

// Use production database by default (or dev if --dev flag)
const useProd = !process.argv.includes('--dev');
const supabaseUrl = useProd
  ? process.env.SAFEPROMPT_PROD_SUPABASE_URL
  : process.env.SAFEPROMPT_SUPABASE_URL;
const supabaseKey = useProd
  ? process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY
  : process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY;

console.log(`🔧 Using ${useProd ? 'PRODUCTION' : 'DEV'} database`);
console.log(`   URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function upgradeUser(email, newTier = 'starter') {
  console.log(`\n🔍 Checking user: ${email}`);

  // 1. Find user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('❌ Error fetching users:', userError);
    return;
  }

  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    return;
  }

  console.log(`✅ Found user: ${user.id}`);

  // 2. Check current profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('❌ Error fetching profile:', profileError);
    return;
  }

  console.log('\n📊 Current Status:');
  console.log(`   Email: ${profile.email}`);
  console.log(`   Tier: ${profile.subscription_tier} / ${profile.tier}`);
  console.log(`   Status: ${profile.subscription_status}`);
  console.log(`   Monthly Limit: ${profile.api_requests_limit || 'not set'}`);
  console.log(`   Current Usage: ${profile.api_requests_used || 0}`);

  // 3. Determine new tier limits
  const tierLimits = {
    'free': 1000,
    'early_bird': 10000,
    'starter': 10000,
    'business': 250000,
    'internal': 999999
  };

  const newLimit = tierLimits[newTier];

  console.log(`\n🚀 Upgrading to: ${newTier.toUpperCase()}`);
  console.log(`   New monthly limit: ${newLimit.toLocaleString()}`);

  // 4. Update profile (tier is auto-generated from subscription_tier)
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_tier: newTier,
      subscription_status: 'active',
      api_requests_limit: newLimit,
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Error updating profile:', updateError);
    return;
  }

  console.log('\n✅ User upgraded successfully!');
  console.log('\n📊 New Status:');
  console.log(`   Email: ${updated.email}`);
  console.log(`   Tier: ${updated.subscription_tier} / ${updated.tier}`);
  console.log(`   Status: ${updated.subscription_status}`);
  console.log(`   Monthly Limit: ${updated.api_requests_limit}`);
  console.log(`   Current Usage: ${updated.api_requests_used}`);

  return updated;
}

// Get email and tier from command line
const email = process.argv[2] || 'wilyjose@gmail.com';
const tier = process.argv[3] || 'starter';

upgradeUser(email, tier).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
