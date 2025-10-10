# Comprehensive Troubleshooting Report: Playground Issues
**Date**: 2025-10-10
**Issue**: Multiple failures of playground on both DEV and PROD

---

## 🔍 EXECUTIVE SUMMARY

After deep investigation, I've identified **THREE SEPARATE ROOT CAUSES** that are all contributing to the playground failures:

1. **CRITICAL**: Wrong NODE_ENV for DEV builds (causes CORS failure)
2. **CRITICAL**: Missing X-User-IP header (causes 400 error)
3. **WARNING**: React hydration errors (causes console errors but may not block functionality)

---

## 📊 ISSUE 1: WRONG BUILD ENVIRONMENT FOR DEV

### Problem
DEV playground (`dev.safeprompt.dev`) is calling PROD API (`api.safeprompt.dev`) instead of DEV API (`dev-api.safeprompt.dev`)

### Root Cause
**Deployment command uses wrong NODE_ENV**:
```bash
# CURRENT (WRONG):
cd website && NODE_ENV=production npm run build && wrangler pages deploy out --project-name safeprompt-dev

# SHOULD BE:
cd website && NODE_ENV=development npm run build && wrangler pages deploy out --project-name safeprompt-dev
```

### Why This Happens
1. Next.js static export bakes environment variables at BUILD time
2. `NODE_ENV=production` loads `.env.production` which has:
   - `NEXT_PUBLIC_API_URL=https://api.safeprompt.dev` (PROD API)
3. This hardcoded PROD API URL is deployed to DEV site
4. DEV site (`dev.safeprompt.dev`) calls PROD API (`api.safeprompt.dev`)
5. PROD API's CORS only allows:
   - `safeprompt.dev`
   - `www.safeprompt.dev`
   - `dashboard.safeprompt.dev`
   - **NOT** `dev.safeprompt.dev`
6. CORS failure: "Access-Control-Allow-Origin missing"

### Evidence
**Environment Files (CORRECT)**:
- `.env.development`: `NEXT_PUBLIC_API_URL=https://dev-api.safeprompt.dev` ✓
- `.env.production`: `NEXT_PUBLIC_API_URL=https://api.safeprompt.dev` ✓

**Deployment Commands (WRONG)**:
```bash
# From CLAUDE.md line 111:
cd /home/projects/safeprompt/website && NODE_ENV=production npm run build && wrangler pages deploy out --project-name safeprompt-dev
                                        ^^^^^^^^^^^^^^^^ WRONG! Should be NODE_ENV=development
```

### Impact
- **DEV playground**: CORS failure (calls wrong API)
- **PROD playground**: Works correctly (calls correct API)

---

## 📊 ISSUE 2: MISSING X-USER-IP HEADER

### Problem
API requires `X-User-IP` header but it was removed in a previous CORS fix attempt

### Root Cause
From `/api/v1/validate.js` lines 73-80:
```javascript
// 🔒 CRITICAL: User IP is REQUIRED for threat intelligence
if (!userIP || userIP.trim() === '') {
  return res.status(400).json({
    error: 'X-User-IP header required',
    message: 'Please provide the end user\'s IP address via X-User-IP header for threat intelligence tracking'
  });
}
```

The API **REQUIRES** this header for:
- IP reputation tracking
- Threat intelligence collection
- Multi-turn attack detection

### Current Status
✅ **FIXED** in commit 501a49ff:
- Added `X-User-IP: 203.0.113.10` (TEST-NET-3 RFC 5737)
- This is a reserved test IP that won't cause real user bans

### Remaining Risk
The test IP `203.0.113.10` might get banned if playground users trigger many attacks.

**Mitigation Options**:
1. Add test IP to `ip_allowlist` table (prevents banning)
2. Monitor IP reputation for this IP
3. Use rotating test IPs from TEST-NET ranges

---

## 📊 ISSUE 3: REACT HYDRATION ERRORS

### Problem
Console shows React errors #418 and #423 on page load

### Root Cause
**React Error #418**: "Hydration failed because the initial UI does not match what was rendered on the server"
**React Error #423**: "There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering"

### Likely Causes
1. **Environment variables in JSX**: Using `process.env.NEXT_PUBLIC_*` in components
2. **Conditional rendering**: Server vs client rendering differences
3. **Date/time values**: Server time !== client time
4. **Random values**: Math.random() in components
5. **Third-party scripts**: Loading different content on server vs client

### Investigation Needed
Need to examine playground component (`website/app/playground/page.tsx`) for:
- Any conditional rendering based on environment
- Any dynamic values that differ between SSR and CSR
- Any third-party scripts or iframes

### Impact
- **User-facing**: Console errors (may scare technical users)
- **Functionality**: May cause React to re-render everything client-side (performance hit)
- **SEO**: Possible impact if search engines see different content

---

## 📊 ISSUE 4: CORS CONFIGURATION (SECONDARY)

### Current API CORS Setup
From `/api/v1/validate.js` lines 29-52:

```javascript
const isProd = process.env.NODE_ENV === 'production' ||
               process.env.VERCEL_ENV === 'production';

const allowedOrigins = isProd
  ? [
      'https://safeprompt.dev',
      'https://www.safeprompt.dev',
      'https://dashboard.safeprompt.dev'
    ]
  : [
      'https://dev.safeprompt.dev',
      'https://dev-dashboard.safeprompt.dev',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
```

### Analysis
✅ **CORS configuration is CORRECT** - it properly separates PROD and DEV origins

### The Problem
**There are TWO separate Vercel API deployments**:
- `safeprompt-api` (PROD) - has `VERCEL_ENV=production`
- `safeprompt-api-dev` (DEV) - should have `VERCEL_ENV=development` or not production

If both APIs have `VERCEL_ENV=production`, they both use PROD CORS origins!

### Verification Needed
Check Vercel environment variables:
```bash
vercel env ls --token=$VERCEL_TOKEN --project=safeprompt-api
vercel env ls --token=$VERCEL_TOKEN --project=safeprompt-api-dev
```

---

## 🎯 COMPREHENSIVE FIX PLAN

### Phase 1: Fix Build Process (CRITICAL - Fixes 80% of issues)

**Action 1.1**: Update CLAUDE.md deployment commands
```bash
# DEV deployments should use NODE_ENV=development
cd /home/projects/safeprompt/website && NODE_ENV=development npm run build && wrangler pages deploy out --project-name safeprompt-dev --branch main
cd /home/projects/safeprompt/dashboard && NODE_ENV=development npm run build && wrangler pages deploy out --project-name safeprompt-dashboard-dev --branch main
```

**Action 1.2**: Rebuild and redeploy DEV with correct environment
```bash
cd /home/projects/safeprompt/website
NODE_ENV=development npm run build
wrangler pages deploy out --project-name safeprompt-dev --branch main
```

**Expected Outcome**:
- DEV playground will call `dev-api.safeprompt.dev`
- DEV API allows `dev.safeprompt.dev` origin
- CORS will pass ✓

---

### Phase 2: Verify API Environment (CRITICAL - Ensures Phase 1 works)

**Action 2.1**: Check DEV API environment
```bash
vercel env ls --token=$VERCEL_TOKEN --project=safeprompt-api-dev
```

**Expected**:
- Should NOT have `VERCEL_ENV=production`
- Should have `NODE_ENV=development` OR default to non-production

**Action 2.2**: If DEV API has wrong environment, fix it
```bash
vercel env rm VERCEL_ENV --token=$VERCEL_TOKEN --project=safeprompt-api-dev
# OR
vercel env add VERCEL_ENV development --token=$VERCEL_TOKEN --project=safeprompt-api-dev
```

---

### Phase 3: Add Test IP to Allowlist (OPTIONAL - Prevents future banning)

**Action 3.1**: Fix the allowlist script
The script `scripts/add-playground-ip-allowlist.js` needs fixing:
- Issue: `added_by` field vs `created_by` field confusion
- Issue: `purpose` constraint checking

**Action 3.2**: Add test IP to allowlist
```sql
-- Direct SQL approach (simpler)
INSERT INTO ip_allowlist (ip_address, ip_hash, description, purpose, active, created_by)
VALUES (
  '203.0.113.10',
  '631f08140b24b7274d12df3c37a1a80ce5876dafd7007d772e0114fddf88b682',
  'Playground demo IP (TEST-NET-3 RFC 5737) - used by all playground visitors',
  'testing',
  true,
  (SELECT id FROM profiles WHERE email = 'ian.ho@rebootmedia.net')
);
```

---

### Phase 4: Fix React Hydration (NICE-TO-HAVE - Cosmetic fix)

**Action 4.1**: Identify hydration mismatches
```bash
# Run dev build locally to see detailed error messages
cd /home/projects/safeprompt/website
npm run dev
# Visit http://localhost:3000/playground
# Check console for detailed error messages (non-minified)
```

**Action 4.2**: Common fixes
- Wrap environment-dependent code in `useEffect`
- Use `suppressHydrationWarning` for timestamps/random values
- Ensure third-party scripts load the same way on server/client

---

## 📋 VERIFICATION CHECKLIST

### After Phase 1 & 2 (Build + API fixes):
- [ ] DEV playground loads without errors
- [ ] DEV playground can submit XSS test
- [ ] DEV playground shows CORS success (no "missing origin" error)
- [ ] PROD playground still works
- [ ] PROD playground can submit XSS test

### After Phase 3 (Allowlist):
- [ ] Test IP `203.0.113.10` appears in `ip_allowlist` table
- [ ] Multiple playground requests don't trigger IP reputation blocking

### After Phase 4 (React):
- [ ] No React error #418 in console
- [ ] No React error #423 in console
- [ ] Page loads cleanly on both DEV and PROD

---

## 🚨 PRIORITY ORDER

1. **HIGHEST**: Fix build process (Phase 1) - **Fixes 80% of issues**
2. **HIGH**: Verify API environment (Phase 2) - **Ensures Phase 1 works**
3. **MEDIUM**: Add test IP to allowlist (Phase 3) - **Prevents future issues**
4. **LOW**: Fix React hydration (Phase 4) - **Cosmetic improvement**

---

## 📝 LESSONS LEARNED

1. **Environment variable discipline**: DEV builds MUST use `NODE_ENV=development`
2. **Static export reality**: Next.js bakes env vars at build time, not runtime
3. **CORS debugging**: Always check WHICH origin is calling WHICH API
4. **API requirements**: Read API validation code before removing "unnecessary" headers
5. **Comprehensive testing**: Test BOTH DEV and PROD after changes

---

## 🎯 NEXT STEPS

1. User approval of fix plan
2. Execute Phase 1 (fix build process)
3. Execute Phase 2 (verify API environment)
4. Test on both DEV and PROD
5. If successful, execute Phase 3 (allowlist)
6. Monitor for React hydration issues (Phase 4)

---

**Report generated**: 2025-10-10
**Status**: Awaiting user approval to proceed with fixes
