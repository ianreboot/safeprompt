/**
 * Check the actual constraint on ip_allowlist.purpose
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraint() {
  // Query pg_constraint to get the actual constraint definition
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname = 'ip_allowlist_purpose_check';
    `
  });

  if (error) {
    // Try alternative method - describe table
    const { data: tableInfo, error: error2 } = await supabase
      .from('ip_allowlist')
      .select('*')
      .limit(1);

    console.log('Table query result:', { data: tableInfo, error: error2 });

    // Try inserting with each possible value to find which one works
    const testValues = ['testing', 'ci_cd', 'internal', 'monitoring', 'admin'];
    console.log('\\nTesting each purpose value...');

    for (const purpose of testValues) {
      console.log(`\\nTrying purpose: '${purpose}'`);
      const testIP = `192.0.2.${Math.floor(Math.random() * 255)}`;
      const { data: testData, error: testError } = await supabase
        .from('ip_allowlist')
        .insert({
          ip_address: testIP,
          ip_hash: testIP, // Just for testing
          description: 'Test entry - will be deleted',
          purpose: purpose
        })
        .select();

      if (testError) {
        console.log(`  ❌ Failed: ${testError.message}`);
      } else {
        console.log(`  ✅ Success! This value works.`);
        // Delete the test entry
        await supabase
          .from('ip_allowlist')
          .delete()
          .eq('ip_address', testIP);
      }
    }
  } else {
    console.log('Constraint definition:', data);
  }
}

checkConstraint().catch(console.error);
