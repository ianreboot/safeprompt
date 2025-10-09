#!/usr/bin/env node
/**
 * Deploy base multi-turn schema to PROD
 * Creates validation_sessions, session_requests, session_attack_patterns tables
 */
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

const PROJECT_REF = 'adyfhzbcsqzgqvyimycv'; // PROD
const PAT = process.env.SUPABASE_ACCESS_TOKEN;

async function deployBaseSchema() {
  console.log('🚀 Deploying base multi-turn schema to PRODUCTION...\n');

  const sql = readFileSync(
    '/home/projects/safeprompt/supabase/migrations/20251009000000_multi_turn_session_tracking.sql',
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
  console.log(`\n🎉 Base schema deployed to PRODUCTION!`);
  console.log('   Tables created: validation_sessions, session_requests, session_attack_patterns');
}

deployBaseSchema().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
