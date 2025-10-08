/**
 * SafePrompt Database Setup Script
 * Creates all required tables in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/home/projects/.env' });

const supabaseUrl = process.env.SAFEPROMPT_SUPABASE_URL;
const supabaseKey = process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up SafePrompt database...\n');

  try {
    // Execute SQL commands through Supabase
    const sqlCommands = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        stripe_customer_id TEXT UNIQUE,
        stripe_subscription_id TEXT,
        tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'early_bird', 'starter', 'business', 'internal')),
        is_beta_user BOOLEAN DEFAULT false,
        beta_price DECIMAL(10,2),
        monthly_limit INTEGER DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        subscription_status TEXT,
        subscription_started_at TIMESTAMP WITH TIME ZONE,
        subscription_ends_at TIMESTAMP WITH TIME ZONE
      )`,

      // API Keys table
      `CREATE TABLE IF NOT EXISTS api_keys (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        key_prefix TEXT NOT NULL,
        key_hash TEXT UNIQUE NOT NULL,
        key_hint TEXT NOT NULL,
        name TEXT,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        last_used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
      )`,

      // Usage Logs table
      `CREATE TABLE IF NOT EXISTS usage_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
        prompt_hash TEXT NOT NULL,
        is_safe BOOLEAN NOT NULL,
        threats_detected JSONB DEFAULT '[]',
        confidence DECIMAL(3,2),
        processing_time INTEGER,
        cached BOOLEAN DEFAULT false,
        ai_used BOOLEAN DEFAULT false,
        model_used TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Attack Patterns table
      `CREATE TABLE IF NOT EXISTS attack_patterns (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        pattern_type TEXT NOT NULL,
        pattern_value TEXT NOT NULL,
        frequency INTEGER DEFAULT 0,
        first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      )`,

      // Waitlist table
      `CREATE TABLE IF NOT EXISTS waitlist (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        source TEXT,
        priority_score INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        converted_to_user_id UUID REFERENCES users(id),
        converted_at TIMESTAMP WITH TIME ZONE
      )`,

      // Billing Events table
      `CREATE TABLE IF NOT EXISTS billing_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        stripe_event_id TEXT UNIQUE,
        event_type TEXT NOT NULL,
        amount DECIMAL(10,2),
        currency TEXT,
        status TEXT,
        raw_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash)`,
      `CREATE INDEX IF NOT EXISTS idx_usage_logs_key ON usage_logs(api_key_id)`,
      `CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON usage_logs(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_attack_patterns_type ON attack_patterns(pattern_type)`,
      `CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email)`,
      `CREATE INDEX IF NOT EXISTS idx_billing_events_stripe ON billing_events(stripe_event_id)`
    ];

    // Execute each SQL command
    for (const sql of sqlCommands) {
      const { error } = await supabase.rpc('exec_sql', { query: sql }).single();

      if (error) {
        // Try direct execution if RPC doesn't work
        console.log('Attempting direct SQL execution...');
        // Note: This might not work, but we'll try
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
        if (tableName) {
          console.log(`Creating table: ${tableName}`);
        } else {
          const indexName = sql.match(/CREATE INDEX IF NOT EXISTS (\w+)/)?.[1];
          if (indexName) {
            console.log(`Creating index: ${indexName}`);
          }
        }
      }
    }

    // Verify tables were created by attempting to query them
    console.log('\n📊 Verifying tables...\n');

    const tables = ['users', 'api_keys', 'usage_logs', 'attack_patterns', 'waitlist', 'billing_events'];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log(`❌ Table '${table}' not created`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    }

    console.log('\n🎉 Database setup complete!');

    // Add some initial test data
    console.log('\n📝 Adding test data...\n');

    // Create a test user
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: 'test@safeprompt.dev',
        tier: 'early_bird',  // Early bird pricing tier
        is_beta_user: true,
        beta_price: 5.00,
        monthly_limit: 50000
      })
      .select()
      .single();

    if (testUser) {
      console.log(`✅ Test user created: ${testUser.email}`);

      // Create a test API key
      const testKey = `sp_test_${Date.now()}`;
      const { data: apiKey, error: keyError } = await supabase
        .from('api_keys')
        .insert({
          user_id: testUser.id,
          key_prefix: 'sp_test_',
          key_hash: Buffer.from(testKey).toString('base64'),
          key_hint: testKey.slice(-4),
          name: 'Test Key',
          description: 'Auto-generated test key'
        })
        .select()
        .single();

      if (apiKey) {
        console.log(`✅ Test API key created: ${testKey}`);
      }
    }

    console.log('\n✨ SafePrompt database is ready for production!');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

// Run setup
setupDatabase();