# SafePrompt - Incident History

**Purpose**: Complete historical record of production incidents with full narratives, code examples, and resolution details.

**Note**: For quick lookup, see `/home/projects/safeprompt/docs/PATTERNS.md`

---

## Incident #1: RLS Infinite Recursion (Error 42P17)

**Date Discovered**: Sept 30, 2025
**Impact**: CRITICAL - New user signup completely broken
**Status**: Resolved

**WHY It Happens:**
RLS policies that query the same table they protect cause infinite recursion:
```sql
-- ❌ BROKEN: Queries profiles while checking RLS on profiles
CREATE POLICY ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);
```

**HOW To Fix:**
Use `SECURITY DEFINER` function to bypass RLS during permission check:
```sql
-- Step 1: Create bypass function
CREATE FUNCTION is_internal_user() RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND tier = 'internal'
  );
$$;

-- Step 2: Use in policy (no recursion)
CREATE POLICY ON profiles FOR SELECT
USING (auth.uid() = id OR is_internal_user());
```

**Recognition Pattern:**
- 500 errors from API
- "infinite recursion detected in policy" in logs
- Check for self-referential queries in RLS policies

---

## Incident #2: Database .env Precedence Issue

**Date Discovered**: Oct 3, 2025
**Impact**: CRITICAL - First paying customer couldn't access dashboard
**Status**: Resolved

**WHY It Happens:**
Next.js/Vite load `.env.local` before `.env.production`, causing dashboard to connect to wrong database:
```
.env.local (DEV database)  ← Loads first
.env.production (PROD database)  ← Ignored
```

**HOW To Fix:**
```bash
# Remove .env.local to force .env.production
rm /home/projects/safeprompt/dashboard/.env.local

# Rebuild to pick up correct database
cd /home/projects/safeprompt/dashboard && npm run build

# Verify via environment check
grep VITE_SUPABASE_URL .env.production  # Should show PROD database URL
```

**Recognition Pattern:**
- Users can't log in
- "user not found" errors
- Check which database dashboard is using

---

## Incident #3: Next.js JSX Complexity Threshold

**Date Discovered**: Sept 2025
**Impact**: MEDIUM - Build failures on complex dashboard components
**Status**: Resolved

**WHY It Happens:**
Vite's JSX transform has a complexity limit (~2000 AST nodes). Large components with many conditional renders hit this limit:
```jsx
// ❌ BROKEN: Too many nested ternaries and conditionals
export default function Dashboard() {
  return (
    <div>
      {user ? (
        profile ? (
          stats ? (
            <div>
              {tier === 'free' ? <FreePlan /> :
               tier === 'starter' ? <StarterPlan /> :
               tier === 'growth' ? <GrowthPlan /> : <BusinessPlan />}
            </div>
          ) : <Loading />
        ) : <ProfileError />
      ) : <LoginPrompt />}
    </div>
  );
}
```

**HOW To Fix:**
Break into smaller components or use early returns:
```jsx
// ✅ FIXED: Simpler component structure
export default function Dashboard() {
  if (!user) return <LoginPrompt />;
  if (!profile) return <ProfileError />;
  if (!stats) return <Loading />;

  return (
    <div>
      <PlanDisplay tier={tier} />
    </div>
  );
}
```

**Recognition Pattern:**
- Build error "Maximum call stack size exceeded" during JSX transform
- Component too complex

---

## Incident #4: Supabase Trigger Function Permissions

**Date Discovered**: Sept 30, 2025
**Impact**: CRITICAL - User signup flow broken
**Status**: Resolved

**WHY It Happens:**
Trigger functions run with `DEFINER` security context but need explicit table permissions:
```sql
-- ❌ BROKEN: Function exists but can't access tables
CREATE FUNCTION handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;
-- Error: "permission denied for table profiles"
```

**HOW To Fix:**
Grant explicit permissions to trigger function owner (postgres):
```sql
-- Step 1: Create function
CREATE FUNCTION handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, tier, api_key)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    'sp_' || encode(gen_random_bytes(32), 'hex')
  );
  RETURN NEW;
END;
$$;

-- Step 2: Grant permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT INSERT, UPDATE ON TABLE profiles TO postgres;

-- Step 3: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Recognition Pattern:**
- Trigger exists but doesn't fire
- "permission denied for table" errors
- Missing GRANT statements

---

## Incident #5: Email Template Persistence After Supabase Reset

**Date Discovered**: Sept 2025
**Impact**: LOW - Confusion during database resets
**Status**: Documented

**WHY It Happens:**
Supabase stores email templates in `auth.config` table, which persists across `supabase db reset`:
```bash
supabase db reset  # Drops all tables, resets migrations
# But email templates remain in auth.config (separate system table)
```

**HOW To Fix:**
Manually delete email templates before reset:
```bash
# Method 1: Dashboard
# Go to Authentication → Email Templates → Delete custom templates

# Method 2: SQL (if dashboard fails)
DELETE FROM auth.config WHERE parameter IN (
  'SMTP_ADMIN_EMAIL',
  'MAILER_SUBJECTS_CONFIRMATION',
  'MAILER_TEMPLATES_CONFIRMATION'
);

# Then reset database
supabase db reset
```

**Recognition Pattern:**
- Email templates unchanged after db reset
- Stored in auth.config, not migrations

---

## Incident #6: Stripe Webhook Signature Verification

**Date Discovered**: Sept 2025
**Impact**: CRITICAL - Payment processing broken
**Status**: Resolved

**WHY It Happens:**
Vercel Functions modify request body before webhook handler receives it, breaking signature verification:
```javascript
// ❌ BROKEN: Body already parsed by Vercel
const signature = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.body,  // Already JSON object, not raw buffer
  signature,
  webhookSecret
);
// Error: "No signatures found matching the expected signature"
```

**HOW To Fix:**
Configure Vercel to send raw body for webhook endpoint:
```javascript
// vercel.json
{
  "functions": {
    "api/stripe-webhook.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}

// stripe-webhook.js
export const config = {
  api: {
    bodyParser: false,  // Disable body parsing
  },
};

export default async function handler(req, res) {
  const buf = await buffer(req);  // Get raw buffer
  const signature = req.headers['stripe-signature'];

  const event = stripe.webhooks.constructEvent(
    buf,  // Raw buffer for signature verification
    signature,
    webhookSecret
  );
  // ✅ Signature verification succeeds
}
```

**Recognition Pattern:**
- Stripe webhook error "No signatures found"
- Body already parsed, not raw

---

## Incident #7: Cloudflare Pages Cache Invalidation

**Date Discovered**: Sept 27, 2025
**Impact**: LOW - User confusion with old content
**Status**: Expected behavior

**WHY It Happens:**
Cloudflare Pages caches HTML/JS/CSS aggressively. After deployment, users see old version:
```bash
wrangler pages deploy dist --project-name safeprompt  # Deploy succeeds
# But users still see old version for 5-10 minutes
```

**HOW To Fix:**
Cache invalidation happens automatically but takes time. For immediate update:
```bash
# Option 1: Hard refresh in browser
Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# Option 2: Verify deployment URL
wrangler pages deploy dist --project-name safeprompt
# Output shows: https://abc123.safeprompt.pages.dev
# Open this URL directly to see latest version

# Option 3: Wait for cache TTL (typically 5-10 minutes)
```

**Recognition Pattern:**
- Deployment succeeds
- Old version still visible
- Cache not invalidated yet

---

## Incident #8: OpenRouter Model Name Changes

**Date Discovered**: Sept 2025
**Impact**: MEDIUM - API validation failures
**Status**: Ongoing (use Context7)

**WHY It Happens:**
AI providers deprecate models without warning. Code references old model names:
```javascript
// ❌ BROKEN: Model deprecated
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  body: JSON.stringify({
    model: 'meta-llama/llama-3.1-8b-instruct:free',  // No longer exists
    messages: [...]
  })
});
// Error: "Model not found"
```

**HOW To Fix:**
Use Context7 to find current model names:
```bash
# Find latest model names
# Ask: "use context7 to show OpenRouter available models for Gemini"

# Update code with current names
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  body: JSON.stringify({
    model: 'meta-llama/llama-3.1-8b-instruct',  // Updated name
    messages: [...]
  })
});
```

**Recognition Pattern:**
- "Model not found" error
- Check OpenRouter docs for current model names

---

## Incident #9: Supabase RLS Policy Evaluation Order

**Date Discovered**: Sept 2025
**Impact**: LOW - Performance degradation
**Status**: Optimized

**WHY It Happens:**
Multiple RLS policies use OR logic. Order matters for performance:
```sql
-- ❌ SLOW: Checks complex condition first
CREATE POLICY users_select ON users FOR SELECT USING (
  is_internal_user() OR auth.uid() = id
);
-- Runs SECURITY DEFINER function for every row, even when auth.uid() matches

-- ✅ FAST: Checks simple condition first
CREATE POLICY users_select ON users FOR SELECT USING (
  auth.uid() = id OR is_internal_user()
);
-- Returns immediately when auth.uid() matches, avoids function call
```

**HOW To Fix:**
Put cheapest check first (auth.uid() comparison), expensive checks last (SECURITY DEFINER functions)

**Recognition Pattern:**
- Slow queries on simple SELECT
- Check RLS policy order

---

## Incident #10: API Key Rotation Impact on Active Sessions

**Date Discovered**: Sept 2025
**Impact**: MEDIUM - User experience issue
**Status**: Documented (future enhancement)

**WHY It Happens:**
When user rotates API key, old key immediately invalid. Client apps still using old key start failing:
```javascript
// Client app configured with old key
const response = await fetch('https://api.rebootmedia.net/api/safeprompt', {
  headers: { 'X-API-Key': 'sp_old_key_...' }  // Rotated key
});
// Error: "Invalid API key"
```

**HOW To Fix:**
Implement grace period for old keys (future feature) or warn users:
```javascript
// Current behavior (immediate invalidation)
// When user clicks "Rotate API Key":
// 1. Generate new key
// 2. Update database
// 3. Return new key to user
// Old key no longer works

// Future improvement: Grace period
// 1. Generate new key
// 2. Mark old key as "pending_deletion" with 24hr TTL
// 3. Both keys work for 24 hours
// 4. Old key deleted after grace period
```

**Recognition Pattern:**
- "Invalid API key" errors spike after user rotates
- No grace period implemented

---

## Incident #11: Single API Architecture (Dev/Prod Database Contamination)

**Date Discovered**: Oct 3, 2025
**Impact**: CRITICAL - Dev testing contaminated prod database for 12 hours
**Status**: Resolved

**WHY It Happens:**
Attempting dev/prod split by only separating databases without separate API infrastructure causes all dev traffic to hit prod database:
```
❌ BROKEN ARCHITECTURE:
DEV:  dev.safeprompt.dev → api.safeprompt.dev → PROD DB (adyfhzbcsqzgqvyimycv)
                           ↑ WRONG! Should go to DEV API
PROD: safeprompt.dev → api.safeprompt.dev → PROD DB (adyfhzbcsqzgqvyimycv)
```

**HOW To Fix:**
Create complete dual API architecture with separate Vercel projects (detailed steps in original CLAUDE.md backup)

**✅ CORRECT ARCHITECTURE:**
```
DEV:  dev.safeprompt.dev → dev-api.safeprompt.dev → DEV DB (vkyggknknyfallmnrmfu)
PROD: safeprompt.dev → api.safeprompt.dev → PROD DB (adyfhzbcsqzgqvyimycv)
```

**Recognition Pattern:**
- 0% test success rate after "dev/prod split"
- Dev signup creates users in prod database
- Dashboard shows prod users in dev environment
- All dev traffic in prod database logs

---

## Incident #12: Authentication Bypass Vulnerabilities (Multiple Backdoors)

**Date Discovered**: Oct 3, 2025
**Impact**: CRITICAL - Allows anyone to use paid service for free
**Status**: Resolved

**WHY It Happens:**
Optional API key validation with hardcoded bypass keys creates multiple attack vectors:
```javascript
// ❌ BROKEN: Multiple ways to bypass authentication
if (apiKey && apiKey !== 'demo_key') {
  // Validate against database
}
// Problem 1: No key at all → bypasses validation
// Problem 2: apiKey === 'demo_key' → bypasses validation
// Problem 3: Both allow unlimited free API usage
```

**HOW To Fix:**
Always require and validate API keys, no exceptions (detailed implementation in original CLAUDE.md backup)

**Recognition Pattern:**
- "API works without authentication"
- "Special demo/test keys in code"
- "Internal users bypass validation"

---

## Incident #13: Cloudflare Pages Production vs Preview Deployments

**Date Discovered**: Oct 3, 2025
**Impact**: HIGH - Users see stale code
**Status**: Resolved

**WHY It Happens:**
Cloudflare Pages has separate Production and Preview environments. Custom domains point to Production, but wrangler defaults to deploying as Preview when not on main branch.

**HOW To Fix:**
Always specify `--branch main` to deploy to Production environment:
```bash
# ✅ CORRECT: Deploy to Production environment
wrangler pages deploy out --project-name myproject --branch main
```

**Recognition Pattern:**
- "Deployed but custom domain shows old version"
- "*.pages.dev URL works but custom domain doesn't"
- "Different bundle hashes between local and deployed"

---

## Incident #14: Next.js Environment Variable Build-Time Substitution

**Date Discovered**: Oct 3, 2025
**Impact**: CRITICAL - Dev/prod environment contamination
**Status**: Resolved

**WHY It Happens:**
Next.js replaces `process.env.NEXT_PUBLIC_*` at build time, creating static bundles with hardcoded values.

**HOW To Fix:**
Use .env.local to override build-time variables for different environments (detailed steps in original CLAUDE.md backup)

**Recognition Pattern:**
- "Deployed to dev but calling prod API"
- "Environment variables not updating"
- "Need to redeploy after changing .env"

---

## Incident #15: CORS Wildcard Security Vulnerability

**Date Discovered**: Oct 3, 2025
**Impact**: CRITICAL - Enables credential harvesting
**Status**: Resolved

**WHY It Happens:**
Using wildcard CORS (`Access-Control-Allow-Origin: *`) allows any website to call your API with user credentials.

**HOW To Fix:**
Implement origin whitelist with specific allowed domains (detailed implementation in original CLAUDE.md backup)

**Recognition Pattern:**
- Security audit finds `*` in CORS headers
- API key theft vulnerability

---

## Incident #16: Cache Isolation Missing (Data Leakage)

**Date Discovered**: Oct 3, 2025
**Impact**: CRITICAL - Privacy violation, revenue leak
**Status**: Resolved

**WHY It Happens:**
In-memory cache keyed only by prompt content, not by user identity.

**HOW To Fix:**
Include user identifier in cache key:
```javascript
// ✅ FIXED: Cache isolated per user
function getCacheKey(prompt, mode, profileId) {
  return crypto.createHash('md5').update(`${profileId}:${prompt}:${mode}`).digest('hex');
}
```

**Recognition Pattern:**
- Cache implementation doesn't include user/profile ID
- Data leakage risk

---

## Incident #17: Load Testing & Performance Validation

**Date Validated**: Oct 4, 2025
**Impact**: MEDIUM - Claims updated to reflect realistic performance
**Status**: ✅ VALIDATED

**Comprehensive Load Test Results**:
- Success Rate: 100% (0 errors)
- Peak Load: 50 req/sec sustained
- Pattern Detection: <100ms (67% of requests)
- AI Validation: 2-3s (33% of requests)

**Recognition Pattern:**
- Performance claims must specify detection method to be accurate

---

## Incident #18: Safe Prompt Patterns Are Dangerous

**Date Discovered**: Oct 4, 2025
**Impact**: CRITICAL - Would create bypass vulnerability
**Status**: ❌ NEVER IMPLEMENT

**WHY Safe Patterns Are Dangerous:**
Attempting to identify "obviously safe" prompts creates bypass vulnerability. Attackers craft multi-part prompts with safe starts + malicious payloads.

**Recognition Pattern:**
- Any proposal to add "whitelist patterns" or "obviously safe" detection

---

## Incident #19: Regex State Pollution (CRITICAL SECURITY BUG)

**Date Discovered**: Oct 5, 2025
**Impact**: CRITICAL - Security vulnerability allowed role manipulation attacks to bypass detection
**Status**: Resolved

**WHY It Happens:**
Global regex patterns (`/gi`) maintain `lastIndex` state between `.test()` calls:
```javascript
// ❌ BROKEN: /g flag causes state pollution
const pattern = /admin/gi;
pattern.test("role: system\n");  // true, lastIndex = 12
pattern.test("role: admin\n");   // false! (starts searching from position 12)
```

**HOW To Fix:**
Removed `/g` flag from ALL 43+ validation patterns in `prompt-validator.js`

**Recognition Pattern:**
- Inconsistent detection results
- "admin" role injection bypassed but "system" detected
- For boolean checks (`.test()`), `/g` flag creates unnecessary state

---

## Historical Context (For Reference)

**Migration History:**
- Sept 26, 2025: AI Validator v2.0 - Migrated to Gemini 2.0/2.5 Flash
- Sept 25, 2025: Cloudflare Pages Migration - Migrated from Netlify

**Resolved But Not Forgotten:**
- Oct 3, 2025: Database Connection Issue - First paying customer blocked
- Sept 30, 2025: Multiple trigger/RLS issues resolved
- Sept 27, 2025: Blog caching issue - cache invalidation documented

---

**End of Incident History**
