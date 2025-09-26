# SafePrompt Architecture Migration Guide

**Migration Date**: January 2025
**Old System**: Separate `api_keys` and `users` tables
**New System**: Unified `profiles` table with Stripe integration

## 🎯 Overview

SafePrompt has been migrated to a proper SaaS architecture with unified user profiles, Stripe subscription management, and comprehensive user lifecycle handling.

## 📊 Database Schema Changes

### Old Architecture
```sql
-- Separate tables causing sync issues
users (id, email, tier, monthly_limit)
api_keys (id, user_id, key_hash, monthly_requests)
validation_logs (user_id, ...)
```

### New Architecture
```sql
-- Unified profile system
profiles (
  id UUID (matches auth.users.id),
  email TEXT,
  api_key TEXT,
  stripe_customer_id TEXT,
  subscription_status TEXT,
  subscription_plan_id TEXT,
  api_calls_this_month INT,
  ...
)

-- Proper API tracking
api_logs (profile_id, endpoint, prompt_length, response_time_ms)

-- Subscription management
subscription_plans (stripe_price_id, name, api_calls_limit, ...)
subscription_history (profile_id, action, from_plan, to_plan, ...)

-- Waitlist with conversion tracking
waitlist (email, converted_to_profile_id, approved_at)
```

## 🔄 Key Changes

### 1. Authentication & Profile Creation
**Old**: Manual user creation, separate API key generation
**New**: Automatic profile creation via auth trigger, integrated API key generation

### 2. API Key Management
**Old**: Hashed keys in separate table
**New**: Direct storage in profiles table (consider hashing for production)

### 3. Usage Tracking
**Old**: `validation_logs` table
**New**: `api_logs` table with proper foreign keys to profiles

### 4. Subscription Management
**Old**: Basic tier field in users table
**New**: Full Stripe integration with subscription history tracking

## 📁 File Changes

### Dashboard (`/dashboard/`)
- ✅ `src/app/page.tsx` - Updated to use profiles table
- ✅ `src/app/api/stripe-webhook/route.ts` - New Stripe webhook handler
- ✅ `src/app/api/subscription/route.ts` - Subscription management endpoints
- ✅ `src/app/api/waitlist/approve/route.ts` - Waitlist approval workflow

### API (`/api/`)
- ⚠️ `api/v1/check-protected.js` - OLD VERSION (keep for reference)
- ✅ `api/v1/check-protected-new.js` - NEW VERSION using profiles table
- ⚠️ `api/v1/stripe-webhook.js` - OLD VERSION (needs update or removal)

### Database Scripts (`/dashboard/scripts/`)
- ✅ `setup-database.js` - Creates new schema
- ✅ `setup-users.js` - User initialization with profiles
- ✅ `update-schema-subscriptions.js` - Adds subscription fields
- ✅ `test-user-lifecycle.js` - Comprehensive testing

## 🚀 Migration Steps

### 1. Update Database Schema
```bash
cd /home/projects/safeprompt/dashboard
node scripts/setup-database.js
node scripts/update-schema-subscriptions.js
# Run generated SQL in Supabase dashboard
```

### 2. Initialize Users
```bash
node scripts/setup-users.js
# Creates demo and admin users with profiles
```

### 3. Update API Endpoints
Replace old endpoint with new version:
```bash
mv api/api/v1/check-protected.js api/api/v1/check-protected-old.js
mv api/api/v1/check-protected-new.js api/api/v1/check-protected.js
```

### 4. Configure Stripe
1. Create products in Stripe dashboard
2. Update price IDs in `subscription_plans` table
3. Set webhook endpoint to `/api/stripe-webhook`
4. Add webhook secret to environment variables

### 5. Test User Flows
```bash
node scripts/test-user-lifecycle.js
```

## 🔐 Environment Variables

Required in `/home/projects/.env`:
```bash
# Supabase
SAFEPROMPT_SUPABASE_URL=
SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App URLs
NEXT_PUBLIC_APP_URL=https://dashboard.safeprompt.dev
```

## 🎯 User Lifecycle Scenarios

### Waitlist → Approved → Active User
1. User joins waitlist via website
2. Admin approves via `/api/waitlist/approve`
3. User receives welcome email with temp password
4. User logs in and gets API key from profile

### Free User → Paid Subscriber
1. Free user hits API limit
2. Clicks upgrade in dashboard
3. Stripe checkout session created
4. Webhook creates Stripe customer ID
5. Profile updated with subscription

### Subscription Management
1. **Upgrade**: Change plan via `/api/subscription` POST
2. **Downgrade**: Same endpoint, different price_id
3. **Cancel**: DELETE `/api/subscription`
4. **Reactivate**: POST before period_end

## ⚠️ Breaking Changes

1. **API Keys**: Now stored directly in profiles (not hashed)
   - Consider adding hashing for production

2. **User IDs**: Now use Supabase Auth UUID
   - Update all foreign keys

3. **Rate Limiting**: Based on subscription_plan_id
   - Free: 10,000/month
   - Starter: 50,000/month
   - Pro: 250,000/month
   - Enterprise: 1,000,000+/month

## 🧹 Cleanup Tasks

### Remove Old Files
```bash
# After confirming new system works
rm api/api/v1/check-protected-old.js
rm api/api/v1/keys.js  # Old key management
```

### Drop Old Tables (After Data Migration)
```sql
-- Only after confirming all data migrated
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS validation_logs CASCADE;
```

## 📊 Monitoring

### Key Metrics
- Profile creation rate
- API usage by tier
- Subscription conversion rate
- Churn rate by plan

### Health Checks
```javascript
// Check profile creation trigger
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM auth.users;
-- Should match

// Check API usage tracking
SELECT COUNT(*) FROM api_logs WHERE created_at > NOW() - INTERVAL '1 hour';

// Check subscription status
SELECT subscription_status, COUNT(*) FROM profiles GROUP BY subscription_status;
```

## 🚨 Rollback Plan

If issues arise:
1. Keep old tables intact during migration
2. Maintain old API endpoint as `-old.js`
3. Can switch back by renaming files
4. Database changes are additive (new columns/tables)

## ✅ Success Criteria

- [ ] All auth users have matching profiles
- [ ] API keys work for authentication
- [ ] Usage tracking increments correctly
- [ ] Stripe webhooks process payments
- [ ] Subscription changes reflect in profiles
- [ ] Waitlist approval creates users
- [ ] Monthly counters reset properly

## 📝 Notes

- Consider adding API key hashing for production security
- Email integration (Resend) needs to be configured
- Stripe products need manual creation and price ID updates
- Monthly reset can be automated with cron job or Supabase function