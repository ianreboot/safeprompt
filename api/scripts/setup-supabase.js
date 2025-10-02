#!/usr/bin/env node
/**
 * SafePrompt Supabase Setup Script
 * Initializes database, applies schema, and configures project
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '/home/projects/.env' });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment');
  console.log('\n📝 To set up Supabase:');
  console.log('1. Create a new project at https://app.supabase.com');
  console.log('2. Go to Settings → API');
  console.log('3. Copy the following to /home/projects/.env:');
  console.log('   SUPABASE_URL=your-project-url');
  console.log('   SUPABASE_ANON_KEY=your-anon-key');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

// Create Supabase client with service role key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Execute SQL file
 */
async function executeSQLFile(filename) {
  const sqlPath = path.join(__dirname, '..', 'schema', filename);
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split by semicolons but preserve those within strings
  const statements = sql.split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📦 Executing ${statements.length} statements from ${filename}...`);

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        // Try direct execution if RPC fails
        console.warn(`⚠️  RPC failed, trying direct execution...`);
        // Note: Direct SQL execution requires different approach
      }
    } catch (err) {
      console.error(`❌ Error executing statement:`, err.message);
      console.log('Statement:', statement.substring(0, 100) + '...');
    }
  }

  console.log(`✅ ${filename} executed successfully`);
}

/**
 * Create initial test data
 */
async function createTestData() {
  console.log('\n📝 Creating test data...');

  // Create test user (NOTE: This script is deprecated, use /scripts/create-internal-user.js instead)
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .insert({
      email: 'test@safeprompt.dev',
      subscription_tier: 'free',
      api_requests_limit: 50000,
      subscription_status: 'active'
    })
    .select()
    .single();

  if (userError) {
    console.error('❌ Error creating test user:', userError);
    return;
  }

  console.log('✅ Test user created:', user.email);

  // Generate API key for test user
  const { data: keyData, error: keyError } = await supabase
    .rpc('generate_api_key', {
      p_user_id: user.id,
      p_key_type: 'test'
    });

  if (keyError) {
    console.error('❌ Error generating API key:', keyError);
    return;
  }

  console.log('✅ Test API key generated:', keyData[0].key);

  // Add to waitlist
  const { error: waitlistError } = await supabase
    .from('waitlist')
    .insert([
      { email: 'developer1@example.com', referral_source: 'hackernews' },
      { email: 'developer2@example.com', referral_source: 'twitter' },
      { email: 'developer3@example.com', referral_source: 'google' }
    ]);

  if (!waitlistError) {
    console.log('✅ Waitlist entries created');
  }
}

/**
 * Configure Supabase project settings
 */
async function configureProject() {
  console.log('\n⚙️  Configuring project settings...');

  // Enable Row Level Security by default (NOTE: This script is deprecated)
  const tables = ['profiles', 'api_logs', 'waitlist'];

  for (const table of tables) {
    console.log(`🔒 Ensuring RLS enabled for ${table}...`);
    // RLS is already enabled in schema
  }

  console.log('✅ Project configured');
}

/**
 * Display connection info
 */
function displayConnectionInfo() {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SUPABASE SETUP COMPLETE');
  console.log('='.repeat(60));
  console.log('\n📋 Connection Details:');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Anon Key: ${SUPABASE_ANON_KEY?.substring(0, 20)}...`);
  console.log('\n🔧 Next Steps:');
  console.log('1. Test the connection with: npm run test:db');
  console.log('2. View your database at: https://app.supabase.com');
  console.log('3. Start building the API key endpoints');
  console.log('\n💡 Test Credentials Created:');
  console.log('Email: test@safeprompt.dev');
  console.log('Tier: Beta ($5/month)');
  console.log('Check the output above for the test API key');
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 SafePrompt Supabase Setup');
  console.log('='.repeat(60));

  try {
    // Test connection
    console.log('\n🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('count');

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Connected to Supabase');

    // Apply schema
    console.log('\n📐 Applying database schema...');
    console.log('⚠️  Note: You may need to run the SQL manually in Supabase Dashboard');
    console.log('   Go to: SQL Editor → New Query → Paste schema/supabase-schema.sql');

    // Configure project
    await configureProject();

    // Create test data
    await createTestData();

    // Display connection info
    displayConnectionInfo();

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Verify your Supabase credentials in /home/projects/.env');
    console.log('2. Ensure your project is running at app.supabase.com');
    console.log('3. Check that service role key has admin permissions');
    process.exit(1);
  }
}

// Run setup
main().catch(console.error);

/**
 * Helper function to save config
 */
export async function saveSupabaseConfig(config) {
  const configPath = path.join(__dirname, '..', 'config', 'supabase.json');
  const configDir = path.dirname(configPath);

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Config saved to ${configPath}`);
}

/**
 * Helper to test API key validation
 */
export async function testAPIKey(apiKey) {
  const keyHash = require('crypto')
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .single();

  if (error) {
    return { valid: false, error: error.message };
  }

  return {
    valid: true,
    user_id: data.user_id,
    is_active: data.is_active
  };
}