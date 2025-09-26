#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  // Get one row to see the schema
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error && error.code !== 'PGRST116') {
    console.error('Error:', error.message);
    return;
  }

  console.log('Profiles table schema (based on query):');
  if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]));
  } else {
    console.log('No data found, trying to insert a test row to discover schema...');

    // Try to get schema by attempting insert
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'schema-test@test.com'
      });

    if (insertError) {
      console.log('Insert error details:', insertError.message);
      console.log('This helps identify missing required columns');
    }
  }

  // Also check for any existing test users
  const { data: testUsers } = await supabase
    .from('profiles')
    .select('email, api_key, api_requests_limit, subscription_tier')
    .or('email.eq.test@safeprompt.dev,email.eq.demo@safeprompt.dev');

  if (testUsers && testUsers.length > 0) {
    console.log('\nExisting test users:');
    testUsers.forEach(user => {
      console.log(`- ${user.email}: Tier=${user.subscription_tier}, Limit=${user.api_requests_limit}`);
    });
  }
}

checkSchema().catch(console.error);