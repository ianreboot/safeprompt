-- Add internal flag to profiles table for test accounts
-- This allows unlimited API usage without hacking authentication

-- 1. Add is_internal column to existing profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;

-- 2. Add comment to explain the field
COMMENT ON COLUMN public.profiles.is_internal IS 'Internal test accounts bypass API limits for dogfooding';

-- 3. Create our test account
-- First create auth user (if not exists)
DO $$
BEGIN
  -- Check if test user already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'test@safeprompt.dev'
  ) THEN
    -- Insert test user directly (requires service role)
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      gen_random_uuid(),
      'test@safeprompt.dev',
      crypt('SafePromptTest2025!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}'
    );
  END IF;
END $$;

-- 4. Update or insert the profile with internal flag
INSERT INTO public.profiles (
  id,
  email,
  api_key,
  is_internal,
  api_requests_used,
  api_requests_limit,
  is_active
)
SELECT
  id,
  'test@safeprompt.dev',
  'sp_test_unlimited_dogfood_key_2025',
  true, -- Internal account
  0,
  999999, -- High limit as backup
  true
FROM auth.users
WHERE email = 'test@safeprompt.dev'
ON CONFLICT (id) DO UPDATE SET
  is_internal = true,
  api_key = 'sp_test_unlimited_dogfood_key_2025',
  api_requests_limit = 999999,
  is_active = true;

-- 5. Verify the test account was created
SELECT
  email,
  api_key,
  is_internal,
  api_requests_limit,
  'Test account created successfully' as status
FROM profiles
WHERE email = 'test@safeprompt.dev';