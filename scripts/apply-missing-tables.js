#!/usr/bin/env node

/**
 * Apply missing table migrations to DEV database using Management API
 * Creates intelligence_logs and job_metrics tables
 */

const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: '/home/projects/.env' });

const PROJECT_REF = 'vkyggknknyfallmnrmfu'; // DEV database
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

// Read the migration SQL
const migrationSQL = fs.readFileSync(
  '/home/projects/safeprompt/supabase/migrations/20251007010000_create_missing_tables.sql',
  'utf8'
);

console.log('🔧 Applying missing tables migration to DEV database...\n');
console.log(`Project: ${PROJECT_REF}`);
console.log(`Migration: 20251007010000_create_missing_tables.sql\n`);

// Execute SQL via Supabase Management API
const postData = JSON.stringify({
  query: migrationSQL
});

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);

    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Migration applied successfully!');
      console.log('\nResponse:', data);
      console.log('\nNext step: Run validation script to confirm 100% pass rate');
      console.log('  cd /home/projects/safeprompt && node scripts/validate-phase1a-dev.js');
    } else {
      console.error('❌ Migration failed');
      console.error('Response:', data);
      console.error('\nFallback: Execute SQL manually via Supabase Dashboard');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
  process.exit(1);
});

req.write(postData);
req.end();
