# SafePrompt Architecture Map

**Purpose**: Quick navigation guide for AI assistants to understand the codebase without reading every file.
**Last Updated**: 2025-01-24

## 🎯 System Overview

SafePrompt is a prompt injection detection API that validates user input before it reaches AI models.

**Core Flow**: User Input → Regex Check (5ms) → Confidence Score → AI Validation (1s, if needed) → Response

## 📊 Request Flows

### 1. Customer Acquisition Flow
```
User lands on safeprompt.dev
  ↓
Clicks "Join Waitlist" or "Get Instant Access"
  ↓
Form submission → api/waitlist.js
  ↓
Saves to Supabase waitlist table
  ↓
Admin approves → dashboard/api/waitlist/approve
  ↓
Account created with temp password
```

### 2. Payment & Account Creation Flow (UPDATED Jan 2025)
```
Stripe Checkout Session
  ↓
Payment Success
  ↓
Webhook: dashboard/src/app/api/stripe-webhook/route.ts
  ↓
handleCheckoutComplete() - Creates/updates user
  ↓
Profiles table updated with stripe_customer_id
  ↓
Automatic API key in profile (via trigger)
  ↓
Welcome email (TODO: Resend integration)
```

### 3. API Validation Flow
```
Developer sends request with API key
  ↓
api/v1/check-protected-new.js (profiles table auth)
  OR
api/v1/check.js (no auth, regex only)
  OR
api/v1/check-with-ai.js (AI validation)
  ↓
lib/prompt-validator.js (threat patterns)
  ↓
If confidence < 0.8:
  lib/ai-validator.js (Gemini/OpenRouter)
  ↓
Response: {safe: boolean, confidence: number, threats: []}
```

## 📁 Key Files & Their Purpose

### API Endpoints - CONSOLIDATED (2025-09-25)

⚠️ **CRITICAL**: We consolidated from 14 endpoints to 5 to fix Vercel's 12-function limit on Hobby plan.

#### Current Consolidated Endpoints (`/home/projects/safeprompt/api/`)
| File | Purpose | Old Endpoints Replaced | Status |
|------|---------|------------------------|--------|
| `admin.js` | System management | `health.js`, `status.js`, `cache-stats.js`, `user/api-key.js` | ✅ Active |
| `v1/validate.js` | All validation modes | `v1/check.js`, `v1/check-optimized.js`, `v1/check-protected.js`, `v1/check-with-ai.js`, `v1/batch-check.js` | ✅ Active |
| `webhooks.js` | External webhooks | `v1/stripe-webhook.js` | ✅ Active |
| `contact.js` | Contact form | (unchanged) | ✅ Active |
| `waitlist.js` | Waitlist signups | (unchanged) | ✅ Active |

#### Endpoint Mapping Guide

**Health & Status:**
- OLD: `GET /api/health` → NEW: `GET /api/admin?action=health`
- OLD: `GET /api/status` → NEW: `GET /api/admin?action=status`
- OLD: `GET /api/v1/cache-stats` → NEW: `GET /api/admin?action=cache`

**User Management:**
- OLD: `GET /api/user/api-key` → NEW: `GET /api/admin?action=user-api-key` (requires Bearer token)
- OLD: `POST /api/user/api-key` → NEW: `POST /api/admin?action=user-api-key&operation=regenerate`

**Validation:**
- OLD: `POST /api/v1/check` → NEW: `POST /api/v1/validate`
- OLD: `POST /api/v1/check-optimized` → NEW: `POST /api/v1/validate` with `mode: "optimized"`
- OLD: `POST /api/v1/check-with-ai` → NEW: `POST /api/v1/validate` with `mode: "ai-only"`
- OLD: `POST /api/v1/batch-check` → NEW: `POST /api/v1/validate` with `prompts: []` array

**Webhooks:**
- OLD: `POST /api/v1/stripe-webhook` → NEW: `POST /api/webhooks?source=stripe`

#### REMOVED Endpoints (No Longer Exist)
- `/api/v1/check.js` - Use `/api/v1/validate` instead
- `/api/v1/check-optimized.js` - Use `/api/v1/validate` with mode parameter
- `/api/v1/check-protected.js` - Use `/api/v1/validate` with API key
- `/api/v1/check-with-ai.js` - Use `/api/v1/validate` with mode: "ai-only"
- `/api/v1/batch-check.js` - Use `/api/v1/validate` with prompts array
- `/api/v1/cache-stats.js` - Use `/api/admin?action=cache`
- `/api/v1/stripe-webhook.js` - Use `/api/webhooks?source=stripe`
- `/api/health.js` - Use `/api/admin?action=health`
- `/api/status.js` - Use `/api/admin?action=status`
- `/api/user/api-key.js` - Use `/api/admin?action=user-api-key`

### Core Libraries (`/api/lib/`)
| File | Purpose | Critical Lines |
|------|---------|----------------|
| `prompt-validator.js` | Regex pattern matching | Threat patterns array |
| `ai-validator.js` | AI model integration | Gemini config |
| `cache-manager.js` | LRU cache for responses | Cache configuration |

### Website Components (`/website/`)
| Component | Purpose | Location |
|-----------|---------|----------|
| `AttackTheater` | Animated threat demo | app/components/AttackTheater.tsx |
| `WaitlistForm` | Email capture | app/components/WaitlistForm.tsx |
| `MetricsDashboard` | Live stats display | app/components/MetricsDashboard.tsx |

### Dashboard Components (`/dashboard/`)
| Page | Purpose | Location |
|------|---------|----------|
| `/` | Main dashboard with API keys | src/app/page.tsx |
| `/login` | Authentication page | src/app/login/page.tsx |
| `/admin` | Admin panel | src/app/admin/page.tsx |

## 🗄️ Database Structure (CURRENT - Jan 2025)

### Active Tables
```sql
-- Core user system
profiles
  - id (uuid, FK → auth.users)
  - email (unique)
  - api_key (unique, auto-generated)
  - stripe_customer_id
  - subscription_status (free/active/canceled)
  - subscription_plan_id (FK → subscription_plans)
  - api_calls_this_month
  - is_active (boolean)

-- Usage tracking
api_logs
  - profile_id (FK → profiles)
  - endpoint
  - prompt_length
  - response_time_ms
  - created_at

-- Subscription management
subscription_plans
  - stripe_price_id (PK)
  - name
  - api_calls_limit
  - price_cents
  - features (jsonb)

subscription_history
  - profile_id (FK)
  - action (created/upgraded/downgraded/canceled)
  - from_plan_id
  - to_plan_id
  - created_at

-- Beta management
waitlist
  - email (unique)
  - converted_to_profile_id (FK → profiles)
  - approved_at
  - created_at
```

### Deprecated Tables (TO REMOVE)
- `api_keys` - Replaced by profiles.api_key
- `users` - Replaced by profiles
- `validation_logs` - Replaced by api_logs

## 🔑 Environment Variables

### Required for Core Function
```bash
# Database (Supabase)
SAFEPROMPT_SUPABASE_URL
SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# AI Validation
OPENROUTER_API_KEY

# Payments
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Email (TODO)
RESEND_API_KEY

# App URLs
NEXT_PUBLIC_APP_URL=https://dashboard.safeprompt.dev
```

## 🚀 Deployment Status

### Deployed & Running

**Production Environment:**
- Website: safeprompt.dev (Cloudflare Pages: safeprompt)
- Dashboard: dashboard.safeprompt.dev (Cloudflare Pages: safeprompt-dashboard)
- API: api.safeprompt.dev (Vercel: safeprompt-api)
- Database: adyfhzbcsqzgqvyimycv (Supabase)

**Development Environment:**
- Website: dev.safeprompt.dev (Cloudflare Pages: safeprompt-dev)
- Dashboard: dev-dashboard.safeprompt.dev (Cloudflare Pages: safeprompt-dashboard-dev)
- API: dev-api.safeprompt.dev (Vercel: safeprompt-api-dev)
- Database: vkyggknknyfallmnrmfu (Supabase)

### Pending Setup
- [ ] Create Stripe products and update price IDs
- [ ] Configure Resend for email notifications
- [ ] Deploy check-protected-new.js as main endpoint
- [ ] Run database migrations in Supabase
- [ ] Remove old tables after migration verified

## 🎯 Critical Path to Production

1. **Database Migration** (30 min)
   - Run scripts in dashboard/database/
   - Verify triggers work

2. **API Deployment** (15 min)
   - Rename check-protected-new.js → check-protected.js
   - Remove old endpoints
   - Deploy to Vercel

3. **Stripe Setup** (1 hour)
   - Create products in Stripe dashboard
   - Update price IDs in subscription_plans table
   - Test webhook with ngrok

4. **Email Setup** (30 min)
   - Configure Resend
   - Test welcome emails
   - Test payment receipts

## 💡 Hard-Won Knowledge

### What Works
- Profiles table linked to auth.users via trigger
- API keys stored directly (consider hashing for production)
- Stripe customer ID as foreign key (don't duplicate subscription data)
- Single source of truth for each data type

### What Doesn't Work
- Separate api_keys table (sync issues)
- Duplicating Stripe data locally (stale data)
- Complex user/profile relationships (unnecessary)
- Hashing API keys too early (debugging nightmare)

### Performance Optimizations
- Regex validation first (5ms) before AI (1000ms)
- Cache results by prompt hash
- Use cheapest AI model that works (Gemini free tier)
- Skip AI if confidence very high/low

### Security Considerations
- API keys should be hashed in production
- Rate limiting by subscription tier
- RLS policies on all tables
- Service role key only for admin operations