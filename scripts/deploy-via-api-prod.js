#!/usr/bin/env node
/**
 * Deploy enhanced pattern detection via Supabase Management API to PROD
 * Uses /v1/projects/{ref}/database/query endpoint
 */
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

const PROJECT_REF = 'adyfhzbcsqzgqvyimycv'; // PROD
const PAT = process.env.SUPABASE_ACCESS_TOKEN;

async function deployViaAPI() {
  console.log('🚀 Deploying to PRODUCTION database...\n');
  console.log('Reading migration file...\n');
  const sql = readFileSync(
    '/home/projects/safeprompt/supabase/migrations/20251009123000_enhanced_pattern_detection.sql',
    'utf8'
  );

  console.log(`Executing SQL via Management API...`);
  console.log(`Endpoint: POST /v1/projects/${PROJECT_REF}/database/query\n`);

  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: sql
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ API Error (${response.status}):`, error);
    process.exit(1);
  }

  const result = await response.json();
  console.log('✅ SQL executed successfully!\n');
  console.log('Response:', result);
  console.log(`\n🎉 Enhanced pattern detection deployed to PRODUCTION!`);
  console.log('   8 pattern types now active in PROD');
}

deployViaAPI().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
