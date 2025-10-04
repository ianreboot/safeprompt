-- Migration: Add is_admin flag to profiles table
-- Purpose: Replace static admin key with proper role-based access control
-- Created: 2025-10-04

-- Add is_admin column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set ian.ho@rebootmedia.net as admin user
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE email = 'ian.ho@rebootmedia.net';

-- Create index for admin queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin 
ON public.profiles(is_admin) 
WHERE is_admin = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_admin IS 'Admin flag for role-based access control. Set to TRUE for admin users.';

-- Verify the change
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count 
  FROM public.profiles 
  WHERE is_admin = TRUE;
  
  RAISE NOTICE 'Admin flag added successfully. Admin users: %', admin_count;
END $$;
