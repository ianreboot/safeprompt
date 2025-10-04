#!/bin/bash
# Run migration 003: Add is_admin flag to profiles table
# SafePrompt Production Database

set -e  # Exit on error

echo "Running migration 003_add_admin_flag.sql on PRODUCTION database..."
echo "Database: adyfhzbcsqzgqvyimycv.supabase.co"
echo ""

# Load password from /home/projects/.env
export PGPASSWORD='PX1N&&$Yd6%AMb*6CHcc'

# Run migration
psql \
  -h db.adyfhzbcsqzgqvyimycv.supabase.co \
  -p 5432 \
  -U postgres.adyfhzbcsqzgqvyimycv \
  -d postgres \
  -f /home/projects/safeprompt/api/migrations/003_add_admin_flag.sql

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "Verifying is_admin column exists..."

# Verify migration
psql \
  -h db.adyfhzbcsqzgqvyimycv.supabase.co \
  -p 5432 \
  -U postgres.adyfhzbcsqzgqvyimycv \
  -d postgres \
  -c "SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_admin';"

echo ""
echo "Checking admin user..."

# Check admin user
psql \
  -h db.adyfhzbcsqzgqvyimycv.supabase.co \
  -p 5432 \
  -U postgres.adyfhzbcsqzgqvyimycv \
  -d postgres \
  -c "SELECT email, is_admin
      FROM public.profiles
      WHERE email = 'ian.ho@rebootmedia.net';"

echo ""
echo "✅ All checks passed!"
