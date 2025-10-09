/**
 * Apply enhanced pattern detection migration directly
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment
config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('Reading migration file...');
  const sql = readFileSync(
    '/home/projects/safeprompt/supabase/migrations/20251009123000_enhanced_pattern_detection.sql',
    'utf8'
  );

  console.log('Applying migration to DEV database...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  console.log('✅ Migration applied successfully!');
  console.log('Enhanced pattern detection function updated.');
}

applyMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
