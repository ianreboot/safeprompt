-- Repair Migration: Add missing column to ip_reputation
-- Created: 2025-10-07
-- Purpose: Fix schema mismatch where ip_reputation exists without country_code column

DO $$
BEGIN
  -- Add country_code if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ip_reputation'
      AND column_name = 'country_code'
  ) THEN
    ALTER TABLE ip_reputation ADD COLUMN country_code CHAR(2);
  END IF;

  -- Add other potentially missing columns from Phase 1A
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ip_reputation'
      AND column_name = 'is_proxy'
  ) THEN
    ALTER TABLE ip_reputation ADD COLUMN is_proxy BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ip_reputation'
      AND column_name = 'is_vpn'
  ) THEN
    ALTER TABLE ip_reputation ADD COLUMN is_vpn BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ip_reputation'
      AND column_name = 'is_hosting'
  ) THEN
    ALTER TABLE ip_reputation ADD COLUMN is_hosting BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ip_reputation'
      AND column_name = 'isp'
  ) THEN
    ALTER TABLE ip_reputation ADD COLUMN isp TEXT;
  END IF;
END $$;

-- Now create the index that was failing
CREATE INDEX IF NOT EXISTS idx_ip_reputation_country
  ON ip_reputation(country_code);

COMMENT ON COLUMN ip_reputation.country_code IS 'ISO country code from IP geolocation (not PII)';
