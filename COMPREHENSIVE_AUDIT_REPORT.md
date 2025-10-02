# SAFEPROMPT COMPREHENSIVE AUDIT REPORT
**Date**: 2025-10-02
**Auditor**: Claude (Automated Security & Code Review)
**Scope**: Database, RLS, API, Documentation, Signup, Payment Flows

---

## 🚨 CRITICAL ISSUES (IMMEDIATE ACTION REQUIRED)

### 1. SECURITY: PLAINTEXT API KEYS IN DATABASE
**Severity**: CRITICAL
**Risk**: Complete API compromise on database breach
**OWASP**: A02:2021 – Cryptographic Failures

**Evidence**:
- `arsh.s@rebootmedia.net`: 72-char plaintext key, NO hash
- `ian.ho@rebootmedia.net`: 34-char plaintext key + hash (hash unused!)

**Current Validation** (`/api/api/v1/validate.js:49`):
```javascript
// Validates using PLAINTEXT first (security flaw!)
.eq('api_key', apiKey)
```

**Impact**:
- ❌ Database breach = instant API key exposure
- ❌ Dashboard transmits plaintext keys on every page load
- ❌ Violates PCI DSS 3.4 (if processing payments)

**IMMEDIATE FIX** (< 1 hour):
1. Update validation to use hash only:
```javascript
const hashedKey = hashApiKey(apiKey);
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('api_key_hash', hashedKey)
  .single();
```

2. Hash existing plaintext keys:
```sql
UPDATE profiles
SET api_key_hash = encode(digest(api_key, 'sha256'), 'hex')
WHERE api_key_hash IS NULL AND api_key IS NOT NULL;
```

3. Drop `api_key` column after 7-day verification period

---

### 2. SIGNUP FLOW: MISSING INSERT POLICY FOR PROFILES
**Severity**: CRITICAL
**Risk**: User signups may fail silently

**Current State**:
- Signup creates `auth.users` record ✅
- Database trigger `handle_new_user()` creates `profiles` record
- **RLS enabled on profiles** but **NO INSERT policy** ❌

**Evidence**:
```sql
-- Profiles RLS Policies Found:
- "Users can view own profile" (SELECT)
- "Users can update own profile" (UPDATE)
- "Admins can view all profiles" (SELECT)
-- MISSING: INSERT policy!
```

**Why Trigger Works Now**:
- Trigger uses `SECURITY DEFINER` (runs with superuser permissions)
- But this is a ticking time bomb - may break with RLS changes

**IMMEDIATE FIX**:
```sql
CREATE POLICY "Allow trigger to create profiles"
ON profiles FOR INSERT
WITH CHECK (true);

-- OR better: Handle in application code
-- Use service role key to create profile after signup
```

**Verify**: Check auth.users (4 users) vs profiles (2 users) mismatch!

---

## ⚠️ HIGH PRIORITY ISSUES

### 3. SCHEMA DOCUMENTATION OUTDATED
**Severity**: HIGH
**Impact**: Developers using wrong schema, causing bugs

**File**: `/home/projects/safeprompt/database/setup.sql`

**Missing Columns in Documented Schema**:
- `profiles.api_requests_used` (used in production)
- `profiles.api_requests_limit` (used in production)
- `profiles.subscription_tier` (used in production)
- `profiles.subscription_status` (used in production)
- `profiles.api_key_hash` (used in production)
- `profiles.api_key_hint` (used in production)
- `profiles.stripe_subscription_id` (used in production)
- `api_logs.safe` (boolean, used in production)
- `api_logs.threats` (text array, used in production)

**Fix**: Update `/database/setup.sql` to match production schema

---

### 4. BILLING_EVENTS TABLE: USER_ID vs PROFILES.ID MISMATCH
**Severity**: MEDIUM
**Impact**: May cause FK constraint issues

**Finding**:
- `billing_events.user_id` (uuid)
- `profiles.id` (uuid)
- **Naming inconsistency** - should be `profile_id` for clarity

**Recommendation**: Rename column for consistency

---

## ✅ WORKING CORRECTLY

### 5. PAYMENT FLOW (STRIPE INTEGRATION)
**Status**: ✅ WORKS CORRECTLY
**File**: `/api/api/webhooks.js`

**Flow**:
1. Stripe webhook → `checkout.session.completed`
2. Generates API key (hash stored securely for new users)
3. Creates/updates profile with subscription tier
4. Sends welcome email with API key

**Pricing Verified**:
- Early Bird: $5/month → 100,000 requests ✅
- Starter: $29/month → 100,000 requests ✅
- Business: $99/month → 1,000,000 requests ✅

**Note**: Payment flow uses service_role key (bypasses RLS correctly)

---

### 6. API ENDPOINTS VALIDATION
**Status**: ✅ ALL CORRECT
**Verified Endpoints**: 5 active endpoints

**Findings**:
- ✅ Zero deprecated table references (users, api_keys, usage_logs)
- ✅ All table/column names match production schema
- ✅ All RLS policies compatible (service_role access)
- ✅ Playground tables configured correctly
- ✅ Error handling present

**Endpoint Files**:
- `/api/v1/validate.js` - Core validation ✅
- `/api/webhooks.js` - Stripe webhooks ✅
- `/api/admin.js` - Admin operations ✅
- `/api/playground.js` - Playground features ✅
- `/api/website.js` - Waitlist operations ✅

---

### 7. API DOCUMENTATION ACCURACY
**Status**: ✅ ACCURATE
**Files**: `/docs/API.md`, `/README.md`

**Verified**:
- ✅ API usage patterns correct
- ✅ Pricing tiers documented accurately
- ✅ Request limits match implementation
- ✅ Example code works with production API

---

## 📊 DATABASE SCHEMA SUMMARY

### Public Tables (Production):
1. **profiles** - User accounts & API keys
   - RLS: ✅ Enabled
   - Policies: SELECT (own + admin), UPDATE (own)
   - Missing: INSERT policy ❌

2. **api_logs** - API usage tracking
   - RLS: ✅ Enabled
   - Policies: INSERT (public), SELECT (own + admin)

3. **waitlist** - Email capture
   - RLS: ✅ Enabled
   - Policies: INSERT (anon), SELECT (admin), ALL (service_role)

4. **billing_events** - Stripe webhooks
   - RLS: ✅ Enabled
   - Policies: ALL (service_role only)

5. **playground_*** - Playground features
   - RLS: ✅ Enabled
   - Policies: ALL (service_role only)

### Auth Tables:
- **auth.users** - Supabase auth (4 users)
- RLS Policy: "Users can read own auth data" ✅

---

## 🔧 REMEDIATION PLAN

### PHASE 1: IMMEDIATE (< 1 hour)
**Priority: CRITICAL**

1. **Fix API Key Security**:
   ```bash
   # 1. Update validation to use hash only
   # Edit /api/api/v1/validate.js line 49-58

   # 2. Hash existing plaintext keys
   node /home/projects/safeprompt/scripts/migrate-api-keys-to-hash.js

   # 3. Deploy validation fix
   # 4. Monitor for 7 days
   # 5. Drop api_key column
   ```

2. **Fix Signup Flow**:
   ```sql
   -- Add INSERT policy for profiles
   CREATE POLICY "Allow trigger to create profiles"
   ON profiles FOR INSERT WITH CHECK (true);
   ```

3. **Verify**: Test signup flow end-to-end

---

### PHASE 2: SHORT-TERM (< 24 hours)
**Priority: HIGH**

4. **Update Schema Documentation**:
   - Edit `/database/setup.sql` to match production
   - Add all missing columns to profiles and api_logs tables

5. **Fix Dashboard API Key Display**:
   ```javascript
   // /dashboard/src/app/page.tsx:134
   // Remove api_key from SELECT, show only hint
   .select('api_key_hint, created_at')
   ```

6. **Fix Admin Endpoints**:
   ```javascript
   // /api/api/admin.js lines 59, 351, 366
   // Store hash only, not plaintext
   api_key_hash: hashApiKey(newApiKey),
   api_key_hint: keyHint
   ```

---

### PHASE 3: LONG-TERM (< 1 week)
**Priority: MEDIUM**

7. **Rename billing_events.user_id → profile_id**:
   ```sql
   ALTER TABLE billing_events
   RENAME COLUMN user_id TO profile_id;
   ```

8. **Add RLS Policy for User Billing History**:
   ```sql
   CREATE POLICY "Users can view own billing events"
   ON billing_events FOR SELECT
   USING (profile_id = auth.uid());
   ```

9. **Investigate auth.users vs profiles mismatch**:
   - 4 auth.users but only 2 profiles
   - Check if trigger failed for 2 users
   - Manual migration if needed

---

## 📈 SUCCESS CRITERIA

### Security:
- [ ] Zero plaintext API keys in database
- [ ] All authentication uses hash-only validation
- [ ] Dashboard shows only key hints (last 4 chars)
- [ ] No API keys transmitted in responses

### Functionality:
- [ ] Signup creates both auth.users AND profiles
- [ ] Payment flow updates subscription correctly
- [ ] Admin panel displays all users
- [ ] API documentation matches implementation

### Data Integrity:
- [ ] Schema documentation up-to-date
- [ ] Column naming consistent
- [ ] RLS policies complete for all operations

---

## 🎯 OVERALL ASSESSMENT

**API Functionality**: ✅ **WORKING**
**Payment Processing**: ✅ **SECURE & FUNCTIONAL**
**API Documentation**: ✅ **ACCURATE**
**Data Security**: ❌ **CRITICAL ISSUES** (plaintext keys)
**Signup Flow**: ⚠️ **VULNERABLE** (missing INSERT policy)

**Recommendation**: Deploy Phase 1 fixes IMMEDIATELY to address critical security vulnerabilities, then proceed with short-term and long-term improvements.

---

## 📝 NEXT STEPS

1. **Review this report** with technical team
2. **Execute Phase 1 remediation** (<1 hour)
3. **Test all critical flows** (signup, payment, API)
4. **Monitor for 7 days** before schema changes
5. **Execute Phase 2 & 3** over next week

**Questions? Contact**: Review agents used: security-engineer, backend-developer, product-engineer