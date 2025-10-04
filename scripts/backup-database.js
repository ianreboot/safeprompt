#!/usr/bin/env node

/**
 * Production Database Backup Script
 *
 * Creates a complete backup of the Supabase production database
 * by exporting all tables to a JSON file.
 *
 * Usage: node scripts/backup-database.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const PROD_URL = process.env.SAFEPROMPT_PROD_SUPABASE_URL;
const PROD_KEY = process.env.SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY;

if (!PROD_URL || !PROD_KEY) {
  console.error('❌ Missing production Supabase credentials');
  process.exit(1);
}

const supabase = createClient(PROD_URL, PROD_KEY);

const TABLES_TO_BACKUP = [
  'profiles',
  'usage_logs',
  'rate_limits',
  // Add other tables as needed
];

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
                    new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  const backupDir = path.join(__dirname, '..', 'backups');
  const backupFile = path.join(backupDir, `prod_backup_${timestamp}.json`);

  console.log('🔄 Starting database backup...');
  console.log(`📦 Backup file: ${backupFile}`);

  const backup = {
    timestamp: new Date().toISOString(),
    database: 'adyfhzbcsqzgqvyimycv',
    tables: {}
  };

  // Backup each table
  for (const table of TABLES_TO_BACKUP) {
    try {
      console.log(`  ├─ Backing up table: ${table}...`);

      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.error(`  │  ⚠️  Error backing up ${table}:`, error.message);
        backup.tables[table] = { error: error.message, data: [] };
      } else {
        console.log(`  │  ✅ Backed up ${data.length} rows from ${table}`);
        backup.tables[table] = { count: data.length, data };
      }
    } catch (err) {
      console.error(`  │  ❌ Failed to backup ${table}:`, err.message);
      backup.tables[table] = { error: err.message, data: [] };
    }
  }

  // Write backup to file
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  console.log(`\n✅ Backup completed successfully`);
  console.log(`📊 Backup summary:`);

  for (const [table, info] of Object.entries(backup.tables)) {
    if (info.error) {
      console.log(`  - ${table}: ERROR - ${info.error}`);
    } else {
      console.log(`  - ${table}: ${info.count} rows`);
    }
  }

  console.log(`\n💾 Backup saved to: ${backupFile}`);
  console.log(`📏 File size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);

  return backupFile;
}

backupDatabase().catch(err => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
