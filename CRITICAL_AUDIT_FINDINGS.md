# CRITICAL SAFEPROMPT AUDIT FINDINGS

## 🚨 CRITICAL ISSUES IDENTIFIED

### 1. SECURITY: Profiles Table Has Both api_key AND api_key_hash
**RISK: HIGH**
- `api_key` column (text, nullable) - **PLAINTEXT API KEY STORAGE**
- `api_key_hash` column (text, nullable) - Hash storage
- **ACTION REQUIRED**: Verify if api_key column contains plaintext keys
- **RECOMMENDATION**: Drop api_key column if unused, only use api_key_hash

### 2. RLS POLICY GAPS
**Playground Tables** - NO user-level RLS policies:
- `playground_analytics` - Service role only
- `playground_rate_limits` - Service role only  
- `playground_requests` - Service role only
- **RISK**: If API uses anon key, these tables are completely inaccessible
- **IMPACT**: Playground features may be broken for public users

**billing_events** - Service role only:
- No user access policies
- **IMPACT**: Users cannot view their own billing history

**profiles** - Missing policies:
- ❌ No INSERT policy (users can't create profiles)
- ❌ No DELETE policy (users can't delete accounts)
- ✅ SELECT: Users can view own + Admins can view all
- ✅ UPDATE: Users can update own

### 3. FIELD MAPPING ISSUES

**billing_events.user_id vs profiles.id**:
- billing_events uses `user_id` (uuid)
- profiles primary key is `id` (uuid)
- **VERIFY**: FK constraint exists and field naming is intentional

**waitlist table missing columns** (previously referenced in code):
- Missing: `approved` column
- Missing: `converted_to_profile_id` column
- **STATUS**: Code already fixed to remove these references

## 📊 SCHEMA SUMMARY

### Public Tables:
1. **profiles** (7 users) - Main user table ✅
2. **api_logs** (97 logs) - API usage tracking ✅
3. **waitlist** (1 entry) - Email capture ✅
4. **billing_events** - Stripe webhook events ⚠️
5. **playground_analytics** - Playground metrics ⚠️
6. **playground_rate_limits** - IP-based rate limiting ⚠️
7. **playground_requests** - Playground request logs ⚠️

### Auth Tables:
- **auth.users** - Supabase auth (4 users) ✅
- RLS policy added: "Users can read own auth data" ✅

## 🔍 NEXT STEPS

1. ✅ Check if api_key column contains data
2. ✅ Verify playground API access patterns
3. ✅ Review Stripe webhook implementation
4. ✅ Audit API documentation accuracy
5. ✅ Validate signup/payment flows
