# SafePrompt - AI Assistant Instructions

**Last Updated**: 2025-10-09 (Realistic Test Suite Enhancements + Attack Gallery Expansion)
**Status**: Production Ready with Advanced Intelligence Architecture + Custom Lists + Network Defense
**Deployment**: Cloudflare Pages (website + dashboard), Vercel Functions (API)

**🎉 Recent Milestones**:
- **Attack Gallery Expansion** (2025-10-09): Added 7 sophisticated attacks (semantic extraction, business context masking) - now 25 examples total
- **Test Suite Improvements** (2025-10-09): 93.5% accuracy (130/139), enhanced AI prompts for semantic extraction detection
- **Phase 6 Intelligence** (2025-10-08): Pattern Discovery, Campaign Detection, Honeypot Learning deployed to production
- **Phase 1A Network Defense** (2025-10-08): Threat Intelligence + IP Reputation system deployed with 67 tests passing
- **Custom Lists V2** (2025-10-08): Custom whitelist/blacklist feature deployed to production

**🚨 Intelligence Architecture** (ALL DEPLOYED TO PRODUCTION):
- **Threat Intelligence** (Phase 1A): 24-hour anonymization, GDPR/CCPA compliant data collection, tier-based contribution
- **IP Reputation** (Phase 1A): Hash-based auto-blocking, <10ms lookup, Pro tier network defense
- **Pattern Discovery** (Phase 6): ML-powered automated pattern detection (3 AM UTC daily cron)
- **Campaign Detection** (Phase 6): Temporal clustering and similarity analysis (3:30 AM UTC daily cron)
- **Honeypot Learning** (Phase 6): Safe auto-deployment of validated patterns (4 AM UTC daily cron)
- **Admin Dashboard** (Phases 1A+6): Complete IP management, pattern proposals, campaign response tools

**✨ Custom Lists (NEW)**:
- **Custom Whitelist**: Business-specific phrases that provide high confidence signals (0.8)
- **Custom Blacklist**: Attack patterns that provide high attack confidence (0.9)
- **Default Lists**: Curated phrases for common business scenarios (replace old business keywords)
- **Tier Limits**: Free (defaults only), Starter (25/25), Business (100/100), Internal (200/200)
- **Dashboard UI**: Manage custom lists at `/custom-lists` with real-time validation

For complete architecture details, see:
- `/home/projects/safeprompt/docs/PHASE_1A_INTELLIGENCE_ARCHITECTURE.md` (Threat Intelligence & IP Reputation)
- `/home/projects/safeprompt/docs/PHASE_6_INTELLIGENCE_ARCHITECTURE.md` (Pattern Discovery & Campaign Detection)
- `/home/projects/safeprompt/docs/SECURITY_HARDENING_QUARTER1.md` (Complete Quarter 1 security hardening tasks)
- `/home/projects/safeprompt/docs/TESTING_REGIMENT.md` (Complete testing guide including Phase 6 payment tests)

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
  - Phase 1A tests: 67 tests (compliance, performance, IP reputation, intelligence collection)
  - Phase 6 tests: Payment testing (12/15 passing, 3 expected DEV failures)
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

## PHASE 1A: THREAT INTELLIGENCE & IP REPUTATION

**Status**: Core implementation complete (12/81 tasks, October 2025)
**Documentation**: `/home/projects/safeprompt/docs/PHASE_1A_IMPLEMENTATION_SUMMARY.md`
**Legal Compliance**: GDPR/CCPA compliant with 24-hour PII retention

### Business Model

**Network Defense Through Collective Intelligence**:
- **Free Tier**: Always contributes blocked requests → No IP blocking benefits
- **Pro Tier**: Opts in (default ON) → Gets IP reputation auto-blocking
- **Competitive Moat**: Data network effects (more users = better protection)

### Tier-Based Collection Rules

```javascript
// Free Tier
- Collects: Blocked requests ONLY (safe: false)
- Benefits: None (contributes to network defense)
- Opt-out: Not available (part of free tier terms)

// Pro Tier
- Collects: ALL requests IF opted in (default: true)
- Benefits: IP reputation auto-blocking
- Opt-out: Account settings > Privacy > Intelligence Sharing
- Default: Enabled (user can disable)

// Internal Tier
- Collects: NEVER
- Benefits: All features without contribution
- Purpose: Testing, development, admin
```

### Database Schema

**Table 1: `threat_intelligence_samples`**
- **Purpose**: Pattern analysis, attack discovery, moat building
- **PII Retention**: 24 hours (then auto-deleted)
- **Anonymized Data**: 90 days (hashes + metadata)
- **Key Fields**:
  - `prompt_text` (24h) → `prompt_hash` (permanent SHA256)
  - `client_ip` (24h) → `ip_hash` (permanent SHA256)
  - `validation_result`, `attack_vectors`, `threat_severity` (permanent, no PII)
- **Legal Basis**: GDPR Article 17(3)(d) - Scientific research

**Table 2: `ip_reputation`**
- **Purpose**: Auto-blocking of known bad actors (Pro tier)
- **Primary Key**: `ip_hash` (SHA256, cannot reverse to IP address)
- **Scoring Formula**:
  ```
  reputation_score = (block_rate * 0.7) + (severity_avg * 0.3)
  auto_block = (block_rate > 0.8) AND (sample_count >= 5)
  ```
- **Lookup Performance**: <10ms (hash index on `ip_hash`)

**Table 3: `ip_allowlist`**
- **Purpose**: CI/CD protection, testing infrastructure bypass
- **Critical Use**: Prevents blocking test suites during high attack detection
- **Fields**: `ip_address`, `ip_hash`, `purpose`, `active`, `expires_at`
- **Bypass Header**: `X-SafePrompt-Test-Suite: <token>` (constant-time comparison)

### GDPR/CCPA Compliance

**Right to Deletion** (`/api/gdpr/delete-user-data`):
```javascript
// Deletes ALL PII linked to user_id:
- threat_intelligence_samples.prompt_text → NULL
- threat_intelligence_samples.client_ip → NULL
- User preferences → Reset

// Preserves anonymized data (GDPR Article 17(3)(d)):
- prompt_hash, ip_hash (cannot identify individuals)
- validation_result, attack_vectors (no PII)
```

**Right to Access** (`/api/gdpr/export-user-data`):
```javascript
// Returns machine-readable export:
{
  user_id: 'user-123',
  data: {
    threat_samples: [...],
    preferences: { intelligence_sharing: true },
    retention_policy: "24 hours PII, 90 days anonymized"
  }
}
```

**CCPA Compliance**:
- Opt-out mechanism: Account settings > Privacy
- No data sale: Internal threat intelligence only
- Clear disclosure: Signup flow + Privacy Policy

### Security Properties

**Hash Irreversibility**:
- Algorithm: SHA256 (64 hex characters)
- Cannot reverse: 2^256 search space (~10^77 possibilities)
- Collision resistance: 2^-128 probability (astronomically low)
- Deterministic: Same input = same hash (required for lookup)

**Performance Requirements**:
- Hash generation: <1ms
- IP reputation lookup: <5ms (with hash index)
- Auto-block decision: <10ms total
- Intelligence collection: 0ms (async, fire-and-forget)

**Bypass Mechanisms** (priority order):
1. Test suite header: `X-SafePrompt-Test-Suite: <token>`
2. IP allowlist: Exact match on `ip_hash`
3. Internal tier: `user.tier === 'internal'`

### Implementation Files

**Core Logic**:
- `/home/projects/safeprompt/api/lib/intelligence-collector.js` - Tier-based collection
- `/home/projects/safeprompt/api/lib/ip-reputation.js` - Hash-based reputation lookup
- `/home/projects/safeprompt/supabase/migrations/20251006_threat_intelligence.sql` - Schema

**Tests** (38 tests, 100% pass):
- `/home/projects/safeprompt/test-suite/intelligence-collection.test.js` (12 tests)
- `/home/projects/safeprompt/test-suite/ip-reputation.test.js` (18 tests)
- `/home/projects/safeprompt/test-suite/phase1a-compliance.test.js` (21 tests: GDPR, CCPA, security)
- `/home/projects/safeprompt/test-suite/phase1a-performance.test.js` (16 tests: <10ms latency)

**Background Jobs**:
- PII deletion: Daily at 00:00 UTC (deletes prompt_text + client_ip > 24h old)
- Anonymized cleanup: Daily (deletes hashes > 90 days old)
- Reputation updates: Real-time on validation (UPSERT pattern)

### Integration with Validation Pipeline

**Step 1**: Validate prompt (existing pipeline)
**Step 2**: Check IP reputation (if Pro tier + opted in):
```javascript
const ipCheck = await checkIPReputation(clientIP, {
  subscription_tier: 'pro',
  auto_block_enabled: true
});

if (ipCheck.should_block) {
  return { safe: false, reason: 'ip_reputation_block', reputation_score: 0.15 };
}
```

**Step 3**: Collect intelligence (async, after response sent):
```javascript
// Fire-and-forget (does not block user response)
collectThreatIntelligence(prompt, validationResult, {
  ip_address: clientIP,
  user_agent: request.headers['user-agent'],
  user_id: apiKey.user_id
});
```

**Step 4**: Update IP reputation (async):
```javascript
// UPSERT pattern for concurrent safety
await updateIPReputationScores(ipHash, {
  blocked: !validationResult.safe,
  severity: validationResult.threats?.length || 0
});
```

### Critical Reminders

1. **Always use hashes for storage** - Never store raw IPs or prompts beyond 24h
2. **Always check tier before collection** - Internal tier NEVER collects
3. **Always make collection async** - User must never wait for INSERT
4. **Always verify allowlist first** - Prevents blocking CI/CD during attacks
5. **Always use constant-time comparison** - Test suite header check (timing attack protection)
6. **Always check opt-in status** - Pro users can disable intelligence sharing

---

## PHASE 6: PATTERN DISCOVERY & CAMPAIGN DETECTION

**Status**: Deployed to PROD (2025-10-08)
**Documentation**: `/home/projects/safeprompt/docs/PHASE_6_INTELLIGENCE_ARCHITECTURE.md`
**Monitoring**: `/home/projects/safeprompt/docs/PHASE_6_MONITORING.md`
**Rollback**: `/home/projects/safeprompt/docs/PHASE_6_ROLLBACK_PLAN.md`

### Overview

Phase 6 builds on Phase 1A's threat intelligence to **automatically discover and deploy new attack patterns** without manual intervention. The system runs three background jobs daily to analyze attack data and update defenses.

### Background Jobs (Vercel Cron)

**1. Pattern Discovery** (3:00 AM UTC daily)
- **File**: `/home/projects/safeprompt/api/api/cron/pattern-discovery.js`
- **Purpose**: Analyze threat intelligence samples to discover new attack patterns
- **Process**:
  1. Query samples with ≥10 occurrences (high confidence)
  2. Use AI to identify common attack techniques
  3. Generate regex patterns for fast detection
  4. Create pattern proposals for admin review
- **Max Duration**: 300 seconds (5 minutes)

**2. Campaign Detection** (3:30 AM UTC daily)
- **File**: `/home/projects/safeprompt/api/api/cron/campaign-detection.js`
- **Purpose**: Detect coordinated attack campaigns using temporal clustering
- **Process**:
  1. Group attacks by time window (1-hour clusters)
  2. Calculate similarity scores (IP overlap, attack vector similarity)
  3. Flag campaigns with ≥5 related attacks
  4. Alert admin for investigation
- **Max Duration**: 120 seconds (2 minutes)

**3. Honeypot Learning** (4:00 AM UTC daily)
- **File**: `/home/projects/safeprompt/api/api/cron/honeypot-learning.js`
- **Purpose**: Auto-deploy patterns from honeypot endpoints (100% malicious traffic)
- **Process**:
  1. Query honeypot requests (fake endpoints)
  2. Extract attack patterns
  3. Auto-deploy to production (no admin review needed)
  4. Log deployment for audit trail
- **Max Duration**: 180 seconds (3 minutes)

### Database Schema (Phase 6)

**Table 1: `pattern_proposals`**
- **Purpose**: Store AI-discovered patterns pending admin review
- **Key Fields**:
  - `pattern` (regex string)
  - `attack_type` (XSS, SQL, template, etc.)
  - `confidence_score` (0-1, from AI analysis)
  - `sample_count` (number of samples matching)
  - `status` (pending, approved, rejected, deployed)
- **Admin Action**: Review at `/admin/intelligence` dashboard

**Table 2: `attack_campaigns`**
- **Purpose**: Track coordinated attack attempts
- **Key Fields**:
  - `campaign_id` (UUID)
  - `attack_count` (number of related attacks)
  - `unique_ips` (distinct IPs involved)
  - `similarity_score` (0-1, clustering confidence)
  - `status` (active, investigating, resolved, blocked)
- **Admin Action**: Investigate and block at `/admin/intelligence`

**Table 3: `honeypot_learnings`**
- **Purpose**: Auto-deployed patterns from honeypot endpoints
- **Key Fields**:
  - `pattern` (regex string)
  - `source` (honeypot endpoint)
  - `deployed_at` (auto-deployment timestamp)
  - `match_count` (number of production matches)
- **Safety**: Patterns auto-revert if false positive rate >5%

**Table 4: `threat_intelligence_samples` (extended)**
- **New Columns**:
  - `campaign_id` (links to attack_campaigns)
  - `pattern_proposal_id` (links to pattern_proposals)
  - `honeypot_source` (NULL for production, endpoint for honeypot)

### Admin Dashboard (/admin/intelligence)

**Pattern Proposals Tab**:
- View AI-discovered patterns pending review
- See sample count, confidence score, attack type
- Approve (deploy to production) or Reject
- Test pattern against validation history

**Campaign Detection Tab**:
- View active coordinated attacks
- See IP clusters, time distribution, attack vectors
- Investigate individual samples
- Block entire campaign or specific IPs

**Honeypot Analytics Tab**:
- View auto-deployed patterns
- Monitor false positive rates
- Manual revert if needed
- Request history from honeypot endpoints

### Monitoring & Alerts

**Health Checks** (Manual, daily):
- Vercel logs: Check cron job execution at 5 AM UTC
- Supabase dashboard: Monitor database performance
- Admin dashboard: Review pending pattern proposals

**Performance Baselines** (P95):
- Pattern Discovery: 60-120 seconds
- Campaign Detection: 30-60 seconds
- Honeypot Learning: 45-90 seconds

**Alert Triggers**:
- Cron job timeout (>max duration)
- Database CPU >80% sustained
- No pattern discovery in 48 hours
- Active critical campaigns detected

### Rollback Procedures

**Level 1**: Disable specific job (5 minutes)
```bash
# Comment out cron schedule in vercel.json
# Redeploy API
```

**Level 2**: Disable all Phase 6 jobs (10 minutes)
```bash
# Comment out all 3 cron schedules
# Redeploy API
```

**Level 3**: Revert database schema (30 minutes)
```bash
# Mark migrations as reverted
supabase migration repair --status reverted 20251007030000
supabase db push
```

**Safety Principle**: Phase 6 is additive only - disabling returns to Phase 1A functionality with zero impact on core validation.

### Integration with Validation Pipeline

Phase 6 **does not change the validation flow** - it only updates the pattern database that Stage 1 uses:

1. User validation request → Existing pipeline (Stage 0 → 1 → 2 → 3)
2. Background jobs run nightly → Discover new patterns
3. Admin approves → Patterns added to `prompt-validator.js` regex list
4. Next user validation → New patterns automatically checked

### Critical Reminders

1. **Admin review required** for pattern proposals (except honeypot patterns)
2. **Cron jobs are asynchronous** - Do not block user validation
3. **Always monitor first week** - Validate baselines match expectations
4. **Test rollback procedures** - Ensure Level 1 rollback works before production
5. **Honeypot auto-deploy is safe** - 100% malicious traffic (fake endpoints)
6. **Campaign detection is informational** - Does not auto-block (admin decision)

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
