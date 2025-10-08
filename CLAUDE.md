# SafePrompt - AI Assistant Instructions

**Last Updated**: 2025-10-08 (Custom Lists V2 Feature COMPLETE)
**Status**: Production Ready with Advanced Intelligence Architecture + Custom Lists
**Deployment**: Cloudflare Pages (website + dashboard), Vercel Functions (API)

**🎉 Recent Milestones**:
- **Custom Lists V2** (2025-10-08): Custom whitelist/blacklist feature deployed to production
- **Quarter 1 Security** (2025-10-07): All 135+ security hardening tasks completed

**🚨 Intelligence Architecture**:
- **Threat Intelligence**: 24-hour anonymization, GDPR/CCPA compliant data collection
- **IP Reputation**: Global network defense with Pro tier auto-blocking
- **Pattern Discovery**: ML-powered automated pattern detection from real attacks
- **Campaign Detection**: Temporal clustering and similarity analysis for coordinated attacks
- **Admin Dashboard**: Complete IP management, pattern proposals, campaign response tools

**✨ Custom Lists (NEW)**:
- **Custom Whitelist**: Business-specific phrases that provide high confidence signals (0.8)
- **Custom Blacklist**: Attack patterns that provide high attack confidence (0.9)
- **Default Lists**: Curated phrases for common business scenarios (replace old business keywords)
- **Tier Limits**: Free (defaults only), Starter (25/25), Business (100/100), Internal (200/200)
- **Dashboard UI**: Manage custom lists at `/custom-lists` with real-time validation

For complete architecture details, see:
- `/home/projects/safeprompt/docs/PHASE_1A_INTELLIGENCE_ARCHITECTURE.md` (Threat Intelligence & IP Reputation)
- `/home/projects/safeprompt/docs/PHASE_6_INTELLIGENCE_ARCHITECTURE.md` (Pattern Discovery & Campaign Detection)

---

## 🚨 MANDATORY PROTOCOL FOR ALL TASKS

**BEFORE starting ANY task, you MUST:**

### 1. Read Platform-Specific Reference Documentation
When working with specific technologies, **ALWAYS read the relevant reference doc first**:

- **Supabase** (database): `/home/projects/docs/reference-supabase-access.md`
- **Vercel** (API): `/home/projects/docs/reference-vercel-access.md`
- **Cloudflare** (frontend): `/home/projects/docs/reference-cloudflare-access.md`

**Why**: These docs contain proven patterns, correct authentication methods, and solutions to common issues. Following them prevents 50+ minute debugging sessions on already-solved problems.

### 2. Use Context7 for Current Documentation
When encountering unfamiliar APIs or outdated patterns:

```
Add "use context7" to your prompt for real-time documentation
Example: "use context7 to show OpenRouter available models for Gemini"
```

**Why**: AI training data becomes outdated. Context7 fetches current API documentation, preventing deprecated model names, changed syntax, and API hallucination.

### 3. Check Error Pattern Reference
If you hit an error, check **before debugging**:
- **Quick lookup**: `/home/projects/safeprompt/docs/PATTERNS.md`
- **Full details**: `/home/projects/safeprompt/docs/INCIDENTS.md`

**Why**: 19 production incidents documented with root causes and fixes. Match error → Get solution in seconds.

---

## QUICK REFERENCE

### Essential IDs & URLs
```bash
# Databases
PROD_DB_ID=adyfhzbcsqzgqvyimycv  # supabase.co/dashboard/project/adyfhzbcsqzgqvyimycv
DEV_DB_ID=vkyggknknyfallmnrmfu   # supabase.co/dashboard/project/vkyggknknyfallmnrmfu

# Repositories
PUBLIC_REPO=https://github.com/ianreboot/safeprompt           # NPM package ONLY
PRIVATE_REPO=https://github.com/ianreboot/safeprompt-internal # ALL development

# Domains (Production)
WEBSITE=https://safeprompt.dev
DASHBOARD=https://dashboard.safeprompt.dev
API=https://api.safeprompt.dev

# Domains (Development)
DEV_WEBSITE=https://dev.safeprompt.dev
DEV_DASHBOARD=https://dev-dashboard.safeprompt.dev
DEV_API=https://dev-api.safeprompt.dev

# Key Paths
PROJECT=/home/projects/safeprompt
DASHBOARD=/home/projects/safeprompt/dashboard
WEBSITE=/home/projects/safeprompt/website
API=/home/projects/safeprompt/api
```

### Core Value Proposition
**"Stop users from hijacking your AI. One API call."**

- **Fast**: <100ms pattern detection (67% of requests), 2-3s AI validation when needed
- **Simple**: Single API endpoint, clear docs
- **Transparent**: Public pricing, no sales calls
- **Accurate**: 98.9% accuracy with 2-pass validation

### Quick Commands
```bash
# Deploy to DEV (after code changes)
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
cd /home/projects/safeprompt/dashboard && npm run build && wrangler pages deploy out --project-name safeprompt-dashboard-dev --branch main
cd /home/projects/safeprompt/website && npm run build && wrangler pages deploy out --project-name safeprompt-dev --branch main
cd /home/projects/safeprompt/api && vercel --token $VERCEL_TOKEN --prod --yes

# Deploy to PROD
cd /home/projects/safeprompt/dashboard && npm run build && wrangler pages deploy out --project-name safeprompt-dashboard --branch main
cd /home/projects/safeprompt/website && npm run build && wrangler pages deploy out --project-name safeprompt --branch main
cd /home/projects/safeprompt/api && vercel --token $VERCEL_TOKEN --prod --yes

# Test API
curl -X POST https://api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sp_test_..." \
  -d '{"prompt":"test input"}'
```

---

## TESTING QUICK REFERENCE

**Complete documentation**: `/home/projects/safeprompt/docs/TESTING_REGIMENT.md`

### Test Tiers
1. **Unit Tests** (Automatic): `npm test` - 852 tests, <60s, runs on every push
2. **Smoke Tests** (Before prod): `npm run test:smoke` - 5 critical tests, 30s
3. **Realistic Tests** (Manual): `npm run test:realistic` - 104 tests, 8-10min, requires OPENROUTER_API_KEY
4. **Manual Validation**: Ad-hoc testing with curl

### Current Coverage
- **Unit tests**: 852 tests (100% pass rate)
  - Custom lists tests: 132 tests (sanitizer, validator, checker, integration)
- **Overall coverage**: 52.71%
- **Critical path coverage**: 74-96% on validation logic
- **Accuracy**: 98.9% (93/94 professional tests passed, 10 custom lists tests added)

---

## CRITICAL ERROR PATTERNS (Quick Lookup)

**For complete table**: See `/home/projects/safeprompt/docs/PATTERNS.md`
**For detailed explanations**: See `/home/projects/safeprompt/docs/INCIDENTS.md`

### Most Common Issues

**Error 42P17 "infinite recursion"**
- Cause: RLS policy queries same table
- Fix: Use `SECURITY DEFINER` function
- Code: `CREATE FUNCTION ... SECURITY DEFINER`

**"API key not found" (95% are dotenv path issues)**
- Cause: `dotenv.config()` without absolute path
- Fix: `dotenv.config({path: path.join(os.homedir(), 'projects/safeprompt/.env')})`

**"user not found" (prod users exist)**
- Cause: Dashboard using wrong database
- Fix: Remove `.env.local`, rebuild

**Dev traffic hits prod database**
- Cause: Single API architecture
- Fix: Separate Vercel projects (safeprompt-api-dev + safeprompt-api)

**Custom domain shows old version after deploy**
- Cause: Deployed to Preview not Production
- Fix: Add `--branch main` flag to wrangler deploy

**"Model not found" (OpenRouter)**
- Cause: Model deprecated
- Fix: Use context7 to get current model names

**"No signatures found" (Stripe webhook)**
- Cause: Body already parsed by Vercel
- Fix: Set `bodyParser: false`, use raw buffer

**Regex detects "system" but not "admin"**
- Cause: `/g` flag state pollution
- Fix: Remove `/g` from boolean `.test()` patterns

**See PATTERNS.md for complete error lookup table (19 patterns)**

---

## CURRENT ARCHITECTURE

### Production Environment
```
Frontend (Cloudflare Pages)
├── website: safeprompt.dev
└── dashboard: dashboard.safeprompt.dev

API (Vercel: safeprompt-api)
└── api.safeprompt.dev
    ├── /api/v1/validate - validation endpoint
    └── /api/webhooks - payment processing

AI Validation (OpenRouter)
├── Pass 1: Google Gemini 2.0 Flash (fast)
└── Pass 2: Google Gemini 2.5 Flash (accurate)

Database (Supabase)
└── PROD: adyfhzbcsqzgqvyimycv
```

### Development Environment
```
Frontend (Cloudflare Pages)
├── dev.safeprompt.dev
└── dev-dashboard.safeprompt.dev

API (Vercel: safeprompt-api-dev)
└── dev-api.safeprompt.dev

Database (Supabase)
└── DEV: vkyggknknyfallmnrmfu (same schema as prod, test data only)
```

**🚨 CRITICAL**: Complete dev/prod isolation. Each environment has separate API endpoint, database, and Vercel project.

---

## VALIDATION PIPELINE (Updated 2025-10-08)

**Complete flow** (from fastest to most thorough):

### Stage 0: External Reference Detection (0ms, 5% of requests)
- Detects external URLs, IP addresses, file paths
- **CANNOT be overridden** by custom lists
- Instant block if dangerous references found

### Stage 0.5: Custom Lists Check (NEW - 0ms, instant)
- Checks against custom whitelist/blacklist phrases
- **Blacklist match** (0.9 confidence) → Routes to AI with high attack signal
- **Whitelist match** (0.8 confidence) → Routes to AI with high business signal
- **No match** → Continue to pattern detection
- Three-layer merging: defaults → profile custom → request custom
- **IMPORTANT**: This is a routing signal, not an instant decision

### Stage 1: Pattern Detection (<100ms, 67% of requests)
- XSS, SQL injection, template injection, command injection
- **CANNOT be overridden** by custom lists (security first)
- Instant block if pattern matched WITHOUT business context
- Routes to AI if pattern matched WITH business context (whitelist signal)

### Stage 2: Pass 1 AI Validation (2-3s, Gemini 2.0 Flash)
- Fast model for clear-cut cases
- Uses custom list confidence signals in decision
- High confidence (>0.7) → Return decision
- Low confidence → Escalate to Pass 2

### Stage 3: Pass 2 AI Validation (3-4s, Gemini 2.5 Flash)
- Accurate model for edge cases
- Final decision with custom list signals considered
- Returns detailed reasoning and confidence

**Custom Lists Architecture**:
- Blacklist always wins over whitelist (priority: blacklist > whitelist)
- Pattern detection always runs (cannot be bypassed)
- Custom lists provide confidence signals to AI, not instant decisions
- Free tier: Default lists only (read-only)
- Paid tiers: Can add custom phrases with tier-based limits

---

## DEPLOYMENT CHECKLIST

**For detailed procedures**: See `/home/projects/safeprompt/docs/DEPLOYMENT-DETAILED.md`

### Before Deploying
- [ ] All tests passing (`npm test`)
- [ ] Smoke tests passing (`npm run test:smoke`)
- [ ] Code committed to correct branch (dev or main)
- [ ] Tech reference docs read (if working with Supabase/Vercel/Cloudflare)

### DEV Deployment
1. Load credentials: `source /home/projects/.env && export CLOUDFLARE_API_TOKEN`
2. Deploy dashboard: `cd dashboard && npm run build && wrangler pages deploy out --project-name safeprompt-dashboard-dev --branch main`
3. Deploy website: `cd website && npm run build && wrangler pages deploy out --project-name safeprompt-dev --branch main`
4. Deploy API (if changes): `cd api && vercel --token $VERCEL_TOKEN --prod --yes`
5. Verify: Test API endpoint with curl

### PROD Deployment
1. Verify DEV deployment successful
2. Run smoke tests: `cd api && npm run test:smoke`
3. Same deployment commands but use prod project names
4. Verify: Test API + monitor logs for 5-10 minutes

### Common Deployment Errors
- **Vercel auth error**: Token must be passed WITHOUT quotes: `--token $VERCEL_TOKEN` (not `--token="$VERCEL_TOKEN"`)
- **Cloudflare old version**: Add `--branch main` flag
- **API fails after deploy**: Check environment variables (`vercel env ls`)
- **Database connection fails**: Verify `.env.local` removed from dashboard

---

## 🚨 CRITICAL WARNINGS

### Git Repository Separation
**TWO SEPARATE REPOS - NEVER CONFUSE:**
- **Private**: `/home/projects/safeprompt` → safeprompt-internal.git (ALL work)
- **Public**: `/home/projects/safeprompt-public` → safeprompt.git (NPM package docs only)

**Before ANY git operation**: `pwd && git remote -v` to verify location

### Database Safety
- **PROD database** (adyfhzbcsqzgqvyimycv) is authoritative - never delete user data
- **DEV database** (vkyggknknyfallmnrmfu) contains only test users
- **Always verify** which database before schema changes
- **Always backup**: `pg_dump` before schema changes

### Pricing (NEVER Change Without User)
```javascript
FREE_TIER = 1,000 validations/month
STARTER = $29/month, 10,000 validations
EARLY_BIRD = $5/month, 10,000 validations (first 50 users only)
BUSINESS = $99/month, 250,000 validations
```

---

## KEY FILE LOCATIONS

### Documentation
```
/home/projects/safeprompt/CLAUDE.md                    # This file (core ops)
/home/projects/safeprompt/docs/PATTERNS.md             # Error lookup table
/home/projects/safeprompt/docs/INCIDENTS.md            # Full incident history
/home/projects/safeprompt/docs/DEPLOYMENT-DETAILED.md  # Complete deployment guide
/home/projects/safeprompt/docs/TESTING_REGIMENT.md     # Complete testing guide
/home/projects/safeprompt/docs/PHASE_1A_INTELLIGENCE_ARCHITECTURE.md  # Phase 1A system
```

### Platform Reference Docs (READ BEFORE USING)
```
/home/projects/docs/reference-supabase-access.md       # Database operations
/home/projects/docs/reference-vercel-access.md         # API deployment
/home/projects/docs/reference-cloudflare-access.md     # Frontend deployment
```

### Source Code
```
# Core Validators
/home/projects/safeprompt/api/lib/ai-validator-unified.js       # Production validator (3-stage)
/home/projects/safeprompt/api/lib/ai-validator-hardened.js      # Legacy 2-pass validator
/home/projects/safeprompt/api/lib/external-reference-detector.js # URL/IP detection
/home/projects/safeprompt/api/lib/prompt-validator.js           # Pattern matching

# Custom Lists (NEW)
/home/projects/safeprompt/api/lib/custom-lists-checker.js       # Match logic
/home/projects/safeprompt/api/lib/custom-lists-validator.js     # Three-layer merging
/home/projects/safeprompt/api/lib/custom-lists-sanitizer.js     # Input validation
/home/projects/safeprompt/api/lib/default-lists.js              # Default phrases
/home/projects/safeprompt/api/api/v1/custom-lists/index.js      # CRUD API

# Main Endpoint
/home/projects/safeprompt/api/api/v1/validate.js                 # Main API endpoint
```

### Testing
```
/home/projects/safeprompt/api/__tests__/                         # Unit tests (852 tests)
  ├── custom-lists-sanitizer.test.js                            # 39 tests
  ├── custom-lists-validator.test.js                            # 37 tests
  ├── custom-lists-checker.test.js                              # 31 tests
  └── custom-lists-integration.test.js                          # 25 tests
/home/projects/safeprompt/test-suite/smoke-test-suite.js        # Smoke tests (5)
/home/projects/safeprompt/test-suite/realistic-test-suite.js    # Realistic tests (104)
```

---

## USER MANAGEMENT

### Test Accounts (PROD Database)
```
ian.ho@rebootmedia.net - internal tier (admin/testing)
test-free@safeprompt.dev - free tier (testing)
test-pro@safeprompt.dev - pro tier (testing)
```

### Known Production Users
```
yuenho.8@gmail.com - growth tier (first paying customer)
arsh.s@rebootmedia.net - free tier (team member)
linpap@gmail.com - free tier (friend/tester)
```

---

## WHEN THINGS BREAK

### Step 1: Check Pattern Reference
Look up error in `/home/projects/safeprompt/docs/PATTERNS.md` for instant fix.

### Step 2: Check Incidents
If pattern doesn't match, see `/home/projects/safeprompt/docs/INCIDENTS.md` for full history.

### Step 3: Use Context7
If issue relates to external API or unfamiliar library:
```
"use context7 to show [library] [feature] current documentation"
```

### Step 4: Read Platform Docs
If issue relates to Supabase/Vercel/Cloudflare, read relevant reference doc from `/home/projects/docs/`

### Step 5: Check Logs
```bash
# Vercel API logs
vercel logs --token="$VERCEL_TOKEN" --project=safeprompt-api --since=1h

# Supabase database logs
# Go to dashboard → Logs → Filter by error level
```

---

## IMPORTANT REMINDERS

1. **Always use absolute paths**: `cd /home/projects/safeprompt && ...` (shell resets to /workspace)
2. **Always verify database**: Check which DB dashboard is using before troubleshooting
3. **Always backup before schema changes**: `pg_dump` before any migration
4. **Always test in DEV first**: Never deploy directly to PROD
5. **Always read tech docs first**: Saves 50+ minutes on already-solved problems
6. **Always use context7 for APIs**: Prevents outdated/deprecated patterns
7. **Always check error patterns first**: 19 known issues with documented fixes
8. **Always verify git remote**: `git remote -v` before pushing

---

**End of Core Documentation**

**For deep dives, see**:
- `/home/projects/safeprompt/docs/PATTERNS.md` - Error lookup table
- `/home/projects/safeprompt/docs/INCIDENTS.md` - 19 incident narratives with full details
- `/home/projects/safeprompt/docs/DEPLOYMENT-DETAILED.md` - Step-by-step procedures
- `/home/projects/safeprompt/docs/TESTING_REGIMENT.md` - Complete testing guide
