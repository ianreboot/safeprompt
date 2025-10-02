#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function checkTiers() {
  // Get existing users to see what tiers are used
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('subscription_tier, email');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Existing subscription tiers in use:');
  const tiers = new Set(profiles.map(u => u.subscription_tier));
  tiers.forEach(tier => {
    const count = profiles.filter(u => u.subscription_tier === tier).length;
    console.log(`  - ${tier}: ${count} user(s)`);
  });

  // Try different tier values to find valid ones
  const testTiers = ['free', 'starter', 'pro', 'business', 'enterprise', 'beta', 'premium', 'early_bird'];

  console.log('\nTesting valid subscription_tier values...');
  for (const tier of testTiers) {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        email: `test-tier-${tier}@test.com`,
        subscription_tier: tier
      });

    if (error) {
      if (error.message.includes('tier_check') || error.message.includes('subscription_tier')) {
        console.log(`  ✗ ${tier} - invalid`);
      }
    } else {
      console.log(`  ✓ ${tier} - valid`);
      // Clean up test
      await supabase.from('profiles').delete().eq('email', `test-tier-${tier}@test.com`);
    }
  }
}

checkTiers().catch(console.error);