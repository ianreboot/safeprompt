#!/usr/bin/env node
/**
 * Drop deprecated tables using Supabase Management API
 */

require('dotenv').config({ path: '/home/projects/.env' });

const PROJECT_REF = 'vkyggknknyfallmnrmfu';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function dropTablesViaAPI() {
  console.log('🗑️  Attempting to drop tables via Supabase Management API...\n');

  const sql = `
-- Drop deprecated tables
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS validation_logs CASCADE;

-- Fix subscription_tier
UPDATE profiles
SET subscription_tier = 'free'
WHERE email = 'ian.ho@rebootmedia.net'
  AND subscription_tier = 'internal';
  `.trim();

  console.log('SQL to execute:');
  console.log(sql);
  console.log('\n' + '='.repeat(60) + '\n');

  // Try to execute via Management API
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
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log('\n✅ Successfully dropped deprecated tables!');
  } else {
    console.log('\n❌ Failed to execute SQL via Management API');
    console.log('Trying alternative endpoint...\n');

    // Try alternative endpoint
    const altResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/sql`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql })
      }
    );

    console.log('Alternative response status:', altResponse.status);
    const altData = await altResponse.json();
    console.log('Alternative response:', JSON.stringify(altData, null, 2));
  }
}

dropTablesViaAPI().catch(console.error);
