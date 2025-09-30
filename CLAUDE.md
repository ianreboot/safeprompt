# SafePrompt - AI Assistant Instructions

**Last Updated**: 2025-09-30
**Status**: Beta - Production Ready (Code Cleaned)
**Deployment**: Cloudflare Pages (website), Vercel Functions (API)

## Project Overview
SafePrompt is a developer-first API service that prevents prompt injection attacks in AI applications. We provide a simple, fast, and transparent solution for developers who need to secure their LLM-powered features without complexity or enterprise sales cycles.

**Domain**: safeprompt.dev
**Repository**: https://github.com/ianreboot/safeprompt.git
**Current State**: Production ready, comprehensive cleanup completed Sep 2025

## Core Value Proposition
"Stop prompt injection in one line of code"
- **Fast**: <100ms response time (regex: 5ms, AI validation: 50-100ms)
- **Simple**: Single API endpoint, clear documentation
- **Transparent**: Public pricing, no sales calls
- **Accurate**: Multi-layer validation with confidence scoring

## 🔒 EMAIL PRIVACY PROTOCOL

### MANDATORY: No Email Address Exposure
**ALL customer contact must go through the contact form at safeprompt.dev/contact**

### Never Expose These Emails:
- ❌ support@safeprompt.dev
- ❌ info@safeprompt.dev
- ❌ ian@rebootmedia.net
- ❌ Any other internal email addresses

### Always Use:
- ✅ Contact form: https://safeprompt.dev/contact
- ✅ Form sends to info@safeprompt.dev via Resend (backend only)
- ✅ Auto-reply confirms receipt

### Why This Matters:
1. **Spam Prevention**: Exposed emails get harvested by bots
2. **Professional Image**: Contact forms look more legitimate
3. **Tracking**: We can measure support volume
4. **Security**: Reduces phishing attack surface

## 🎯 PRICING STRATEGY

### Current Pricing (September 2025)
- **Standard Price**: $29/month for all new users
- **Legacy Beta Users**: $5/month (locked forever for first 50 users)
- **Free Tier**: 10,000 validations/month
- **Count Tracking**: Supabase `profiles` table where `subscription_status = 'paid'`

### 🚨 CRITICAL: Content Pricing Guidelines
**For All Customer-Facing Content (blogs, docs, marketing):**
- **Always use $29/month** - Standard pricing that won't become outdated
- **Never mention beta pricing** - Creates confusion and content decay
- **Never expose internal costs** - Mark as `[BUSINESS CONFIDENTIAL]`
- **Use competitive context**: "Professional services: $150-300/month" for comparison

**Example Meta Description:**
```
✅ Good: "Professional services cost $150-300/month. SafePrompt $29/month."
❌ Bad: "SafePrompt beta $5/month (regular $29/mo), DIY $0.50/100K requests."
```

### Implementation:
- Display $29/month to all new visitors
- Beta users see their locked $5 rate in dashboard only
- Content marketing uses stable $29/month pricing
- Use `VITE_STANDARD_PRICE=29` environment variable

## Unified Signup Flow (Conversion Optimized)

### Architecture:
- **Website** (`/signup`): Static page showing both options
- **Dashboard** (`/onboard`): Handles API calls (Supabase, Stripe, waitlist)

### Key Features:
1. **Single page** with both Free (waitlist) and Paid ($5 beta) options
2. **Paid pre-selected** by default (3-5x conversion boost)
3. **Visual hierarchy** favoring paid plan
4. **Urgency**: "Only X/50 beta spots left"
5. **Anchoring**: Show $29 crossed out

### Expected Results:
- Overall signups: 15%+ (vs 8% current)
- Paid conversion: 40%+ of signups
- Abandonment: -50%

### Files:
- `/website/app/signup/page.tsx` - Unified signup page
- `/dashboard/src/app/onboard/page.tsx` - API handler

## 🐕 INTERNAL TEST ACCOUNT (Dogfooding)

### Account Details
SafePrompt has an internal test account for unlimited API usage:

- **Email**: ian.ho@rebootmedia.net
- **Password**: SafePromptTest2025!
- **API Key**: sp_test_unlimited_dogfood_key_2025
- **Monthly Limit**: 999,999 (effectively unlimited)
- **Company**: Reboot Media
- **Status**: Active, Beta User

### Purpose
This account bypasses all rate limits and is used for:
1. **Testing contact forms** across all Reboot Media projects
2. **Dashboard development** with real production data
3. **API integration testing** without usage concerns
4. **Waitlist form connections** to SafePrompt API
5. **Eating our own dogfood** - using SafePrompt to protect SafePrompt

### Technical Implementation
- Recognized by hardcoded check in `/api/api/v1/validate.js`
- Returns `internal_account: true` in API responses
- Stored in `/home/projects/.env` as SAFEPROMPT_TEST_* variables
- User exists in both auth.users and users tables in Supabase

### Usage Examples
```javascript
// Use in any form that needs prompt validation
const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sp_test_unlimited_dogfood_key_2025'
  },
  body: JSON.stringify({
    prompt: userInput,
    mode: 'optimized'
  })
});
```

## Technical Architecture

### Stack
- **Website + Blog**: Next.js + Tailwind → Cloudflare Pages (NOT Astro!)
- **API**: Vercel Functions (stateless validation endpoints)
- **Database**: Supabase PostgreSQL (profiles table linked to auth.users)
- **AI**: OpenRouter (multi-model strategy for cost optimization)
- **Payments**: Stripe (direct API checks, no data duplication)
- **Email**: Resend (contact form → info@safeprompt.dev)

### 🚨 CRITICAL: API Consolidation (2025-09-25)
**We consolidated from 14 endpoints to 5 to stay under Vercel's 12-function limit.**

**Current endpoints:**
1. `/api/admin` - Health, status, cache, user API keys
2. `/api/v1/validate` - All validation modes (replaced 6 endpoints)
3. `/api/webhooks` - Stripe and future webhooks
4. `/api/contact` - Contact form
5. `/api/waitlist` - Waitlist signup

**Common mistakes to avoid:**
- ❌ Don't use `/api/v1/check` → Use `/api/v1/validate`
- ❌ Don't use `/api/health` → Use `/api/admin?action=health`
- ❌ Don't use `/api/v1/stripe-webhook` → Use `/api/webhooks?source=stripe`

See ARCHITECTURE.md for complete endpoint mapping.

### Validation Pipeline
1. **Regex Patterns** - Fast first pass (5ms) from `/home/projects/api/utils/prompt-validator.js`
2. **Confidence Scoring** - Determine if AI validation needed
3. **AI Validation** - Only when confidence is uncertain (OpenRouter with tiered models)
4. **Response** - Safe/unsafe verdict with confidence score

### Key Decisions Made
- **No WASM sandboxing** - Unnecessary complexity for MVP
- **Tiered AI models** - Llama 8B for quick checks, Llama 70B for uncertain cases
- **30-day log retention** - Balance between debugging and privacy
- **No enterprise features initially** - Focus on individual developers

## Business Strategy

### Target Customer Demographics

#### Primary Audience: Vibe Coders & New Developers (80% of target)
**Vibe Coders**: Solo developers who ship fast, use AI tools extensively, prioritize momentum over perfection
- Building AI-powered side projects and MVPs
- Use cursor/v0/claude/chatgpt as primary coding tools
- Value simplicity and speed over complex architectures
- Likely building: AI chatbots, form processors, customer service tools
- Language: Casual, direct, meme-aware but not cringe
- Pain points: Security feels complex, don't know what they don't know

**New Developers**: Recent bootcamp grads, self-taught, 0-2 years experience
- First time integrating AI into projects
- Following tutorials and documentation closely
- Need hand-holding but don't want to feel talked down to
- Building portfolio projects and early freelance work
- Language: Clear explanations without jargon
- Pain points: Overwhelmed by security best practices

#### Secondary Audience: Small Startups & Enterprise Devs (20% of target)
**Small Startups** (pre-Series A): Moving fast but need basic security
- 1-10 person eng teams adding AI features
- Need to check the security box for customers
- Will pay for convenience and time savings

**Enterprise Developers** (not the company): Individual devs at large companies
- Building internal tools and prototypes
- Can expense small monthly subscriptions
- Need simple integration that won't trigger security review

### Anti-target
**Large Enterprises**: Wanting complex integrations, compliance certifications, SLAs
- We explicitly don't serve enterprise procurement processes
- No sales calls, RFPs, or vendor security assessments

### Pricing Model
- **Free**: 10,000 validations/month
- **Starter**: $29/month - 100,000 validations
- **Business**: $99/month - 1,000,000 validations

### Competitive Positioning
Unlike Lakera (enterprise) and Rebuff (open source), we focus on:
- Transparent pricing (no "contact sales")
- Developer experience (npm install → working in 30 seconds)
- Speed + accuracy balance (not paranoid mode by default)

## Current Status (September 2025)

### Infrastructure Status
- **Domain**: safeprompt.dev (live)
- **API**: api.safeprompt.dev (operational on Vercel)
- **Dashboard**: dashboard.safeprompt.dev (functional)
- **Contact Form**: safeprompt.dev/contact (Resend integration active)
- **Validation System**: Hardened 2-pass validator (92.9% accuracy at $0.50/100K)
- **Codebase**: Cleaned and production-ready (Sep 30, 2025)

### Recent Cleanup (2025-09-30)
- **Removed**: 10 archived validator versions, 23 test archive files, 9 obsolete docs (15,549 lines)
- **Fixed**: API key storage (now hash-only for security)
- **Fixed**: Testing backdoors removed from production code
- **Fixed**: Fake cache statistics removed
- **Added**: Shared utility functions (`/api/lib/utils.js`) to reduce duplication
- **Updated**: API docs to match current /validate endpoint
- **Deployed**: All three apps (API, Website, Dashboard) with cleanup changes

### Database Architecture (UPDATED January 2025)

```sql
-- Unified profiles table with subscription management
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  api_key TEXT UNIQUE DEFAULT gen_random_uuid(),
  api_calls_this_month INT DEFAULT 0,
  subscription_status TEXT DEFAULT 'free',
  subscription_plan_id TEXT,
  subscription_period_end TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- API usage tracking
CREATE TABLE api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  endpoint TEXT,
  prompt_length INT,
  response_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE subscription_plans (
  stripe_price_id TEXT PRIMARY KEY,
  name TEXT,
  api_calls_limit INT,
  price_cents INT
);
```

**Key Updates**:
- Profiles table now includes subscription fields
- API logs replace validation_logs
- Subscription plans table for tier management
- See MIGRATION_GUIDE.md for full details

### Implementation Documentation

For complete implementation details, roadmap, and task tracking, see:
**`SAFEPROMPT_IMPLEMENTATION.md`**

This includes:
- Full development history (Phases 1-12)
- Emergency fixes applied (January 24, 2025)
- Complete roadmap to launch
- Testing commands and verification steps
- Key decisions and learnings

## Lessons Learned (Critical for Future Development)

### What NOT to Build (Mistakes Made)
- ❌ Fake npm packages (`@safeprompt/js` doesn't exist)
- ❌ Complex user tables duplicating Stripe data
- ❌ Hardcoded metrics (waitlist counter was fake)
- ❌ Links to non-existent pages (/docs, /api/health)
- ❌ Non-functional features presented as working
- ❌ Exposed email addresses (use contact form instead)

### Correct Patterns
- ✅ Use HTTP/curl examples until SDK actually exists
- ✅ Minimal profiles table linked to auth.users
- ✅ Check Stripe API directly for subscription status
- ✅ Clear demo mode indicators for preview accounts
- ✅ Inline documentation when dedicated pages don't exist
- ✅ Contact form instead of exposed email addresses

## File Structure
```
/home/projects/safeprompt/
├── CLAUDE.md          # This file
├── README.md          # Public project overview
├── docs/
│   ├── TECHNICAL.md   # Architecture, implementation details
│   ├── BUSINESS.md    # Strategy, market, pricing
│   └── API.md         # Endpoint documentation
├── api/               # Vercel Functions (API endpoints)
├── website/           # Next.js marketing website + blog (NOT Astro!)
│   ├── app/
│   │   ├── blog/      # Blog posts as React components
│   │   └── contact/   # Contact form page
│   └── components/
│       └── blog/      # Reusable blog components (References, CodeBlock, etc.)
├── dashboard/         # Next.js user dashboard
└── packages/          # NPM packages (SDK)
```

## ⛔ ANTI-POTEMKIN RULES (MANDATORY FOR ALL AIs)

**Potemkin Village**: Fake features presented as functional. This destroyed trust and wasted weeks.

### NEVER DO THIS:
1. **NEVER show installation for non-existent packages**
   - ❌ `npm install @safeprompt/js` (package doesn't exist)
   - ✅ Use curl/HTTP examples until package is published

2. **NEVER create UI without backend**
   - ❌ "Regenerate API Key" button with no endpoint
   - ✅ Disable button with "Coming soon" or build backend first

3. **NEVER fake metrics or counters**
   - ❌ Hardcoded "1,247 developers"
   - ✅ Show real count from database, even if "0"

4. **NEVER link to non-existent pages**
   - ❌ Links to `/docs` that 404
   - ✅ Only link to pages that exist, inline docs if needed

5. **NEVER reference non-existent database columns**
   - ❌ Query `api_calls_limit` without checking schema
   - ✅ Verify schema first: `\d table_name` in psql

6. **NEVER expose email addresses**
   - ❌ mailto:support@safeprompt.dev
   - ✅ Link to contact form at /contact

### ALWAYS DO THIS:
1. **Build backend → Test → Add UI** (in that order)
2. **Mark demo/beta clearly** with banners/badges
3. **Test every link and button** before committing
4. **Check database schema** before writing queries
5. **Use real data** or clearly marked test data
6. **Use contact form** for all customer communication

### The Trust Equation:
- Each fake element discovered = -10x trust
- One honest "beta" label = maintained trust
- Working minimal feature > Fake complete feature

## 🚨 CRITICAL LESSONS LEARNED (2025-01-24)

### Architecture Migration Lessons
1. **Profiles table is the way** - Single source of truth linked to auth.users
2. **Don't duplicate Stripe data** - Always query Stripe API for current status
3. **API keys in profiles** - Not separate table (sync nightmares)
4. **Triggers for auto-creation** - Profile created automatically on signup
5. **Git large files** - Node_modules will break GitHub pushes

### What Almost Killed Us
1. **Fake waitlist counter** - Hardcoded 1247, random increments
2. **Broken payment URL** - Test Stripe URL in production
3. **100% accuracy claim** - Not credible, even if true
4. **Dashboard without backend** - Frontend exists, API keys inaccessible
5. **No fresh-eyes review** - Blind to our own deception

### Hard-Won Technical Knowledge (Updated 2025-09-30)
- **Only Google Gemini FREE works** - 47 other "free" models failed
- **Vercel tokens expire** - Need periodic refresh
- **CORS headers mandatory** - Every API endpoint needs them
- **Cloudflare deploy** - Use `--commit-dirty=true` for uncommitted
- **Don't email API keys** - Security risk, use dashboard
- **Git filter-branch works** - Removes large files from history
- **Supabase env vars** - Use SAFEPROMPT_ prefix to avoid conflicts
- **Vercel functions are stateless** - Cache only works per-instance, not across deployments
- **Import crypto correctly** - Use `import { createHash } from 'crypto'` not `import crypto`
- **Vercel project linking crucial** - Wrong project = deployment to wrong domain
- **Check .vercel/project.json** - Determines which project deploys happen to
- **Use `vercel link --project`** - To ensure correct project association
- **Next.js builds to 'out' not 'dist'** - Critical for Cloudflare Pages deployment
- **CSS double-bullet/checkmark bug** - Remove `list-disc` from globals.css, use manual bullets
- **Blog uses Next.js NOT Astro** - Common misconception, website is all Next.js
- **Vercel CLI token syntax** - MUST use `--token="$VERCEL_TOKEN"` (quotes + equals) not `--token $VERCEL_TOKEN`
- **Dashboard env vars location** - In `/dashboard/.env.local` NOT `/home/projects/.env`
- **Vercel project IDs change** - `.vercel/project.json` updates on re-link, always read current file first
- **API key hashing** - Store ONLY hashed keys in DB, show plaintext only on creation
- **Testing backdoors dangerous** - Never include test bypasses in production code
- **Fake cache stats unacceptable** - In-memory cache doesn't work on serverless, be honest
- **Vercel env add doesn't work** - Use Vercel API directly for env vars in headless environments

### User Journey Must-Haves
1. Hero CTAs must work (link to real form)
2. Post-payment flow must be crystal clear
3. Dashboard must exist and function
4. Waitlist must save to database
5. Be honest about beta/limitations
6. Contact form must work (no exposed emails)

### Current Actual State (Updated 2025-09-26)
- **Website**: ✅ Live on Cloudflare Pages (safeprompt-website)
- **API**: ✅ Live on Vercel (safeprompt-api project)
- **Dashboard**: ✅ Updated to use profiles table
- **Payments**: ✅ Stripe webhook handlers created
- **Subscriptions**: ✅ Full management endpoints
- **Waitlist**: ✅ Working via consolidated /api/website endpoint
- **Contact Form**: ⚠️ Working but SafePrompt validation too strict (flagging normal messages)
- **Emails**: ✅ Resend configured (sends to info@safeprompt.dev)
- **Blog**: ✅ AI email attack prevention article at /blog/prevent-ai-email-attacks
- **Stripe Products**: ❌ Need manual creation in dashboard
- **Launch Ready**: 95% (validation tuning needed, Stripe live mode)

### 🚨 CRITICAL: Consolidated API Structure (2025-09-26)
**To stay within Vercel's 12-function limit, we consolidated endpoints:**

**Old structure** (removed):
- `/api/contact` - Separate contact form endpoint
- `/api/waitlist` - Separate waitlist endpoint

**New structure** (current):
- `/api/website` - Consolidated endpoint with action routing
  ```javascript
  POST /api/website
  {
    "action": "contact|waitlist",
    "data": { ... }
  }
  ```

**Frontend updated** to use new structure:
- Contact form: POST to `/api/website` with `action: "contact"`
- Waitlist form: POST to `/api/website` with `action: "waitlist"`

### 🔧 MODULE TYPE FIX (2025-09-26)
**Problem**: `/api/website` returned 500 FUNCTION_INVOCATION_FAILED
**Root Cause**: package.json had `"type": "module"` but code used CommonJS syntax
**Solution**: Converted all files to ESM syntax:
- Changed `require()` → `import`
- Changed `module.exports` → `export default`
- Changed `const { x } = require()` → `import { x } from`

**Status**: ✅ FIXED - API fully operational

## Development Commands

### Local Development
```bash
cd /home/projects/safeprompt

# API development
cd api && npm run dev

# Frontend development
cd frontend && npm run dev
```

### Deployment

#### CRITICAL: Deployment Architecture (Updated 2025-09-30)
**All SafePrompt services are deployed as follows:**
- **API**: Vercel Functions at api.safeprompt.dev
- **Website**: Cloudflare Pages at www.safeprompt.dev
- **Dashboard**: Vercel (Next.js app) at dashboard.safeprompt.dev

```bash
# Deploy API to Vercel
cd /home/projects/safeprompt/api
source /home/projects/.env
vercel --token="$VERCEL_TOKEN" --prod --yes
# Note: Token MUST be in quotes with = sign: --token="$TOKEN"
# Verify: Should show "projectName":"safeprompt-api" in .vercel/project.json

# Deploy WEBSITE to Cloudflare Pages
cd /home/projects/safeprompt/website
npm run build  # Builds to 'out' directory
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt --branch main --commit-dirty=true

# Deploy DASHBOARD to Vercel
cd /home/projects/safeprompt/dashboard
source /home/projects/.env
vercel --token="$VERCEL_TOKEN" --prod --yes
# Note: Dashboard requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars
cd /home/projects/safeprompt/dashboard
npm run build  # Builds to 'out' directory
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt-dashboard --branch main
```

**⚠️ IMPORTANT**:
- Dashboard is on Cloudflare Pages, NOT Vercel!
- All Next.js projects build to 'out' directory for static export
- API is the only service on Vercel (for serverless functions)

### Vercel Environment Variable Management (CRITICAL - Updated 2025-09-30)

**IMPORTANT**: Vercel CLI's `vercel env add` does NOT work in headless environments (prompts interactively).

**✅ WORKING METHOD - Use Vercel API directly:**

```bash
# Get correct project ID from .vercel/project.json (it changes on re-link!)
cd /home/projects/safeprompt/dashboard
PROJECT_ID=$(cat .vercel/project.json | grep projectId | cut -d'"' -f4)

# Add environment variable via API
source /home/projects/.env
source /home/projects/safeprompt/dashboard/.env.local  # Dashboard vars here!

curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"NEXT_PUBLIC_SUPABASE_URL\",\"value\":\"$NEXT_PUBLIC_SUPABASE_URL\",\"type\":\"plain\",\"target\":[\"production\",\"preview\",\"development\"]}"
```

**Common Pitfalls (2025-09-30 lessons):**
1. **"Project not found"** - Project ID in `.vercel/project.json` changes when you run `vercel` and it re-links
2. **"Missing token value"** - Use `--token="$VERCEL_TOKEN"` (quotes + equals) NOT `--token $VERCEL_TOKEN`
3. **Dashboard fails to build** - Needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
4. **Env vars in wrong file** - Dashboard vars are in `/dashboard/.env.local` NOT `/home/projects/.env`
```

## Important Context
- We own the prompt validation code from Ultra Brain project
- Existing code in `/home/projects/api/utils/` can be reused
- OpenRouter API key available in `/home/projects/.env`
- Stripe integration patterns available from syncup project
- **CRITICAL FILES TO KEEP**:
  - `api/api/v1/check-protected.js` - NEW profiles auth
  - `dashboard/src/app/api/stripe-webhook/` - Subscription handling
  - `dashboard/scripts/` - Database setup scripts
- **FILES TO DELETE** (old system):
  - Any references to api_keys table
  - Old stripe-webhook in api folder
  - Test files in production folders

## 🛡️ Threat Detection Research
**AI_MANIPULATION_TECHNIQUES.md** - The most comprehensive catalog of AI manipulation and jailbreak techniques compiled from global research. This file documents:
   - 70+ documented attack patterns with success rates
   - Research methodology for finding new vulnerabilities
   - Academic sources and real-world examples

**AI_MANIPULATION_REMEDIATION.md** - Detection and remediation strategies for AI manipulation attacks. This file contains:
   - Root cause analysis methodology (3 core attack concepts)
   - Current vs recommended AI validation prompts
   - Architecture decisions for indie developer market
   - The universal AI validator prompt (Version 2.0)

## 🧪 Testing Framework

### Test Suite Location
**`/home/projects/safeprompt/test-suite/`** - Comprehensive validation testing framework

### Test Dataset: `test-datasets.json`
- **3,000 test prompts** organized by category:
  - 1,000 legitimate (safe) - questions, business, programming, analysis
  - 1,000 malicious (unsafe) - instruction_override, hidden_instructions, encoding_tricks, role_manipulation
  - 1,000 mixed (edge cases) - boundary testing

### Test Scripts
- **`test-false-positives.js`** - Tests false positive/negative rates against full dataset
- **`test-ai-validation.js`** - Tests AI validation with actual API code
- **`test-all-free-models.js`** - Tests all free AI models available
- **`test-cheaper-models.js`** - Tests cost-effective model options
- **`generate-test-datasets.js`** - Generates new test data
- **`benchmark.js`** - Performance benchmarking
- **`benchmark-optimized.js`** - Optimized performance testing

### Running Tests
```bash
cd /home/projects/safeprompt/test-suite
npm install  # First time only

# Test regex validation only
node test-false-positives.js

# Test with AI validation (uses actual API code)
node test-ai-validation.js

# Benchmark performance
node benchmark.js

# Generate new test data
node generate-test-datasets.js
```

### Test Integration
Tests import actual SafePrompt API code directly:
- `import { validatePrompt } from '/home/projects/safeprompt/api/lib/prompt-validator.js'`
- `import { validateWithAI } from '/home/projects/safeprompt/api/lib/ai-validator.js'`

This ensures tests run against the exact live code, not mocked versions.
- All 7 Cialdini persuasion principles with success rates
- Role-playing & persona attacks (DAN variants)
- Encoding & obfuscation methods (Unicode, Base64, etc.)
- Context manipulation (many-shot jailbreaking)
- Multimodal attacks (image/audio injection)
- 35+ documented jailbreak techniques from DEF CON and security research
- OWASP Top 10 for LLMs (2025)
- Detection strategies and mitigation effectiveness

**Purpose**: This represents the sum of human knowledge on AI manipulation techniques, compiled from academic papers, security research, red team competitions, and industry reports. Critical for keeping SafePrompt ahead of evolving threats.

## When Making Changes

### Pre-Flight Checklist (MANDATORY):
- [ ] Does the backend for this feature exist?
- [ ] Have I tested every link/button I'm adding?
- [ ] Are all database columns I'm using real?
- [ ] Is demo/beta status clearly marked?
- [ ] Am I showing real data, not fake numbers?
- [ ] Are emails going through contact form, not exposed?

### 🚨 ANTI-PATTERNS TO AVOID (Critical - Read This!)
**These patterns have caused major credibility issues:**

1. **NEVER create links to non-existent resources:**
   - ❌ GitHub repos that don't exist
   - ❌ Social media accounts not created
   - ❌ API endpoints not implemented
   - ❌ Pages not built (/blog, /docs, etc.)
   - ✅ Only link to things that actually exist

2. **NEVER show fake/hardcoded metrics:**
   - ❌ `useState(1247)` for user counts
   - ❌ "342 threats blocked" as static text
   - ❌ Random number animations
   - ✅ Query real data or show "---" if none

3. **NEVER reference non-existent packages:**
   - ❌ `npm install @safeprompt/js` when not published
   - ❌ Import statements for packages not in package.json
   - ✅ Use direct HTTP/API examples until packages exist

4. **NEVER use placeholder implementations:**
   - ❌ `onClick={() => alert('Coming soon')}`
   - ❌ `console.log('Would send email')`
   - ❌ `// TODO: Implement` in production
   - ✅ Either implement it or remove the UI element

5. **NEVER expose internal details:**
   - ❌ `mailto:support@safeprompt.dev`
   - ❌ Showing real API keys even partially
   - ✅ Always use contact forms, never direct emails

### Development Rules:
1. Keep it simple - no over-engineering
2. **Backend first, UI second** - Never reverse this
3. Optimize for developer experience
4. Maintain <200ms response time target (validated at P95=67ms)
5. Document API changes in docs/API.md
6. Update this file with major decisions
7. **NO TEMPORAL FILES** - Update existing docs to reflect current state only
8. Test files go in `/home/projects/user-input/claude-safeprompt/`
9. Never reference historical states - document as deprecated if needed
10. **If it doesn't work, mark it as "Coming Soon" or remove it**
11. **ALL customer contact through safeprompt.dev/contact form**

## See Also
- `docs/TECHNICAL.md` - Implementation details
- `docs/BUSINESS.md` - Business strategy
- `docs/API.md` - API reference
- `docs/REALITY_CHECK.md` - Critical issues and validation requirements

## IMPORTANT: Documentation Reading Requirement
**ALL AI assistants working on this project MUST read ALL documents in the `/home/projects/safeprompt/docs/` folder before making any changes or recommendations.** These documents contain critical context about:
- Technical architecture and constraints
- Business model viability issues
- Performance reality checks
- Unit economics that need validation
- Go/no-go decision criteria

Failure to read these documents will result in repeating mistakes and building on false assumptions.

## 📚 Why AIs Miss Critical Knowledge (Lesson from 2025-09-25)
Even when deployment instructions exist in CLAUDE.md, they may be incomplete or lack critical details. Always:
1. **Test deployment commands fully** - Don't assume they work
2. **Check for multiple projects** - Vercel/Cloudflare can have duplicates
3. **Verify domain routing** - Deployment success ≠ accessible on custom domain
4. **Document pitfalls immediately** - Add to CLAUDE.md when discovered
5. **Use context7 for current docs** - Platform APIs change frequently

## 🎨 Website & Dashboard Design Philosophy (Added 2025-09-25)

### Website Design Principles
**Purpose**: Marketing site to convert visitors to trial users

1. **Timeless Over Trendy**
   - ❌ "New Features Just Launched!" sections (looks dated quickly)
   - ✅ "Enterprise-Ready Features" (evergreen positioning)
   - ❌ Mixing old and new features in separate sections (Frankenstein look)
   - ✅ One unified features grid showcasing all capabilities

2. **Clean Information Architecture**
   - Hero → Problem Education → Who Needs This → Core Features → Simple Integration → Pricing
   - Don't duplicate features across sections
   - Don't show complex code examples on marketing site
   - Point to dashboard for advanced features

3. **Integration Examples**
   - Website: ONE simple curl example showing basic usage
   - Dashboard: Full code examples in multiple languages + batch API
   - Reasoning: Developers already convinced by the time they're in dashboard

### Dashboard Design Principles
**Purpose**: Developer workspace for actual implementation

1. **Dashboard is the Developer Manual**
   - Full code examples in multiple languages
   - Advanced features documentation (batch API, caching)
   - Actual API key integration in examples when logged in
   - This is where complexity belongs, not marketing site

2. **Progressive Disclosure**
   - Basic examples first (curl, JS, Python)
   - Advanced features section below (batch, caching)
   - Help links at bottom

### Critical Lesson: Feature Presentation
When adding new capabilities:
- ❌ DON'T bolt on "New Features" sections to existing pages
- ❌ DON'T duplicate similar features across multiple sections
- ❌ DON'T mix marketing (website) with implementation (dashboard)
- ✅ DO integrate features naturally into existing information flow
- ✅ DO keep marketing simple, implementation detailed
- ✅ DO maintain clear separation of concerns

### The Frankenstein Problem
**What happened**: Added new features section + kept old features section + added code examples = messy
**Solution**: Unified features grid, moved code to dashboard, kept website clean
**Rule**: When user says design looks "Frankenstein" or "cobbled together", they mean too many separate sections that should be unified

## 🎯 Target Audience Messaging (Critical Lesson 2025-09-25)

### The Enterprise Trap
**Problem**: Using "Enterprise-Ready Features" scared indie developers into thinking the product was complex
**Solution**: Changed to "Simple API, Powerful Features" with "Built for indie developers" messaging
**Key Insight**: Lead with simplicity, let enterprise features be a bonus, not a barrier

### Compliance Claims Caution
**Problem**: Claiming HIPAA/SOC2/GDPR compliance without certification is risky
**Solution**:
- Changed "Compliance Ready" to "Export Reports"
- Added "(coming soon)" or "(Beta)" labels
- CSV exports include disclaimer: "Working toward compliance certifications"
**Rule**: Never claim compliance without actual certification. Flag as "under development" to gather feedback

### Messaging Hierarchy for Target Demographics

#### For Vibe Coders & New Developers:
1. **Primary**: "Drop it in and ship" - One line of code, zero complexity
2. **Secondary**: "We handle the scary security stuff" - Protection without paranoia
3. **Tertiary**: "Grows with you" - From side project to startup

#### Content Tone Guidelines:
- **Do**: Use casual language, practical examples, "here's what could happen" scenarios
- **Don't**: Academic security theory, enterprise jargon, fear-mongering
- **Hook examples for this audience**:
  - "Ship your AI app without getting pwned"
  - "That sketchy user input? We catch it"
  - "Security that doesn't slow you down"
  - "Built by developers who hate complex APIs"

#### Blog Post Optimization for Demographics:
- Lead with relatable scenarios ("You just shipped your AI app...")
- Use their language ("prompt injection" not "adversarial input manipulation")
- Show don't tell - quick wins, not deep theory
- Code examples they can copy-paste, not architecture diagrams
- Social proof from indie hackers, not Fortune 500

**Never lead with enterprise** - it scares away solo developers who think they need a team to use it

## 🔄 Feature Rollout Strategy (Learned 2025-09-25)

### When Adding New Features
1. **Research Phase**: Deep investigation without scope creep
2. **Prioritization**: Choose high-value, easy-to-implement features
3. **Implementation**: Backend first, then UI
4. **Integration**: Merge naturally into existing sections (avoid "New!" badges)
5. **Documentation**: Details in dashboard, simplicity on website

### Features Implemented in Phase 19
- ✅ Intelligent caching (30% cost reduction)
- ✅ Batch validation API (100 prompts/request)
- ✅ Usage reports (CSV export with metrics)
- ✅ Cache statistics tracking

### What NOT to Build (Scope Creep Examples)
- ❌ Webhook notifications (nice-to-have, not critical)
- ❌ Custom threat policies (complexity without clear value)
- ❌ Real-time threat feeds (operational overhead)
- ✅ Focus on: Speed, simplicity, cost savings

## 📝 Blog Development Patterns (Added 2025-09-26)

### Blog Component Architecture
**Location**: `/website/app/blog/` - Each post is a React component, NOT markdown

### Reusable Blog Components
Create standardized components in `/website/components/blog/`:
- **References.tsx** - Standardized reference sections with consistent styling
- **CodeBlock.tsx** - Syntax-highlighted code blocks
- **CodeTabs.tsx** - Multi-language code examples
- **ProofOfConceptBox.tsx** - Highlight real incidents/research

### CSS Pitfalls & Fixes
**Double-bullet/checkmark rendering bug**:
- **Problem**: `list-disc` in globals.css causes double bullets when using manual bullet characters
- **Solution**: Use `list-none` for blog content, add manual bullets in content
- **Location**: `/website/app/globals.css` lines 121-136

### Blog Content Strategy for Target Audience
**For Vibe Coders (primary demographic)**:
- Lead with emotional hook, not technical details
- Use "Ship Fast, Get Hacked" style headlines
- Include copy-pasteable code (60-100 lines max)
- Reference real incidents (Chevrolet $1 car, Air Canada lawsuit)
- Avoid academic language and complex architecture diagrams

### Blog Deployment
```bash
cd /home/projects/safeprompt/website
npm run build  # Builds to 'out' directory
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt --branch main
```

### Common Blog Mistakes to Avoid
- ❌ Claiming "one line fix" when it's 60+ lines
- ❌ Using "Part 1, Part 2" headers (confusing)
- ❌ Fabricating statistics or incidents
- ❌ Leading with technical details before problem
- ✅ Use real incidents with sources
- ✅ Lead with relatable scenarios
- ✅ Clear, numbered steps with accurate time estimates
- ✅ Standardize components across all posts

## 🚨 CRITICAL: Blog AEO Implementation Lessons (2025-09-27)

### The Great Next.js JSX Compilation Battle - FULLY UNDERSTOOD!
**Problem**: Blog components failed with "Unexpected token" while simple pages worked fine
**Initial Investigation Time**: 3+ hours
**Root Cause Discovered**: Component complexity threshold in Next.js static export
**Solution**: Dynamic imports with SSR disabled for complex blog components

### 🔍 WHY BLOGS FAILED BUT OTHER PAGES WORKED

**Simple Pages (About, Contact) - Work Fine**:
- Import basic components: `import Header from '@/components/Header'`
- Flat component structure with no complex nesting
- Simple props and minimal internal logic
- Next.js static analysis handles these easily

**Blog Pages - Required Dynamic Imports**:
- Already use complex `BlogLayout` wrapper component
- Import multiple specialized components (CodeBlock, CodeTabs, References)
- Adding more complexity (AEOLayout) exceeds static analysis capability
- Deep component nesting breaks JSX compilation

**Component Complexity Threshold Discovery (2025-09-27)**:
After extensive testing, we discovered Next.js static export has an undocumented complexity threshold:
- **Threshold triggers**: ~4-5 levels of component nesting + specialized components
- **Error manifests as**: "Unexpected token [ComponentName]" during build
- **Only affects**: Static export mode (not dev mode or SSR)
- **Root cause**: Next.js static analyzer can't resolve deep component dependencies
- **Solution**: Dynamic imports bypass static analysis entirely

**The Pattern**:
```jsx
// ✅ WORKS: Simple pages
import Header from '@/components/Header'  // Simple, flat component

// ❌ FAILS: Complex blog components
import BlogLayout from '@/components/blog/BlogLayout'  // Complex wrapper
import { ComparisonTable } from '@/components/blog/AEOLayout'  // Too much nesting

// ✅ SOLUTION: Dynamic imports for blog components
const ComparisonTable = dynamic(
  () => import('@/components/blog/AEOLayout').then(mod => mod.ComparisonTable),
  { ssr: false }
)
```

**Key Insight**: Next.js static export has a complexity threshold. Once your component tree gets too deep or imports too many specialized components, you MUST use dynamic imports.

### What Failed Initially
- ❌ Creating separate AEOLayout component with default export
- ❌ Importing AEOLayout directly into blog posts
- ❌ Adding React imports explicitly (didn't help)
- ❌ Changing file extensions to .jsx
- ❌ Wrapping returns in different parentheses patterns

### ✅ THE WORKING SOLUTION (Confirmed 2025-09-27)
**Complete Working Implementation - Successfully Deployed to Production:**

```jsx
'use client'

import dynamic from 'next/dynamic'
import { AlertTriangle, Shield, TrendingUp, Zap } from 'lucide-react'

// MANDATORY: ALL blog components must use dynamic imports
const BlogLayout = dynamic(() => import('@/components/blog/BlogLayout'), { ssr: false })
const CodeBlock = dynamic(() => import('@/components/blog/CodeBlock'), { ssr: false })
const CodeTabs = dynamic(() => import('@/components/blog/CodeTabs'), { ssr: false })
const ReferenceSection = dynamic(() => import('@/components/blog/References'), { ssr: false })

// AEO Components with named exports
const DirectAnswerBox = dynamic(
  () => import('@/components/blog/AEOComponents').then(mod => mod.DirectAnswerBox),
  { ssr: false }
)
const LastUpdated = dynamic(
  () => import('@/components/blog/AEOComponents').then(mod => mod.LastUpdated),
  { ssr: false }
)
const QuickFacts = dynamic(
  () => import('@/components/blog/AEOComponents').then(mod => mod.QuickFacts),
  { ssr: false }
)
const ComparisonTable = dynamic(
  () => import('@/components/blog/AEOComponents').then(mod => mod.ComparisonTable),
  { ssr: false }
)

export default function BlogPost() {
  return (
    <BlogLayout meta={blogMeta}>
      <div className="blog-content">
        <DirectAnswerBox answer="50-word complete answer for AI systems" />
        <LastUpdated date="September 27, 2025" />
        <QuickFacts facts={[{icon: <Zap />, label: "Risk", value: "Critical"}]} />
        <ComparisonTable headers={['Col1', 'Col2']} rows={[['Data1', 'Data2']]} />
        {/* Blog content continues */}
      </div>
    </BlogLayout>
  )
}
```

**Critical Implementation Rules:**
1. **EVERY import in blog pages must be dynamic** - No exceptions
2. **Must include `{ ssr: false }`** for all dynamic imports
3. **Named exports require `.then(mod => mod.ComponentName)`**
4. **Icons can be imported normally** (lucide-react icons are simple enough)

### What Still Works (Simple Fallback)
- ✅ Keep using BlogLayout (always works)
- ✅ Add AEO elements inline within BlogLayout children
- ✅ Create simple reusable components without complex imports
- ✅ Comment out problematic imports rather than fight them

### AEO Elements to Include (inline, not as component)
When optimizing for AI Engine Optimization:
```jsx
// Add these directly in the blog post component, NOT as separate layout
<div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/50 rounded-xl p-6 mb-6">
  <h2 className="text-lg font-bold mb-2 text-white">Direct Answer</h2>
  <p className="text-white">[50-word complete answer]</p>
</div>

<div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
  <Calendar className="w-4 h-4" />
  <span>Last updated: September 27, 2025</span>
</div>

// Quick facts, cost analysis, etc. - all inline
```

### Date Management Critical Issue
**Problem**: Blogs showing dates from the past (January 2025 when today is September 2025)
**Impact**: Makes content look stale, reduces trust
**Solution**: ALWAYS check current date from <env> block
**Files to Update**:
- `/website/app/blog/[slug]/page.tsx` - Blog post dates
- `/website/app/blog/page.tsx` - Blog listing dates

### Build and Deploy Reality Check
```bash
# CORRECT deployment sequence that actually works
cd /home/projects/safeprompt/website
npm run build  # Creates 'out' directory, NOT 'dist'!
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt --branch main

# Common errors:
# "no such directory 'dist'" - Next.js builds to 'out'
# "Unexpected token BlogLayout" - JSX compilation issue, revert to working version
```

### Component Import Limitations
**Cannot use these patterns in blog posts**:
- `import { ComparisonTable } from '@/components/blog/AEOLayout'` - Causes JSX errors
- Complex component compositions with multiple imports

**Must use inline HTML tables instead**:
```jsx
<div className="overflow-x-auto my-8">
  <table className="w-full border-collapse">
    {/* Full HTML table structure */}
  </table>
</div>
```

### The Revert Pattern (When Nothing Works)
```bash
# When build keeps failing after multiple attempts:
git checkout -- app/blog/chatbot-hacks/page.tsx
git checkout -- app/blog/prevent-ai-email-attacks/page.tsx
# Start over with working version, make smaller changes
```

### Time-Saving Rules for Future AIs
1. **If JSX build error persists after 3 attempts** - Revert and use simpler approach
2. **Never fight Next.js static export** - It has undocumented limitations
3. **Test blog components in isolation first** - Create test file, verify it builds
4. **Keep blog posts simple** - BlogLayout + inline content works reliably
5. **Don't create new layout components** - Reuse what exists
6. **Always verify dates** - Check <env> block for current date, not your training data

### What Success Looks Like
- Build completes without errors
- Deployment to Cloudflare Pages succeeds
- Blog posts show current dates (September 2025, not January)
- All reference links work
- Code examples are copy-pasteable
- No double bullets/checkmarks in lists

## 🚨 CRITICAL: Cloudflare Pages Deployment & Caching (2025-09-27)

### The Homepage Header Component Trap
**Problem**: Homepage was using inline navigation instead of importing Header component
**Symptom**: Changes to Header.tsx didn't appear on homepage
**Root Cause**: `/app/page.tsx` had its own `<nav>` element duplicating Header code
**Solution**: Import and use `<Header />` component instead of inline navigation
**Lesson**: ALWAYS check if pages are using shared components vs inline code

### Cloudflare Pages Caching Issues
**Problem**: Deployed changes not visible on main domain but visible on preview URLs
**Example**: https://safeprompt.dev showed old content, https://xxx.safeprompt.pages.dev showed new
**Solution Process**:
1. Deploy with `--commit-dirty true` flag for uncommitted changes
2. Purge Cloudflare cache if changes don't appear
3. Verify on preview URL first, then main domain

### Cache Purging Command
```bash
# Get zone ID for domain (safeprompt.dev zone: 294a40cddf0a0ad4deec2747c6aa34f8)
source /home/projects/.env
curl -X POST "https://api.cloudflare.com/client/v4/zones/294a40cddf0a0ad4deec2747c6aa34f8/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### Complete Deployment Process When Changes Don't Appear
```bash
# 1. Clean build (if suspecting build cache issues)
cd /home/projects/safeprompt/website
rm -rf .next out
npm run build

# 2. Deploy with commit-dirty flag
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy out --project-name safeprompt --branch main --commit-dirty true

# 3. Check preview URL first (shown in deployment output)
# Example: https://07a7bf34.safeprompt.pages.dev

# 4. If preview is correct but main domain isn't, purge cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/294a40cddf0a0ad4deec2747c6aa34f8/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# 5. Wait 5-10 seconds for cache to clear
# 6. Verify with cache-busting parameter
curl -s 'https://safeprompt.dev?v=2' | grep -o "text-to-search"
```

### Custom Domain Configuration
**Issue**: safeprompt.dev (non-www) stopped working after deployment
**Cause**: Domain wasn't added to Cloudflare Pages project
**Fix**: Add custom domain to Pages project
```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/c2b6e426cc1d525fe1001af818d7c77d/pages/projects/safeprompt/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name": "safeprompt.dev"}'
```

### Key Lessons Learned
1. **Always verify component usage**: Check if pages import shared components or duplicate code
2. **Preview URLs are truth**: If preview URL is correct but main isn't, it's a caching issue
3. **Cache purging is often needed**: Cloudflare aggressively caches, manual purge may be required
4. **Both www and non-www need configuration**: Each domain must be explicitly added to Pages project
5. **Use --commit-dirty flag**: When deploying with uncommitted changes (like after clean build)

## 📚 COMPREHENSIVE BLOG ARCHITECTURE KNOWLEDGE (2025-09-27)

### The Complete Journey
**Problem**: Blog components causing "Unexpected token" errors during static export
**Investigation Time**: 5+ hours across multiple attempts
**Root Cause**: Next.js static export component complexity threshold
**Solution**: Dynamic imports with SSR disabled for all blog components

### What We Discovered
1. **Next.js has an undocumented complexity threshold** for static exports
2. **Simple pages work** because they use flat, basic components
3. **Blog pages fail** when BlogLayout + specialized components exceed threshold
4. **Dynamic imports bypass** the static analyzer entirely
5. **Named exports work better** than default exports for dynamic imports

### The Production-Tested Solution
Every blog page now uses this exact pattern (working in production):
- ALL components imported dynamically with `{ ssr: false }`
- AEO components created in `/components/blog/AEOComponents.tsx`
- Named exports for better dynamic import compatibility
- Icons can be imported normally (simple enough to not trigger threshold)

### Files Created/Modified
- **Created**: `/website/components/blog/AEOComponents.tsx` - Reusable AEO components
- **Updated**: `/website/app/blog/prevent-ai-email-attacks/page.tsx` - Dynamic imports + AEO
- **Updated**: `/website/app/blog/chatbot-hacks/page.tsx` - Dynamic imports + AEO
- **Fixed**: `/website/app/globals.css` - Removed list-disc causing double bullets

### Deployment Success
- Build tested: ✅ All pages compile without errors
- Deployed to: safeprompt.dev via Cloudflare Pages
- Both blogs live with AEO optimization
- No JSX compilation errors

### Value for Future AIs
When you see "Unexpected token [ComponentName]" in Next.js static export:
1. **Don't waste time on**: file extensions, React imports, parentheses patterns
2. **Immediately use**: dynamic imports with SSR disabled
3. **Follow the pattern**: exactly as documented above
4. **It's production-tested**: This solution is running live at safeprompt.dev

This knowledge represents 5+ hours of debugging condensed into a working solution.