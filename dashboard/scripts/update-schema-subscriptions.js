#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '/home/projects/.env' })

// Initialize Supabase with service role for admin operations
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
)

async function updateSchema() {
  console.log('Updating database schema with subscription fields...\n')

  const sql = `
    -- Add subscription fields to profiles table
    ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS subscription_plan_id TEXT,
    ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS subscription_cancel_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;

    -- Create subscription_plans table for plan management
    CREATE TABLE IF NOT EXISTS public.subscription_plans (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      stripe_price_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price_cents INT NOT NULL,
      currency TEXT DEFAULT 'usd',
      interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
      api_calls_limit INT NOT NULL,
      features JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Insert default plans
    INSERT INTO public.subscription_plans (stripe_price_id, name, description, price_cents, interval, api_calls_limit, features)
    VALUES
      ('price_free', 'Free', 'Perfect for trying out SafePrompt', 0, 'month', 10000,
       '["10,000 API calls/month", "Basic threat detection", "Community support"]'::jsonb),
      ('price_starter', 'Starter', 'For small projects and startups', 2900, 'month', 50000,
       '["50,000 API calls/month", "Advanced AI validation", "Email support", "Priority processing"]'::jsonb),
      ('price_pro', 'Pro', 'For production applications', 9900, 'month', 250000,
       '["250,000 API calls/month", "Premium AI models", "Priority support", "Custom rules", "Analytics dashboard"]'::jsonb),
      ('price_enterprise', 'Enterprise', 'Custom solutions for large teams', 29900, 'month', 1000000,
       '["1M+ API calls/month", "Dedicated support", "SLA guarantee", "Custom integration", "Advanced analytics"]'::jsonb)
    ON CONFLICT (stripe_price_id) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        price_cents = EXCLUDED.price_cents,
        api_calls_limit = EXCLUDED.api_calls_limit,
        features = EXCLUDED.features;

    -- Create subscription_history table for tracking changes
    CREATE TABLE IF NOT EXISTS public.subscription_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      action TEXT NOT NULL CHECK (action IN ('created', 'upgraded', 'downgraded', 'canceled', 'reactivated')),
      from_plan_id TEXT,
      to_plan_id TEXT,
      stripe_subscription_id TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Add function to approve waitlist entries
    CREATE OR REPLACE FUNCTION public.approve_waitlist_entry(waitlist_email TEXT)
    RETURNS TEXT AS $$
    DECLARE
      waitlist_rec RECORD;
      new_user_id UUID;
      temp_password TEXT;
    BEGIN
      -- Find waitlist entry
      SELECT * INTO waitlist_rec FROM public.waitlist
      WHERE email = waitlist_email AND converted_to_profile_id IS NULL
      LIMIT 1;

      IF NOT FOUND THEN
        RETURN 'Waitlist entry not found or already approved';
      END IF;

      -- Generate temporary password
      temp_password := substr(md5(random()::text), 1, 16);

      -- This would need to be done via Supabase Auth Admin API in practice
      -- For now, just mark as approved
      UPDATE public.waitlist
      SET approved_at = NOW()
      WHERE id = waitlist_rec.id;

      RETURN 'Approved - Manual user creation required via Auth Admin API';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create function to track API usage
    CREATE OR REPLACE FUNCTION public.increment_api_calls(user_api_key TEXT)
    RETURNS BOOLEAN AS $$
    DECLARE
      profile_rec RECORD;
      plan_rec RECORD;
    BEGIN
      -- Find profile by API key
      SELECT p.*, sp.api_calls_limit
      INTO profile_rec
      FROM public.profiles p
      LEFT JOIN public.subscription_plans sp ON sp.stripe_price_id = p.subscription_plan_id
      WHERE p.api_key = user_api_key AND p.is_active = true;

      IF NOT FOUND THEN
        RETURN false;  -- Invalid API key
      END IF;

      -- Check if within limits
      IF profile_rec.api_calls_this_month >= COALESCE(profile_rec.api_calls_limit, 10000) THEN
        RETURN false;  -- Over limit
      END IF;

      -- Increment counter
      UPDATE public.profiles
      SET api_calls_this_month = api_calls_this_month + 1,
          updated_at = NOW()
      WHERE id = profile_rec.id;

      -- Log the API call
      INSERT INTO public.api_logs (profile_id, endpoint, created_at)
      VALUES (profile_rec.id, '/v1/check', NOW());

      RETURN true;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create function to reset monthly counters
    CREATE OR REPLACE FUNCTION public.reset_monthly_api_calls()
    RETURNS void AS $$
    BEGIN
      UPDATE public.profiles
      SET api_calls_this_month = 0,
          updated_at = NOW()
      WHERE DATE_TRUNC('month', updated_at) < DATE_TRUNC('month', CURRENT_DATE);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
    CREATE INDEX IF NOT EXISTS idx_subscription_history_profile ON subscription_history(profile_id);
    CREATE INDEX IF NOT EXISTS idx_waitlist_approved ON waitlist(approved_at) WHERE approved_at IS NOT NULL;

    -- Add RLS policies
    ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
    ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

    -- Everyone can view active plans
    CREATE POLICY "Public can view active plans" ON subscription_plans
      FOR SELECT USING (is_active = true);

    -- Users can view their own subscription history
    CREATE POLICY "Users can view own subscription history" ON subscription_history
      FOR SELECT USING (profile_id = auth.uid());
  `

  // Try to execute SQL
  try {
    console.log('Note: This SQL should be run directly in Supabase SQL editor')
    console.log('Saving to database/update-subscriptions.sql...')

    const fs = require('fs')
    const path = require('path')

    const dir = path.join(__dirname, '..', 'database')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(path.join(dir, 'update-subscriptions.sql'), sql)

    console.log('✅ SQL saved to database/update-subscriptions.sql')
    console.log('\nNext steps:')
    console.log('1. Go to Supabase SQL editor')
    console.log('2. Run the SQL from database/update-subscriptions.sql')
    console.log('3. Update Stripe webhook endpoint to point to dashboard API')
    console.log('4. Create Stripe products and update price IDs in subscription_plans table')

  } catch (error) {
    console.error('Error:', error)
  }
}

setupSchema().catch(console.error)