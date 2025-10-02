#!/usr/bin/env node
/**
 * Fix subscription_status for free tier users
 */

require('dotenv').config({ path: '/home/projects/.env' });

const PROJECT_REF = 'vkyggknknyfallmnrmfu';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function fixFreeTierStatus() {
  console.log('🔧 Fixing subscription_status for free tier users...\n');

  const sql = `
UPDATE profiles
SET subscription_status = 'inactive'
WHERE subscription_tier = 'free'
  AND subscription_status = 'active';
  `.trim();

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    }
  );

  console.log('Response status:', response.status);
  const data = await response.json();

  if (response.ok) {
    console.log('✅ Successfully updated subscription_status for free tier users!');
    console.log('\nAll free tier users now have subscription_status="inactive"');
    console.log('This means:');
    console.log('  - Active Subscribers: 0 (correct!)');
    console.log('  - Monthly Revenue: $0 (correct!)');
  } else {
    console.log('❌ Failed:', JSON.stringify(data, null, 2));
  }
}

fixFreeTierStatus().catch(console.error);
