/**
 * Run Multi-Turn Migration on SafePrompt DEV Database
 * Uses Supabase service role key to execute SQL directly
 */

require('dotenv').config({ path: '/home/projects/.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('===  Multi-Turn Attack Detection Migration ===');
  console.log(`Target: ${process.env.SAFEPROMPT_SUPABASE_URL}\n`);

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251009_multi_turn_session_tracking.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Executing migration...\n');

  try {
    // Execute SQL via RPC (if exec_sql function exists) or try direct query
    const { data, error } = await supabase.rpc('exec_sql', { query: migrationSQL });

    if (error) {
      // If RPC doesn't exist, we'll need to split and execute statements
      console.log('RPC method not available, executing via client library...\n');

      // For schema operations, we need to use the REST API directly
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';

        // Skip comments and empty statements
        if (stmt.startsWith('--') || stmt.trim() === ';') {
          continue;
        }

        try {
          // Use the PostgreSQL REST extension for direct SQL
          const response = await fetch(`${process.env.SAFEPROMPT_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: stmt })
          });

          if (response.ok) {
            successCount++;
            console.log(`✅ Statement ${i + 1}/${statements.length}`);
          } else {
            const error = await response.text();
            console.error(`❌ Statement ${i + 1} failed:`, error);
            errorCount++;
          }
        } catch (err) {
          console.error(`❌ Statement ${i + 1} error:`, err.message);
          errorCount++;
        }
      }

      console.log(`\nMigration complete: ${successCount} succeeded, ${errorCount} failed`);

      if (errorCount > 0) {
        console.log('\n⚠️  Some statements failed. This may be OK if objects already exist.');
        console.log('Check the database manually to verify schema is correct.\n');
      }
    } else {
      console.log('✅ Migration executed successfully via RPC!\n');
      if (data) {
        console.log('Result:', data);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nNote: Schema DDL operations require database password access.');
    console.error('Please use the Supabase Dashboard SQL Editor to run this migration manually.\n');
    console.error('Migration file location:');
    console.error('  /home/projects/safeprompt/supabase/migrations/20251009_multi_turn_session_tracking.sql\n');
    process.exit(1);
  }

  console.log('Done!');
}

runMigration();
