#!/usr/bin/env node
/**
 * Deploy SQL via Supabase Management API (Context7 verified method)
 * POST /v1/projects/{ref}/database/query
 */
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

const PROJECT_REF = 'vkyggknknyfallmnrmfu';  // DEV
const PAT = process.env.SUPABASE_ACCESS_TOKEN;

async function deploySQL() {
  console.log('=== Supabase Management API Deployment ===');
  console.log(`Project: ${PROJECT_REF} (DEV)`);
  console.log(`Endpoint: POST /v1/projects/${PROJECT_REF}/database/query\n`);

  // Read SQL
  const sql = readFileSync(
    '/home/projects/safeprompt/supabase/migrations/20251009123000_enhanced_pattern_detection.sql',
    'utf8'
  );

  console.log('Executing SQL...');

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    }
  );

  const contentType = response.headers.get('content-type');
  const responseText = await response.text();

  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log(`Content-Type: ${contentType}\n`);

  if (!response.ok) {
    console.error('❌ API Error:');
    console.error(responseText);
    throw new Error(`Deployment failed: ${response.status}`);
  }

  // Parse response
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    console.error('❌ Invalid JSON response:');
    console.error(responseText.substring(0, 500));
    throw new Error('Invalid response format');
  }

  console.log('✅ SQL executed successfully!');
  console.log('Response:', JSON.stringify(result, null, 2));

  if (result.rows !== undefined) {
    console.log(`\nRows affected: ${result.rows.length}`);
  }
  if (result.execution_time_ms !== undefined) {
    console.log(`Execution time: ${result.execution_time_ms}ms`);
  }

  console.log('\n🎉 Function deployed!');
  console.log('Changes:');
  console.log('  - reconnaissance_attack threshold: >=2 → >=1');
  console.log('  - reconnaissance_attack confidence: 0.85 → 0.90');

  return result;
}

deploySQL()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
