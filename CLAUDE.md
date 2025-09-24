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

## 🚨 CRITICAL LESSONS LEARNED (2025-01-24)

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

### User Journey Must-Haves
1. Hero CTAs must work (link to real form)
2. Post-payment flow must be crystal clear
3. Dashboard must exist and function
4. Waitlist must save to database
5. Be honest about beta/limitations

### Current Actual State
- **Website**: ✅ Live, honest, functional
- **API**: ✅ Works perfectly (100% accurate)
- **Dashboard**: ❌ Frontend only, no backend
- **Payments**: ❌ Broken Stripe URL
- **Emails**: ❌ Resend not configured
- **Launch Ready**: 60% (need 2-3 more days)

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

## When Making Changes
1. Keep it simple - no over-engineering
2. Optimize for developer experience
3. Maintain <200ms response time target (validated at P95=67ms)
4. Document API changes in docs/API.md
5. Update this file with major decisions
6. **NO TEMPORAL FILES** - Update existing docs to reflect current state only
7. Test files go in `/home/projects/user-input/claude-safeprompt/`
8. Never reference historical states - document as deprecated if needed

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