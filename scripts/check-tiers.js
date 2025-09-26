#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function checkTiers() {
  // Get existing users to see what tiers are used
  const { data: users, error } = await supabase
    .from('users')
    .select('tier, email');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Existing tiers in use:');
  const tiers = new Set(users.map(u => u.tier));
  tiers.forEach(tier => {
    const count = users.filter(u => u.tier === tier).length;
    console.log(`  - ${tier}: ${count} user(s)`);
  });

  // Try different tier values to find valid ones
  const testTiers = ['free', 'starter', 'pro', 'business', 'enterprise', 'beta', 'premium'];

  console.log('\nTesting valid tier values...');
  for (const tier of testTiers) {
    const { error } = await supabase
      .from('users')
      .insert({
        id: crypto.randomUUID(),
        email: `test-tier-${tier}@test.com`,
        tier: tier
      });

    if (error) {
      if (error.message.includes('tier_check')) {
        console.log(`  ✗ ${tier} - invalid`);
      }
    } else {
      console.log(`  ✓ ${tier} - valid`);
      // Clean up test
      await supabase.from('users').delete().eq('email', `test-tier-${tier}@test.com`);
    }
  }
}

checkTiers().catch(console.error);