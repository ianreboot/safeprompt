# SafePrompt - AI Assistant Instructions

## Project Overview
SafePrompt is a developer-first API service that prevents prompt injection attacks in AI applications. We provide a simple, fast, and transparent solution for developers who need to secure their LLM-powered features without complexity or enterprise sales cycles.

**Domain**: safeprompt.dev
**Repository**: https://github.com/ianreboot/safeprompt.git
**Status**: MVP Complete - Ready for Beta Testing (January 2025)

## Core Value Proposition
"Stop prompt injection in one line of code"
- **Fast**: <100ms response time (regex: 5ms, AI validation: 50-100ms)
- **Simple**: Single API endpoint, clear documentation
- **Transparent**: Public pricing, no sales calls
- **Accurate**: Multi-layer validation with confidence scoring

## Technical Architecture

### Stack
- **Frontend**: Next.js + Tailwind → Cloudflare Pages
- **API**: Vercel Functions (stateless validation endpoints)
- **Database**: Supabase PostgreSQL (profiles table linked to auth.users)
- **AI**: OpenRouter (multi-model strategy for cost optimization)
- **Payments**: Stripe (direct API checks, no data duplication)

### Validation Pipeline
1. **Regex Patterns** - Fast first pass (5ms) from `/home/projects/api/utils/prompt-validator.js`
2. **Confidence Scoring** - Determine if AI validation needed
3. **AI Validation** - Only when confidence is uncertain (OpenRouter with tiered models)
4. **Response** - Safe/unsafe verdict with confidence score

### Key Decisions Made
- **No WASM sandboxing** - Unnecessary complexity for MVP
- **Tiered AI models** - Start with cheapest (GPT-3.5), upgrade as needed
- **30-day log retention** - Balance between debugging and privacy
- **No enterprise features initially** - Focus on individual developers

## Business Strategy

### Target Customer
**Primary**: Individual developers building AI side projects
**Secondary**: Small startups (pre-Series A) adding AI features
**Anti-target**: Large enterprises wanting complex integrations

### Pricing Model
- **Free**: 10,000 validations/month
- **Starter**: $29/month - 100,000 validations
- **Pro**: $99/month - 1,000,000 validations
- **Scale**: $499/month - 10,000,000 validations

### Competitive Positioning
Unlike Lakera (enterprise) and Rebuff (open source), we focus on:
- Transparent pricing (no "contact sales")
- Developer experience (npm install → working in 30 seconds)
- Speed + accuracy balance (not paranoid mode by default)

## Current Implementation Status

### Completed
- [x] Domain registered: safeprompt.dev
- [x] API endpoint structure: api.safeprompt.dev (needs implementation)
- [x] Website deployed: safeprompt.dev (Cloudflare Pages)
- [x] Dashboard deployed: dashboard.safeprompt.dev (Cloudflare Pages)
- [x] Admin Dashboard: dashboard.safeprompt.dev/admin (restricted access)
- [x] Demo user: demo@safeprompt.dev / demo123 (preview mode)

### Completed (January 2025)
- [x] Validation engine implementation (check-protected-new.js)
- [x] Supabase trigger for auto profile creation
- [x] Stripe webhook integration (dashboard/api/stripe-webhook)
- [x] API key generation and validation
- [x] Usage tracking and rate limiting
- [x] Subscription management endpoints
- [x] Waitlist approval workflow
- [x] User lifecycle testing suite

### Pending Configuration
- [ ] Create Stripe products and update price IDs
- [ ] Configure Resend for email notifications
- [ ] Deploy new API endpoints to production
- [ ] Run database migration scripts in Supabase

### Ready for Beta
- All core systems operational
- Dashboard provides self-service API key management
- Payment flow automated via Stripe webhook
- Clear documentation and onboarding flow

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

### Next Steps for Launch
1. **Enable Production Mode** - Switch Stripe from test to live mode
2. **Marketing Launch** - Announce on Twitter, HN, Product Hunt
3. **Monitor First Users** - Watch for issues, gather feedback
4. **Iterate Based on Feedback** - Quick fixes and improvements
5. **Scale Infrastructure** - Optimize as usage grows

## Lessons Learned (Critical for Future Development)

### What NOT to Build (Mistakes Made)
- ❌ Fake npm packages (`@safeprompt/js` doesn't exist)
- ❌ Complex user tables duplicating Stripe data
- ❌ Hardcoded metrics (waitlist counter was fake)
- ❌ Links to non-existent pages (/docs, /api/health)
- ❌ Non-functional features presented as working

### Correct Patterns
- ✅ Use HTTP/curl examples until SDK actually exists
- ✅ Minimal profiles table linked to auth.users
- ✅ Check Stripe API directly for subscription status
- ✅ Clear demo mode indicators for preview accounts
- ✅ Inline documentation when dedicated pages don't exist

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
├── website/           # Next.js marketing website
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

### ALWAYS DO THIS:
1. **Build backend → Test → Add UI** (in that order)
2. **Mark demo/beta clearly** with banners/badges
3. **Test every link and button** before committing
4. **Check database schema** before writing queries
5. **Use real data** or clearly marked test data

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

### Hard-Won Technical Knowledge
- **Only Google Gemini FREE works** - 47 other "free" models failed
- **Vercel tokens expire** - Need periodic refresh
- **CORS headers mandatory** - Every API endpoint needs them
- **Cloudflare deploy** - Use `--commit-dirty=true` for uncommitted
- **Don't email API keys** - Security risk, use dashboard
- **Git filter-branch works** - Removes large files from history
- **Supabase env vars** - Use SAFEPROMPT_ prefix to avoid conflicts

### User Journey Must-Haves
1. Hero CTAs must work (link to real form)
2. Post-payment flow must be crystal clear
3. Dashboard must exist and function
4. Waitlist must save to database
5. Be honest about beta/limitations

### Current Actual State (Post-Migration)
- **Website**: ✅ Live, honest, functional
- **API**: ✅ New profiles-based auth working
- **Dashboard**: ✅ Updated to use profiles table
- **Payments**: ✅ Stripe webhook handlers created
- **Subscriptions**: ✅ Full management endpoints
- **Waitlist**: ✅ Approval workflow implemented
- **Emails**: ❌ Resend not configured (manual setup needed)
- **Stripe Products**: ❌ Need manual creation in dashboard
- **Launch Ready**: 85% (just needs Stripe/Resend config)

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
```bash
# Deploy API to Vercel
cd api && source /home/projects/.env
vercel --prod --token $VERCEL_TOKEN --yes

# Deploy frontend to Cloudflare Pages
cd frontend && npm run build
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy dist --project-name safeprompt --branch main
```

### Vercel Environment Variable Management
```bash
# Add environment variables to Vercel (Claude has access)
source /home/projects/.env
# Use Vercel API directly for env vars
curl -X POST "https://api.vercel.com/v9/projects/{PROJECT_ID}/env?upsert=true" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"key": "VAR_NAME", "value": "'$VAR_VALUE'", "target": ["production"], "type": "encrypted"}]'

# Note: Claude has successfully added env vars to Vercel before
# All keys are in /home/projects/.env
# Use context7 for Vercel API docs if stuck
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

## When Making Changes

### Pre-Flight Checklist (MANDATORY):
- [ ] Does the backend for this feature exist?
- [ ] Have I tested every link/button I'm adding?
- [ ] Are all database columns I'm using real?
- [ ] Is demo/beta status clearly marked?
- [ ] Am I showing real data, not fake numbers?

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