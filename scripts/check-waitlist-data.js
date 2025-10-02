#!/usr/bin/env node
require('dotenv').config({ path: '/home/projects/.env' });

const PROJECT_REF = 'vkyggknknyfallmnrmfu';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function checkWaitlist() {
  const sql = `
SELECT 
  email,
  approved,
  converted_to_profile_id,
  converted_to_profile_id IS NULL as is_null,
  created_at
FROM waitlist;
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

  const data = await response.json();
  console.log('Waitlist entries:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\nAdmin query filter: .is("converted_to_profile_id", null)');
  console.log('Entries that match filter:', data?.filter(e => e.is_null).length || 0);
}

checkWaitlist().catch(console.error);
