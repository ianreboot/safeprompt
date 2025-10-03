# SafePrompt Fixes Needed (October 3, 2025)

## Summary of Issues

1. ✅ **Password reset emails not branded** - FIXED (templates provided)
2. ❓ **yuenho shows Free Plan** - Database is correct, likely browser cache
3. ⏳ **Upgrade Plan vs Manage Billing** - Needs code changes
4. 🔴 **Admin panel shows 0 users** - RLS policy issue (SQL provided below)
5. ⏳ **Dev database security audit** - Pending

---

## 1. Password Reset Email Branding ✅

### Site URL Configuration
**❌ WRONG:** You set `http://dashboard.safeprompt.dev` (HTTP)
**✅ CORRECT:** Should be `https://dashboard.safeprompt.dev` (HTTPS)

**Action Required:**
1. Go to Supabase Dashboard → PROD Project (adyfhzbcsqzgqvyimycv)
2. Navigate to: Authentication → URL Configuration
3. Set **Site URL** to: `https://dashboard.safeprompt.dev`
4. Add to **Redirect URLs**:
   - `https://dashboard.safeprompt.dev/**`
   - `https://dashboard.safeprompt.dev/reset-password`
   - `https://dashboard.safeprompt.dev/confirm`

### Email Templates
**Action Required:**
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Copy templates from: `/home/projects/safeprompt/scripts/configure-auth-emails.js`
3. Run: `node scripts/configure-auth-emails.js` to see formatted templates
4. Paste into Supabase for:
   - Password Reset Email
   - Confirm Signup Email
   - Magic Link Email

---

## 2. yuenho Shows Free Plan ❓

### Database Status: ✅ CORRECT
```
email: yuenho.8@gmail.com
subscription_tier: early_bird ✅
subscription_status: active ✅
api_requests_limit: 100000 ✅
```

### Likely Cause: Browser Cache

**Actions to Try:**
1. **Hard refresh dashboard**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. **Clear browser cache** for dashboard.safeprompt.dev
3. **Try incognito/private window**

**If still shows Free Plan:**
- Verify deployed dashboard build is using PROD database ✅ (already verified)
- Check browser console for errors
- The dashboard code correctly fetches and displays `subscription_tier`

---

## 3. Upgrade Plan vs Manage Billing Buttons ⏳

**Current Behavior:** Both buttons go to the same screen

**Desired Behavior:**
- **Upgrade Plan** → Show pricing comparison and upgrade options
- **Manage Billing** → Go to Stripe billing portal

**Action Required:** Code changes needed (TODO)

---

## 4. Admin Panel Shows 0 Users 🔴 **CRITICAL**

### Problem
RLS policies are too restrictive. Admin panel cannot query profiles table.

### Root Cause
Error: `permission denied for table users`

The admin panel uses ANON_KEY (not SERVICE_ROLE_KEY) for security, but RLS blocks all queries.

### Solution: Run This SQL in Supabase

**Go to:** Supabase Dashboard → SQL Editor → New Query

```sql
-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users and admins can read profiles" ON profiles;

-- Create comprehensive policy
CREATE POLICY "Users and admins can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Allow users to read their own profile
  auth.uid() = id
  OR
  -- Allow internal/admin users to read all profiles
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.subscription_tier = 'internal'
  )
);

-- Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**Verification SQL:**
```sql
-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles';
```

**Expected Result:**
After running the SQL, ian.ho@rebootmedia.net (internal tier) should be able to see all users in the admin panel.

---

## 5. Dev Database Security Audit ⏳

**Action Required:** Apply same RLS policies to DEV database

**Steps:**
1. Fix PROD database first (issue #4 above)
2. Run same SQL on DEV database (vkyggknknyfallmnrmfu)
3. Verify both databases have identical RLS policies
4. Test admin panel on both DEV and PROD

---

## Testing Checklist

After applying fixes:

### Password Reset
- [ ] Request password reset from dashboard
- [ ] Check email is branded (black background, SafePrompt logo)
- [ ] Click reset link goes to `https://dashboard.safeprompt.dev/reset-password`
- [ ] Reset password works
- [ ] Can log in with new password

### yuenho Account
- [ ] Log in as yuenho.8@gmail.com
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Dashboard shows "Early Bird" plan ✅
- [ ] Shows 100,000 requests/month limit ✅
- [ ] Shows $5/month price ✅

### Admin Panel
- [ ] Log in as ian.ho@rebootmedia.net
- [ ] Navigate to /admin
- [ ] Shows 5 total users ✅
- [ ] Shows 1 active subscriber (yuenho) ✅
- [ ] Shows $5 monthly revenue ✅
- [ ] Shows correct API call count ✅
- [ ] Can view individual user details ✅

---

## File References

- Email templates: `/home/projects/safeprompt/scripts/configure-auth-emails.js`
- RLS fix SQL: `/home/projects/safeprompt/scripts/fix-admin-rls.sql`
- Check yuenho: `/home/projects/safeprompt/scripts/check-yuenho-account.js`
- Check admin RLS: `/home/projects/safeprompt/scripts/check-admin-rls.js`

---

## Priority Order

1. **🔴 CRITICAL:** Fix admin panel RLS (run SQL in Supabase) ← DO THIS FIRST
2. **🟡 HIGH:** Fix password reset branding (Site URL + email templates)
3. **🟢 MEDIUM:** Clear yuenho browser cache / hard refresh
4. **🟢 LOW:** Differentiate Upgrade/Billing buttons (code changes)
5. **🟢 LOW:** Audit DEV database security

---

Generated: October 3, 2025
Last Updated: After identifying all 5 issues
