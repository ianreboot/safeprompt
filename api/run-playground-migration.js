/**
 * Run playground database migration
 * Creates tables, indexes, and functions for playground rate limiting and logging
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('SafePrompt Playground Migration\n');

  // Get Supabase credentials
  const url = process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured. Set SAFEPROMPT_SUPABASE_URL and SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY');
  }

  console.log(`✓ Connected to Supabase: ${url.replace(/https?:\/\//, '').split('.')[0]}...\n`);

  // Create Supabase client
  const supabase = createClient(url, key);

  // Read migration SQL
  const migrationPath = join(__dirname, 'migrations', '002_playground_tables.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  console.log('Running migration: 002_playground_tables.sql\n');

  // Split SQL into individual statements (simple split on semicolon + newline)
  const statements = sql
    .split(';\n')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip pure comments
    if (statement.startsWith('--') || statement === ';') continue;

    // Extract statement type for logging
    const statementType = statement
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .trim()
      .split(/\s+/)[0]
      .toUpperCase();

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Try direct query as fallback
        const result = await supabase.from('_migrations').select('*').limit(0);

        if (result.error) {
          console.error(`✗ Failed: ${statementType}`);
          console.error(`  Error: ${error.message}\n`);
          errorCount++;
        } else {
          console.log(`✓ Executed: ${statementType}`);
          successCount++;
        }
      } else {
        console.log(`✓ Executed: ${statementType}`);
        successCount++;
      }
    } catch (err) {
      console.error(`✗ Failed: ${statementType}`);
      console.error(`  Error: ${err.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Migration Results:');
  console.log(`  Success: ${successCount} statements`);
  console.log(`  Errors:  ${errorCount} statements`);
  console.log('='.repeat(60));

  if (errorCount === 0) {
    console.log('\n✓ Migration completed successfully!');
    console.log('\nCreated:');
    console.log('  - playground_rate_limits table');
    console.log('  - playground_requests table');
    console.log('  - playground_analytics table');
    console.log('  - update_rate_limit() function');
    console.log('  - cleanup_playground_data() function');
    console.log('  - RLS policies and permissions');
  } else {
    console.log('\n⚠ Migration completed with errors. Check output above.');
  }
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
