-- SafePrompt Database Audit Script
-- Purpose: Understand where users are stored and clean up confusion

-- 1. Check auth.users (Supabase authentication)
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users;
SELECT 'auth.users - Details' as info, id, email, created_at FROM auth.users;

-- 2. Check profiles table (current active table)
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles;
SELECT 'profiles - Details' as info, id, email, subscription_tier, subscription_status, stripe_customer_id, api_requests_used, is_active, created_at FROM profiles;

-- 3. Check if deprecated 'users' table exists
SELECT 'users (deprecated)' as table_name, COUNT(*) as count FROM users;
SELECT 'users - Details' as info, * FROM users LIMIT 10;

-- 4. Check waitlist table
SELECT 'waitlist' as table_name, COUNT(*) as count FROM waitlist;
SELECT 'waitlist - Details' as info, email, converted_to_profile_id, approved_at, created_at FROM waitlist;

-- 5. Check if deprecated 'api_keys' table exists
SELECT 'api_keys (deprecated)' as table_name, COUNT(*) as count FROM api_keys;

-- 6. Check api_logs
SELECT 'api_logs' as table_name, COUNT(*) as count FROM api_logs;

-- 7. List all tables in public schema
SELECT 'All public tables' as info, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
