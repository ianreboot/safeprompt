# SafePrompt Database Audit Report
**Date:** October 2, 2025
**Performed by:** Claude (automated audit)

## Issues Found

### 1. ❌ Wrong Column Names in Admin Panel
**Problem:** Admin panel used non-existent column names
**Impact:** Admin displayed incorrect data (tier=null instead of subscription_tier)

**Incorrect columns:**
- `user.tier` → Should be `user.subscription_tier`
- `user.api_calls_this_month` → Should be `user.api_requests_used`

**Fixed:** ✅ Updated admin panel to use correct column names

### 2. ❌ Incorrect subscription_status for Free Users
**Problem:** Users with `subscription_tier='free'` had `subscription_status='active'`
**Impact:** Admin panel showed **$29 revenue** for free users (1 active subscriber × $29)

**Root cause:** Free tier users were marked as "active" subscribers

**Fixed:** ✅ Set `subscription_status='inactive'` for all free tier users

### 3. ❌ Deprecated Tables Still Exist
**Problem:** Old schema tables still in database with stale data

**Tables found:**
- `users` table (deprecated) - 2 records with conflicting data
- `api_keys` table (deprecated) - 0 records but table exists

**Should be removed:** See `/scripts/drop-deprecated-tables.sql`

### 4. ⚠️ Auth/Profiles Mismatch
**Problem:** 7 users in `auth.users` but only 2 in `profiles`
**Impact:** 5 users can log in but have no profile data

**Users without profiles:**
- linpap@gmail.com
- ian@rebootmedia.net (different from ian.ho)
- Several test users (now deleted)

**Partially fixed:** ✅ Deleted 3 test auth users
**Remaining:** 4 auth users, 2 profiles (2 users still missing profiles)

### 5. ✅ Test Data Cleanup
**Cleaned:**
- Deleted 3 test users from auth.users
- Deleted 7 test entries from waitlist
- Remaining: 1 real waitlist entry (marisol78@goodpostman.com)

## Database Schema (Correct)

### profiles table columns:
```
- id
- email
- stripe_customer_id
- stripe_subscription_id
- subscription_tier (was: tier)
- subscription_status
- api_key_hash
- api_key_hint
- api_requests_limit
- api_requests_used (was: api_calls_this_month)
- last_used_at
- is_active
- created_at
- updated_at
- api_key
```

## Current State (After Fixes)

**auth.users:** 4 users
- ian.ho@rebootmedia.net ✅ has profile
- arsh.s@rebootmedia.net ✅ has profile
- ian@rebootmedia.net ❌ no profile
- linpap@gmail.com ❌ no profile

**profiles:** 2 users (both now have correct subscription_status='inactive')

**waitlist:** 1 entry (marisol78@goodpostman.com)

**api_logs:** 97 requests

## Actions Required

1. **Drop deprecated tables:**
   Run SQL in Supabase SQL Editor:
   ```sql
   DROP TABLE IF EXISTS users CASCADE;
   DROP TABLE IF EXISTS api_keys CASCADE;
   DROP TABLE IF EXISTS validation_logs CASCADE;
   ```

2. **Decide on missing profiles:**
   - Delete orphaned auth users (ian@rebootmedia.net, linpap@gmail.com)?
   - OR create profiles for them?

3. **Update ARCHITECTURE.md:**
   - Remove references to deprecated `tier` column
   - Update to use `subscription_tier`
   - Remove deprecated table documentation

## Admin Panel Fixed

✅ **Revenue now shows $0** (no active paid subscribers)
✅ **Tier displays correctly** (free, not null)
✅ **API usage shows** with limit (e.g., "8 / 10000")
