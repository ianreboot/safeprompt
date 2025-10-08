-- ============================================================================
-- Migration: Fix tier naming to match Stripe subscriptions
-- Date: 2025-10-08
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================================
--
-- BACKGROUND:
-- The database tier constraint was using outdated tier names (beta, pro, enterprise)
-- that don't match Stripe subscription names (early_bird, starter, business).
-- This migration aligns database constraints with Stripe's source of truth.
--
-- SOURCE OF TRUTH: api/api/stripe-checkout.js PRICE_IDS
-- Valid tiers: free, early_bird, starter, business, internal
--
-- NOTE: The profiles table uses subscription_tier as the base column,
-- and tier as a GENERATED column. We need to update subscription_tier.
-- ============================================================================

-- Drop old constraint if exists on profiles.subscription_tier (idempotent)
DO $$
BEGIN
  -- Check if constraint exists on profiles table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name LIKE '%subscription_tier%'
    AND table_name = 'profiles'
    AND constraint_type = 'CHECK'
  ) THEN
    -- Get the actual constraint name and drop it
    EXECUTE (
      SELECT 'ALTER TABLE profiles DROP CONSTRAINT ' || constraint_name || ';'
      FROM information_schema.table_constraints
      WHERE constraint_name LIKE '%subscription_tier%'
      AND table_name = 'profiles'
      AND constraint_type = 'CHECK'
      LIMIT 1
    );
  END IF;
END $$;

-- Add new constraint with correct tier names
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'early_bird', 'starter', 'business', 'internal'));

-- Update existing tier values (idempotent with WHERE clause)
-- beta → early_bird (launch pricing tier)
UPDATE profiles
SET subscription_tier = 'early_bird'
WHERE subscription_tier = 'beta';

-- pro → business (standard paid tier)
UPDATE profiles
SET subscription_tier = 'business'
WHERE subscription_tier = 'pro';

-- enterprise → business (consolidated into business tier)
UPDATE profiles
SET subscription_tier = 'business'
WHERE subscription_tier = 'enterprise';

-- ============================================================================
-- VERIFICATION QUERIES (comment out - for manual verification only)
-- ============================================================================
-- SELECT tier, COUNT(*) FROM users GROUP BY tier ORDER BY tier;
-- SELECT * FROM users WHERE tier NOT IN ('free', 'early_bird', 'starter', 'business', 'internal');
