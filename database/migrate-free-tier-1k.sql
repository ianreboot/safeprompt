-- Migration: Reduce free tier from 10K to 1K requests/month
-- Date: 2025-10-04
-- Reason: Economic sustainability after Product Hunt launch audit

-- Update all existing free tier users from 10000 to 1000
UPDATE public.profiles
SET 
  api_requests_limit = 1000,
  updated_at = NOW()
WHERE 
  subscription_tier = 'free' 
  AND api_requests_limit = 10000;

-- Verify the update
SELECT 
  COUNT(*) as updated_users,
  subscription_tier,
  api_requests_limit
FROM public.profiles
WHERE subscription_tier = 'free'
GROUP BY subscription_tier, api_requests_limit;
