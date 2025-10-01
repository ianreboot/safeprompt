/**
 * Simple playground migration runner
 * Executes SQL migration file against Supabase
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('SafePrompt Playground Migration (Direct PostgreSQL)\n');

  // Get database connection string
  const dbUrl = process.env.SAFEPROMPT_DATABASE_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('Database URL not configured. Set SAFEPROMPT_DATABASE_URL or DATABASE_URL');
  }

  console.log('✓ Connecting to database...\n');

  // Create PostgreSQL connection
  const sql = postgres(dbUrl, {
    max: 1,
    idle_timeout: 10
  });

  try {
    // Read migration SQL
    const migrationPath = join(__dirname, 'migrations', '002_playground_tables.sql');
    const migrationSql = readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 002_playground_tables.sql\n');

    // Execute the entire migration
    await sql.unsafe(migrationSql);

    console.log('✓ Migration completed successfully!\n');
    console.log('Created:');
    console.log('  - playground_rate_limits table');
    console.log('  - playground_requests table');
    console.log('  - playground_analytics table');
    console.log('  - update_rate_limit() function');
    console.log('  - cleanup_playground_data() function');
    console.log('  - RLS policies and permissions\n');

    // Verify tables exist
    console.log('Verifying tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'playground_%'
      ORDER BY table_name
    `;

    console.log(`\nFound ${tables.length} playground tables:`);
    tables.forEach(t => console.log(`  - ${t.table_name}`));

  } catch (err) {
    console.error('\n✗ Migration failed:', err.message);
    throw err;
  } finally {
    await sql.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
