-- Create test users for Phase 1A manual testing
-- Run in Supabase SQL Editor (DEV database)

-- Generate test users with proper UUIDs
-- Note: Store the generated UUIDs - you'll need them for the test script

-- Test User 1: Free tier
INSERT INTO profiles (id, email, subscription_tier, preferences, api_key)
VALUES (
  gen_random_uuid(),
  'test-free@safeprompt.dev',
  'free',
  '{"intelligence_sharing": true}'::jsonb,
  'sp_test_free_' || encode(gen_random_bytes(16), 'hex')
)
RETURNING id, email, subscription_tier, api_key;

-- Test User 2: Pro tier (opted in)
INSERT INTO profiles (id, email, subscription_tier, preferences, api_key)
VALUES (
  gen_random_uuid(),
  'test-pro@safeprompt.dev',
  'pro',
  '{"intelligence_sharing": true, "auto_block_enabled": true}'::jsonb,
  'sp_test_pro_' || encode(gen_random_bytes(16), 'hex')
)
RETURNING id, email, subscription_tier, api_key;

-- Test User 3: Pro tier (opted out)
INSERT INTO profiles (id, email, subscription_tier, preferences, api_key)
VALUES (
  gen_random_uuid(),
  'test-pro-optout@safeprompt.dev',
  'pro',
  '{"intelligence_sharing": false, "auto_block_enabled": false}'::jsonb,
  'sp_test_pro_optout_' || encode(gen_random_bytes(16), 'hex')
)
RETURNING id, email, subscription_tier, api_key;

-- Test User 4: Internal tier
INSERT INTO profiles (id, email, subscription_tier, preferences, api_key)
VALUES (
  gen_random_uuid(),
  'test-internal@safeprompt.dev',
  'internal',
  '{}'::jsonb,
  'sp_test_internal_' || encode(gen_random_bytes(16), 'hex')
)
RETURNING id, email, subscription_tier, api_key;

-- Quick lookup query (run this to get all test user IDs and API keys)
SELECT
  id,
  email,
  subscription_tier,
  api_key,
  preferences
FROM profiles
WHERE email LIKE '%@safeprompt.dev'
ORDER BY email;

-- Export test IDs to environment variables (copy the UUIDs from above):
-- export TEST_FREE_ID="<uuid-from-first-insert>"
-- export TEST_PRO_ID="<uuid-from-second-insert>"
-- export TEST_PRO_OPTOUT_ID="<uuid-from-third-insert>"
-- export TEST_INTERNAL_ID="<uuid-from-fourth-insert>"
