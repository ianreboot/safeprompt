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
  OR
Stripe Checkout (for instant access)
  ↓
Payment → Webhook → Account Creation
```

### 2. Payment & Account Creation Flow
```
Stripe Checkout Session
  ↓
Payment Success
  ↓
Webhook: api/v1/stripe-webhook.js (LINE 182: handler)
  ↓
handleCheckoutComplete() (LINE 87)
  ↓
generateApiKeyForUser() (LINE 31)
  ↓
Creates: User record + API key (hashed)
  ↓
Sends welcome email with API key (via Resend)
```

### 3. API Validation Flow
```
Developer sends request with API key
  ↓
api/v1/check-protected.js (requires auth)
  OR
api/v1/check.js (no auth, regex only)
  OR
api/v1/check-with-ai.js (AI validation)
  ↓
lib/prompt-validator.js (LINE 45: threat patterns)
  ↓
If confidence < 0.8:
  lib/ai-validator.js (LINE 23: Gemini FREE model)
  ↓
Response: {safe: boolean, confidence: number, threats: []}
```

## 📁 Key Files & Their Purpose

### API Endpoints (`/api/api/`)
| File | Purpose | Key Logic |
|------|---------|-----------|
| `v1/check.js` | Basic validation (regex only) | LINE 15: Main handler |
| `v1/check-with-ai.js` | AI-enhanced validation | LINE 20: AI integration |
| `v1/check-protected.js` | Authenticated validation | LINE 25: API key verification |
| `v1/stripe-webhook.js` | Payment processing | LINE 31: API key generation |
| `waitlist.js` | Waitlist signups | LINE 18: Supabase insert |

### Core Libraries (`/api/lib/`)
| File | Purpose | Critical Lines |
|------|---------|----------------|
| `prompt-validator.js` | Regex pattern matching | LINE 45-150: Threat patterns array |
| `ai-validator.js` | AI model integration | LINE 23: Gemini config, LINE 50: Validation prompt |
| `cache-manager.js` | LRU cache for responses | LINE 15: Cache configuration |

### Website Components (`/website/`)
| Component | Purpose | Location |
|-----------|---------|----------|
| `AttackTheater` | Animated threat demo | app/components/AttackTheater.tsx |
| `WaitlistForm` | Email capture + Stripe | app/components/WaitlistForm.tsx |
| `MetricsDashboard` | Live stats display | app/components/MetricsDashboard.tsx |

### Dashboard Components (`/dashboard/`)
| Page | Purpose | Location |
|------|---------|----------|
| `/` | Main dashboard with API keys | src/app/page.tsx |
| `/login` | Authentication page | src/app/login/page.tsx |
| `/admin` | Admin panel for user management | src/app/admin/page.tsx |

### Database Schema (`/api/supabase/`)
| File | Purpose |
|------|---------|
| `migrations/20250124_create_waitlist.sql` | Waitlist table |
| `migrations/20250124_create_users_and_api_keys.sql` | Core user data |

## 🗄️ Database Structure (Supabase)

```sql
users
  - id (uuid)
  - email (unique)
  - stripe_customer_id
  - tier (free/starter/pro/enterprise)
  - monthly_limit (50000/250000/1000000)

api_keys
  - id (uuid)
  - user_id (FK → users)
  - key_hash (SHA256)
  - key_hint (last 4 chars)
  - name
  - is_active

validation_logs
  - timestamp
  - api_key_id (FK)
  - prompt_hash
  - safe (boolean)
  - cached (boolean)
  - response_time_ms

waitlist
  - email (unique)
  - created_at
  - converted_to_user_id (FK → users)
```

## 🔑 Environment Variables

### Required for Core Function
```bash
# Database (Supabase)
SAFEPROMPT_SUPABASE_URL
SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY

# AI Validation
OPENROUTER_API_KEY  # For Gemini FREE model

# Payments
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET  # whsec_kAqeLUqd6wDWfbCPeEXlC061Jfc475QL

# Email
RESEND_API_KEY  # For sending API keys
```

### Testing & Development
```bash
SAFEPROMPT_TESTING=true  # Enables backdoor test patterns
```

## 🚀 Deployment Architecture

```
Website (safeprompt.dev)
  → Cloudflare Pages
  → Next.js static export
  → Project: safeprompt

API (api.safeprompt.dev)
  → Vercel Functions
  → Serverless Node.js
  → Project: safeprompt-api

Dashboard (dashboard.safeprompt.dev)
  → Vercel
  → Next.js 14 with App Router
  → Supabase Auth + Tailwind CSS
  → Project: dashboard

Database
  → Supabase (PostgreSQL)
  → Project ID: vkyggknknyfallmnrmfu
  → Region: us-east-1
  → RLS enabled on all tables
```

## ⚡ Performance Characteristics

| Operation | Target | Actual | Location of Logic |
|-----------|--------|--------|-------------------|
| Regex validation | <20ms | 2-5ms | prompt-validator.js:45 |
| AI validation | <2000ms | 1018ms | ai-validator.js:50 |
| Cached response | <10ms | 5ms | cache-manager.js:30 |
| Database write | <50ms | 20ms | Supabase auto-handled |

## 🔐 Security Measures

1. **API Keys**: SHA256 hashed, never stored in plaintext
2. **Webhook**: Stripe signature verification (stripe-webhook.js:191)
3. **Rate Limiting**: Per-key limits enforced (check-protected.js:40)
4. **Input Validation**: All inputs sanitized before processing
5. **CORS**: Restricted to known domains

## 🐛 Testing Infrastructure

### Test Files
- `tests/test-suite.js` - Main validation tests
- `tests/website-component-tests.js` - Frontend tests
- `tests/failure-scenario-tests.js` - Error handling

### Test Backdoors (when SAFEPROMPT_TESTING=true)
- `SAFEPROMPT_TEST_FORCE_SAFE` - Always returns safe
- `SAFEPROMPT_TEST_FORCE_MALICIOUS` - Always returns unsafe
- `SAFEPROMPT_TEST_FORCE_ERROR` - Triggers error

## 🚨 Critical Business Logic

### Pricing Tiers (stripe-webhook.js:100)
- Beta: $5/mo → 50,000 requests
- Starter: $29/mo → 50,000 requests
- Pro: $99/mo → 250,000 requests
- Enterprise: $299/mo → 1,000,000 requests

### Why It's Profitable
- AI model: Google Gemini FREE ($0 cost)
- Infrastructure: ~$50/month (Vercel + Supabase)
- Margin: ~98% at all price points

## 📍 Current State & Known Issues

### Working ✅
- Validation engine (100% accuracy)
- Payment processing (Stripe webhook automated)
- API key generation and storage
- Waitlist capture and approval
- Website deployed
- User dashboard with API key management
- Admin dashboard for user management
- Email notifications via Resend
- Custom domain configuration

### Nice-to-Have 📝
- **API Key Rotation** - Regenerate endpoint exists but needs testing
- **Usage Enforcement** - Tracking works, enforcement needs verification
- **Terms & Privacy** - Legal pages not yet created
- **Support System** - Email configured but no ticket system

## 🎯 Quick Debugging Guide

| Problem | Check This File | Look For |
|---------|-----------------|----------|
| Validation wrong | prompt-validator.js | LINE 45: patterns array |
| AI not working | ai-validator.js | LINE 23: model config |
| Payment failed | stripe-webhook.js | LINE 191: signature verify |
| API key invalid | check-protected.js | LINE 25: hash comparison |
| Email not sent | stripe-webhook.js | LINE 117: Resend TODO |

## 📝 For New AI Assistants

1. **Start Here**: Read CLAUDE.md for project goals and constraints
2. **Check Status**: Read OPERATIONAL_READINESS.md for what's broken
3. **Understand Flow**: Use this ARCHITECTURE.md to navigate
4. **Find Code**: Use line numbers above to jump to critical logic
5. **Make Changes**: Update AI markers when modifying critical sections

## 🔄 How This Doc Stays Current

When modifying code:
1. Update line numbers if critical logic moves
2. Add new files to appropriate section
3. Update "Current State" if fixing issues
4. Add AI markers in code for gotchas

**AI Marker Format**: `// AI: [description of critical logic]`

---

*This architecture map is designed to help AI assistants understand SafePrompt without reading every file. Keep it under 500 lines and update only line numbers when code moves.*