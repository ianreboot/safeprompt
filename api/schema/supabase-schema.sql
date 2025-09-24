-- SafePrompt API Key Management Schema
-- Database: Supabase PostgreSQL
-- Created: 2025-09-23

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (managed by Supabase Auth mostly)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Subscription details
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'beta', 'starter', 'pro', 'enterprise')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'inactive',
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,

    -- Beta program
    is_beta_user BOOLEAN DEFAULT FALSE,
    beta_price DECIMAL(10, 2), -- Lock in beta pricing
    waitlist_position INTEGER,
    waitlist_joined_at TIMESTAMP WITH TIME ZONE,

    -- Usage limits based on tier
    monthly_limit INTEGER DEFAULT 100, -- Free tier: 100/day = ~3000/month

    -- Metadata
    company_name TEXT,
    use_case TEXT,
    referral_source TEXT
);

-- API Keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Key details (store hash for security)
    key_prefix TEXT NOT NULL, -- 'sp_live_' or 'sp_test_'
    key_hash TEXT NOT NULL, -- SHA256 hash of full key
    key_hint TEXT NOT NULL, -- Last 4 characters for identification

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration

    -- Usage tracking
    total_requests BIGINT DEFAULT 0,
    monthly_requests BIGINT DEFAULT 0,

    -- Metadata
    name TEXT, -- User-provided key name
    description TEXT,

    -- Constraints
    UNIQUE(key_hash),
    INDEX idx_key_hash (key_hash),
    INDEX idx_user_keys (user_id, is_active)
);

-- Usage logs table (partitioned by month for performance)
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,

    -- Request details
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    endpoint TEXT NOT NULL,
    method TEXT DEFAULT 'POST',

    -- Response details
    response_time_ms INTEGER,
    status_code INTEGER,
    validation_result TEXT, -- 'safe', 'unsafe', 'error'

    -- Performance tracking
    used_cache BOOLEAN DEFAULT FALSE,
    used_ai BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3, 2),

    -- Threat detection
    threats_detected TEXT[], -- Array of threat types

    -- Request size (for billing if needed)
    request_size_bytes INTEGER,

    -- Indexing for queries
    INDEX idx_timestamp (timestamp DESC),
    INDEX idx_api_key_usage (api_key_id, timestamp DESC)
) PARTITION BY RANGE (timestamp);

-- Create partitions for usage logs (example for next 6 months)
CREATE TABLE usage_logs_2025_01 PARTITION OF usage_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE usage_logs_2025_02 PARTITION OF usage_logs
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE usage_logs_2025_03 PARTITION OF usage_logs
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    position SERIAL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Tracking
    referral_source TEXT,
    use_case TEXT,
    company_size TEXT,

    -- Status
    converted_to_user_id UUID REFERENCES public.users(id),
    converted_at TIMESTAMP WITH TIME ZONE,

    INDEX idx_waitlist_position (position),
    INDEX idx_waitlist_email (email)
);

-- Attack patterns table (for learning from detections)
CREATE TABLE IF NOT EXISTS public.attack_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern TEXT NOT NULL,
    pattern_type TEXT NOT NULL, -- 'prompt_injection', 'xss', 'sql_injection', etc.

    -- Detection stats
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    detection_count BIGINT DEFAULT 1,

    -- Effectiveness
    false_positive_count INTEGER DEFAULT 0,
    confirmed_threat BOOLEAN DEFAULT TRUE,

    -- Auto-learning
    auto_discovered BOOLEAN DEFAULT FALSE,
    ai_confidence DECIMAL(3, 2),

    INDEX idx_pattern_type (pattern_type),
    INDEX idx_detection_count (detection_count DESC)
);

-- Billing events table (for Stripe webhook events)
CREATE TABLE IF NOT EXISTS public.billing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    -- Stripe details
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,

    -- Event data
    amount DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    status TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,

    -- Raw data for debugging
    raw_data JSONB,

    INDEX idx_stripe_event (stripe_event_id),
    INDEX idx_user_billing (user_id, created_at DESC)
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_policy ON public.users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY api_keys_policy ON public.api_keys
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY usage_logs_policy ON public.usage_logs
    FOR SELECT USING (
        api_key_id IN (
            SELECT id FROM public.api_keys WHERE user_id = auth.uid()
        )
    );

-- Functions

-- Generate API key
CREATE OR REPLACE FUNCTION generate_api_key(
    p_user_id UUID,
    p_key_type TEXT DEFAULT 'live'
) RETURNS TABLE(key TEXT, key_id UUID) AS $$
DECLARE
    v_key TEXT;
    v_key_id UUID;
    v_prefix TEXT;
    v_random_part TEXT;
BEGIN
    -- Determine prefix
    v_prefix := CASE
        WHEN p_key_type = 'test' THEN 'sp_test_'
        ELSE 'sp_live_'
    END;

    -- Generate random part (32 chars)
    v_random_part := encode(gen_random_bytes(24), 'base64');
    v_random_part := replace(v_random_part, '/', '');
    v_random_part := replace(v_random_part, '+', '');

    -- Combine
    v_key := v_prefix || v_random_part;

    -- Insert into database
    INSERT INTO public.api_keys (
        user_id,
        key_prefix,
        key_hash,
        key_hint
    ) VALUES (
        p_user_id,
        v_prefix,
        encode(digest(v_key, 'sha256'), 'hex'),
        right(v_key, 4)
    ) RETURNING id INTO v_key_id;

    RETURN QUERY SELECT v_key, v_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_api_key_hash TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_monthly_limit INTEGER;
    v_current_usage BIGINT;
BEGIN
    -- Get user and limits
    SELECT u.id, u.monthly_limit, ak.monthly_requests
    INTO v_user_id, v_monthly_limit, v_current_usage
    FROM public.api_keys ak
    JOIN public.users u ON ak.user_id = u.id
    WHERE ak.key_hash = p_api_key_hash
    AND ak.is_active = TRUE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if under limit
    RETURN v_current_usage < v_monthly_limit;
END;
$$ LANGUAGE plpgsql;

-- Reset monthly usage (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_usage() RETURNS void AS $$
BEGIN
    UPDATE public.api_keys
    SET monthly_requests = 0
    WHERE DATE_TRUNC('month', last_used_at) < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Track usage
CREATE OR REPLACE FUNCTION track_api_usage(
    p_api_key_hash TEXT,
    p_endpoint TEXT,
    p_response_time_ms INTEGER,
    p_validation_result TEXT,
    p_used_cache BOOLEAN,
    p_used_ai BOOLEAN,
    p_threats TEXT[]
) RETURNS void AS $$
DECLARE
    v_api_key_id UUID;
BEGIN
    -- Get API key ID and update counters
    UPDATE public.api_keys
    SET
        total_requests = total_requests + 1,
        monthly_requests = monthly_requests + 1,
        last_used_at = NOW()
    WHERE key_hash = p_api_key_hash
    AND is_active = TRUE
    RETURNING id INTO v_api_key_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid API key';
    END IF;

    -- Log the usage
    INSERT INTO public.usage_logs (
        api_key_id,
        endpoint,
        response_time_ms,
        validation_result,
        used_cache,
        used_ai,
        threats_detected
    ) VALUES (
        v_api_key_id,
        p_endpoint,
        p_response_time_ms,
        p_validation_result,
        p_used_cache,
        p_used_ai,
        p_threats
    );
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe ON public.users(stripe_customer_id);
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active, created_at DESC);
CREATE INDEX idx_usage_logs_recent ON public.usage_logs(timestamp DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Initial data
INSERT INTO public.users (email, tier, monthly_limit)
VALUES ('demo@safeprompt.dev', 'free', 100)
ON CONFLICT (email) DO NOTHING;