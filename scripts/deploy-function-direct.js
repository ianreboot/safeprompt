#!/usr/bin/env node
/**
 * Deploy enhanced pattern detection function directly via Supabase client
 * Uses service role key to execute raw SQL
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
);

async function deployFunction() {
  console.log('Reading migration file...');
  const sql = readFileSync(
    '/home/projects/safeprompt/supabase/migrations/20251009123000_enhanced_pattern_detection.sql',
    'utf8'
  );

  console.log('Executing SQL via Supabase client...');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/**'));

  console.log(`Found ${statements.length} SQL statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: statement
    });

    if (error) {
      console.error(`❌ Error on statement ${i + 1}:`, error.message);
      process.exit(1);
    }

    console.log(`✅ Statement ${i + 1} executed successfully`);
  }

  console.log('\n✅ All statements executed successfully!');
  console.log('Enhanced pattern detection function deployed to DEV.');
}

deployFunction().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
