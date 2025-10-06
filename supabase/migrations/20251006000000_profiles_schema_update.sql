-- SafePrompt Phase 1A: Update profiles table schema
-- This migration adds tier column and preferences for backward compatibility

-- Add tier column as computed column from subscription_tier
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'tier'
    ) THEN
        ALTER TABLE profiles ADD COLUMN tier TEXT GENERATED ALWAYS AS (subscription_tier) STORED;
    END IF;
END $$;

-- Add preferences column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'preferences'
    ) THEN
        ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
