/**
 * Check actual database schema
 */

require('dotenv').config({ path: '/home/projects/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('📋 Checking profiles table schema...\n');

  // Get one profile to see all fields
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (profiles && profiles.length > 0) {
    console.log('Actual columns in profiles table:');
    Object.keys(profiles[0]).forEach(col => {
      console.log(`  - ${col}: ${typeof profiles[0][col]} = ${profiles[0][col]}`);
    });
  }

  console.log('\n📋 Checking users table schema (deprecated)...\n');
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (users && users.length > 0) {
    console.log('Actual columns in users table:');
    Object.keys(users[0]).forEach(col => {
      console.log(`  - ${col}: ${typeof users[0][col]} = ${users[0][col]}`);
    });
  }
}

checkSchema();
