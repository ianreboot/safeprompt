#!/usr/bin/env node
/**
 * Execute SQL file against Supabase using node-postgres
 */
import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.vkyggknknyfallmnrmfu',
  password: process.env.SAFEPROMPT_SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function runSQL() {
  try {
    console.log('Connecting to database...');
    await client.connect();

    const sqlFile = process.argv[2];
    if (!sqlFile) {
      console.error('Usage: node run-sql.js <sql-file>');
      process.exit(1);
    }

    console.log(`Reading ${sqlFile}...`);
    const sql = readFileSync(sqlFile, 'utf8');

    console.log('Executing SQL...');
    const result = await client.query(sql);

    console.log('✅ SQL executed successfully!');
    console.log('Rows affected:', result.rowCount);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSQL();
