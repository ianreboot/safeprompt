#!/usr/bin/env node
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running Migration 004: Alerts System');
  console.log('Database:', supabaseUrl);
  console.log('');

  try {
    // Read migration file
    const migrationPath = join(__dirname, '../migrations/004_add_alerts_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Note: Supabase JS client doesn't support raw SQL DDL
    console.log('⚠️  Manual migration required');
    console.log('');
    console.log('Steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv');
    console.log('2. Click: SQL Editor');
    console.log('3. Copy migration from: /home/projects/safeprompt/api/migrations/004_add_alerts_system.sql');
    console.log('4. Paste and run in SQL Editor');
    console.log('');
    console.log('Then run verification:');
    console.log('node /home/projects/safeprompt/api/scripts/verify-migration-004.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();
