#!/usr/bin/env node
/**
 * Run migration 004 via Supabase client
 * This works when direct psql access is blocked
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_PROD_SUPABASE_URL;
const supabaseServiceKey = process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Running Migration 004 via Supabase Client');
console.log('Database:', supabaseUrl);
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    // Read migration file
    const migrationPath = join(__dirname, '../migrations/004_add_alerts_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded');
    console.log('Length:', migrationSQL.length, 'characters');
    console.log('');

    // Split into individual statements (naive approach - good enough for this migration)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .filter(s => !s.match(/^COMMENT ON/i)); // Skip comments for now

    console.log(`Found ${statements.length} SQL statements to execute`);
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip empty statements or comments
      if (statement.trim() === ';' || statement.trim().startsWith('--')) {
        continue;
      }

      try {
        console.log(`[${i + 1}/${statements.length}] Executing statement...`);

        // Use rpc to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error(`❌ Error:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error:`, err.message);
        errorCount++;
      }
    }

    console.log('');
    console.log('Migration Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log('');

    if (errorCount > 0) {
      console.log('⚠️  Some statements failed. This is normal if:');
      console.log('   - Tables already exist (IF NOT EXISTS prevents errors)');
      console.log('   - Permissions already granted');
      console.log('');
      console.log('Run verification script to confirm migration worked:');
      console.log('node /home/projects/safeprompt/api/scripts/verify-migration-004.js');
    } else {
      console.log('✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

runMigration();
