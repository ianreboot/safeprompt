/**
 * Run playground migration using Supabase Management API
 */

import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '/home/projects/.env' });

const PROJECT_REF = 'vkyggknknyfallmnrmfu'; // SafePrompt Supabase project
const SQL_FILE = path.join(__dirname, 'migrations', '002_playground_tables.sql');

console.log('SafePrompt Playground Migration\n');
console.log(`Project: ${PROJECT_REF}`);
console.log(`Migration: ${path.basename(SQL_FILE)}\n`);

async function executeMigration() {
  try {
    // Read SQL migration file
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    console.log(`✓ Read migration file (${sqlContent.length} bytes)\n`);

    // Check for access token
    if (!process.env.SUPABASE_ACCESS_TOKEN) {
      throw new Error('SUPABASE_ACCESS_TOKEN not found in environment');
    }

    console.log('Executing migration via Supabase Management API...\n');

    // Execute SQL via Supabase Management API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sqlContent })
      }
    );

    const statusCode = response.status;
    let body;

    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    console.log('Response Status:', statusCode);

    if (statusCode === 200 || statusCode === 201) {
      console.log('\n✅ Migration completed successfully!\n');
      console.log('Created:');
      console.log('  ✓ playground_rate_limits table');
      console.log('  ✓ playground_requests table');
      console.log('  ✓ playground_analytics table');
      console.log('  ✓ update_rate_limit() function');
      console.log('  ✓ cleanup_playground_data() function');
      console.log('  ✓ RLS policies and permissions');
      console.log('\nRate limits configured:');
      console.log('  - 5 requests/minute per IP');
      console.log('  - 20 requests/hour per IP');
      console.log('  - 50 requests/day per IP');
      console.log('  - Abuse score threshold: 100 (permanent ban)');
      console.log('\nData retention:');
      console.log('  - Requests: 7 days (GDPR compliance)');
      console.log('  - Rate limits: 30 days inactive cleanup');
    } else {
      console.log('\n❌ Migration failed');
      console.log('Status:', statusCode);
      console.log('Response:', JSON.stringify(body, null, 2));
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

executeMigration();
