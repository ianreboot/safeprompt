# SafePrompt

**Your AI is leaking secrets. One API call stops it.**

[![API Status](https://img.shields.io/badge/API-operational-green)](https://api.safeprompt.dev/status)
[![Response Time](https://img.shields.io/badge/response-<100ms-blue)](https://safeprompt.dev)
[![Accuracy](https://img.shields.io/badge/accuracy-98%25-success)](https://safeprompt.dev)
[![NPM Package](https://img.shields.io/npm/v/@safeprompt/client)](https://www.npmjs.com/~safeprompt.dev)
[![Beta](https://img.shields.io/badge/status-beta-yellow)](https://safeprompt.dev)

> Protect AI apps from prompt injection. Built for developers who ship fast—from weekend projects to production systems.

## What is SafePrompt?

SafePrompt protects your AI applications from prompt injection attacks. One API call. No SDKs required (but available). No complex rules to write. Just instant protection.

```javascript
// Option 1: NPM Package (recommended)
npm install @safeprompt/client

import { SafePrompt } from '@safeprompt/client';
const safeprompt = new SafePrompt('sp_live_YOUR_KEY');

const result = await safeprompt.validate(userInput);
if (!result.safe) {
  throw new Error('Prompt blocked: potential injection detected');
}

// Option 2: Direct HTTP API (any language)
const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sp_live_YOUR_KEY',
    'X-User-IP': req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: userInput,
    mode: 'optimized',
    sessionToken: sessionId  // Optional: for multi-turn attack detection
  })
});

const result = await response.json();
if (!result.safe) {
  throw new Error('Prompt blocked: potential injection detected');
}
```

## What's New (October 2025)

### ✅ Post-Audit Remediation Complete (October 14, 2025)
Multi-environment audit completed with all critical issues resolved:
- **DEV Database Fix**: DEV dashboard now correctly uses DEV database (vkyggknknyfallmnrmfu)
- **Attack Pattern Count**: Home page updated from "15 Attack Patterns" to accurate "27 Attack Patterns"
- **Test Utility Limits**: Corrected tier limits (Early Bird: 10K, Business: 250K)
- **Documentation Accuracy**: Playground tier comments now match actual attack counts
- **Deployment**: All fixes verified in both DEV and PROD environments
- **Commits**: 3 commits with descriptive messages, 120/120 payment tests passing

### 🎯 Multi-Turn Attack Detection 95% Accuracy (October 10, 2025)
Fixed reconnaissance attack threshold to catch 2-turn attacks:
- **95.0% Accuracy**: 19/20 multi-turn tests passing (up from 80%)
- **SQL Fix Deployed**: Changed reconnaissance_attack threshold from >=2 to >=1 safe requests
- **100% Reconnaissance Detection**: All 5 reconnaissance_attack patterns detected correctly
- **Test Coverage**: 20 sophisticated attack sequences (fake tickets, privilege escalation, social engineering chains)
- **Deployed to PROD**: Both DEV and PROD databases updated with fix

### 🎯 Attack Gallery & Test Suite Improvements (October 9, 2025)
Enhanced demonstration and validation coverage:
- **Attack Gallery Expansion**: Added 7 sophisticated attacks to playground (semantic extraction, business context masking)
- **Total Examples**: 25 attack demonstrations (22 attacks + 3 legitimate examples)
- **New Categories**: Indirect extraction (ASCII/length/encoding), business authority bypass, emergency override exploitation
- **AI Prompt Enhancements**: Explicit semantic extraction detection, critical override rules for security keywords
- **Real-World Impacts**: Each example includes actual breach references (Gandalf AI, OWASP LLM01 2025, CEO fraud patterns)

### 🎉 Phase 6 Intelligence Pipeline (October 8, 2025)
Automated attack pattern discovery and deployment:
- **Pattern Discovery**: ML-powered analysis finds new attack patterns from real threats (daily 3 AM UTC)
- **Campaign Detection**: Identifies coordinated attacks using temporal clustering (daily 3:30 AM UTC)
- **Honeypot Learning**: Auto-deploys patterns from fake endpoints with 100% malicious traffic (daily 4 AM UTC)
- **Admin Dashboard**: Review pattern proposals, investigate campaigns, monitor auto-deployments
- **Zero Impact**: Background jobs don't affect validation performance

### 🛡️ Phase 1A Network Defense (October 8, 2025)
Collective intelligence across all customers:
- **Threat Intelligence**: Free tier contributes and benefits, paid tiers can opt-out (lose benefits)
- **IP Reputation**: Hash-based tracking of malicious IPs (paid tiers, <10ms lookup, manual blocking)
- **Multi-Turn Detection**: 95% accuracy on sophisticated attack sequences (reconnaissance, privilege escalation, social engineering)
- **67 Tests Passing**: Complete test coverage for compliance, performance, and security
- **Privacy Controls**: Opt-out available, GDPR export/deletion APIs

### ✨ Custom Whitelist/Blacklist (October 8, 2025)
Define business-specific phrases to guide validation decisions:
- **Custom Whitelist**: Mark safe business phrases (e.g., "shipping address", "customer service")
- **Custom Blacklist**: Block specific attack patterns unique to your use case
- **Default Lists**: Pre-configured phrases for common business scenarios
- **Tier Limits**: Free (defaults only), Starter (25/25), Business (100/100)
- **Dashboard Management**: Add/edit/remove phrases at `/custom-lists` with real-time validation
- **API Integration**: Pass `customRules` in request body for per-request overrides
- **132 Tests Passing**: Comprehensive test coverage (sanitizer, validator, checker, integration)

See the [Custom Lists documentation](#custom-lists) for details.

## Features

- **🚀 One API Call** - Literally just POST to /validate. No SDKs required (but available on NPM).
- **⚡ Stupid Fast** - 67% of requests = <100ms. No lag for your users.
- **💰 Dirt Cheap** - $0.50 per 100K vs $150 DIY. 99.7% cost savings.
- **🛡️ Actually Works** - 98% accuracy on 94 real attacks. Not just regex.
- **📊 See What's Blocked** - Dashboard shows threats, not just error logs.
- **🔗 No Lock-In** - Works with any stack. Switch anytime.
- **✨ Custom Lists** - 80+ default phrases (all tiers), customize for your business (paid tiers).
- **🧠 Network Intelligence** - Free tier contributes and benefits, paid tiers can opt-out (lose benefits).
- **🤖 Pattern Discovery** - Automated ML-powered attack pattern detection from real threats.
- **🔗 Multi-Turn Protection** - Session-based validation detects context priming and RAG poisoning.
- **📊 Batch Processing** - Validate multiple prompts in one call.

## Quick Start

```bash
# 1. Install NPM package (30 seconds)
npm install @safeprompt/client

# 2. Get your API key
# Sign up at https://safeprompt.dev/signup
```

```javascript
// 3. Protect your AI (that's it)
import { SafePrompt } from '@safeprompt/client';
const safeprompt = new SafePrompt('sp_live_YOUR_KEY');

// Before (vulnerable)
const response = await openai.complete(userInput);

// After (protected)
const validation = await safeprompt.validate(userInput);
if (validation.safe) {
  const response = await openai.complete(userInput);
}
```

**No SDK needed.** Works with any language that can POST to an API.

→ [Get your free API key](https://safeprompt.dev/signup)
→ [NPM Package](https://www.npmjs.com/~safeprompt.dev)
→ [GitHub Examples](https://github.com/ianreboot/safeprompt)


## Pricing

- **Free**: 1,000 validations/month
  - Full AI protection with 98.9% accuracy
  - Contributes attack data to network intelligence
  - Community support

- **Early Bird** ($5/month, limited to first 50 users):
  - 10,000 validations/month
  - All Free tier features PLUS:
  - **IP logging for threat intelligence**: Correlate attack patterns by IP address
  - **Multi-turn attack detection**: Session-based validation
  - **Intelligence opt-out**: Disable data contribution (loses network benefits)
  - Priority support
  - 99.9% uptime SLA
  - **Price locked forever** at $5/month

- **Starter** ($29/month):
  - Same features as Early Bird, regular pricing
  - 10,000 validations/month

- **Business** ($99/month):
  - 250,000 validations/month
  - All Starter features at scale

All tiers use the SAME core technology - full regex + AI validation with 98.9% accuracy on 94 professional tests. Paid tiers add network defense features powered by collective intelligence.

## Why SafePrompt?

### The Problem
Every AI application is vulnerable to prompt injection. Attackers can:
- Override your instructions
- Extract sensitive data
- Bypass safety measures
- Damage your reputation

**Real example**: Chevrolet sold a $60,000 car for $1 because of prompt injection.

### Why Not Just... ?

**"I'll build my own regex"**
- Takes 20+ hours. 43% accuracy. Constant updates.
- SafePrompt: $0.50 per 100K. 98% accuracy. Zero maintenance.

**"I'll use Claude's built-in filter"**
- 88% block rate = 12% slip through.
- SafePrompt: 98% accuracy. Catches multi-turn attacks.

**"I'll use an enterprise tool"**
- $X,XXX/month. Sales calls. Complex integration.
- SafePrompt: $5-$99/mo. Self-serve. One API call.

**"I'll just hope nobody attacks me"**
- Chevrolet sold a $60K car for $1.
- SafePrompt: Sleep better.

### Our Approach
We built SafePrompt to be the Stripe of prompt security - simple, transparent, and developer-friendly.

## How It Works

### Core Validation Pipeline
1. **XSS Pattern Detection** (0ms): Catches script injection and obfuscation techniques
2. **Template Injection Detection** (0ms): Detects server-side template exploitation
3. **External Reference Detection** (5ms): Blocks URLs, IPs, file paths (including encoded/obfuscated)
4. **Pattern Matching** (0ms): Fast detection of known attack patterns
5. **AI Orchestrator** (~100ms): Intelligent routing determines which validators to invoke
6. **Specialized Validators** (parallel): Business context, attack detection, semantic analysis
7. **Consensus Engine**: Multi-validator voting with smart escalation
8. **Pass 2 Deep Analysis** (~2s): Triggered for ambiguous cases only (~5% of requests)
9. **Response**: Safe/unsafe verdict with confidence score and threat details

### Advanced Protection (Phase 1A - October 2025)

**Threat Intelligence Collection:**
- **Free tier**: Contributes blocked attacks, benefits from network-wide pattern discovery (cannot opt-out)
- **Paid tiers**: Contributes all requests (if opted-in, default: true), can opt-out BUT loses network benefits if opted-out
- **Key principle**: Only contributors benefit from collective intelligence
- 24-hour PII retention: Prompt text + IP addresses deleted after 24 hours (GDPR/CCPA compliant)
- Permanent attack pattern storage: Cryptographic hashes persist for network defense

**IP Logging for Threat Intelligence (paid tiers: Early Bird/Starter/Business):**
- Hash-based tracking: Correlates attack patterns by IP address for threat intelligence
- Real-time pattern analysis: Every validation contributes to IP-based threat correlation
- Helps identify: Coordinated attacks, distributed attack patterns, persistent threat actors

**Multi-Turn Attack Detection (95% accuracy):**
- Session-based validation tracks conversation history across multiple requests
- Reconnaissance attack detection: Catches safe information gathering followed by exploitation (100% detection rate)
- Context priming detection: Blocks fake ticket references, false authorization claims, temporal proof building
- Gradual escalation protection: Detects progressive privilege requests (100% detection rate)
- Social engineering chains: Identifies urgency claims leading to security bypass (100% detection rate)
- RAG poisoning protection: Detects malicious document injection attempts (100% detection rate)
- Additional patterns: Encoding chains, role confusion, sudden escalation
- 2-hour session TTL with automatic cleanup

**Privacy & Compliance:**
- **Free tier**: Contributes blocked attacks → Benefits from network intelligence (required)
- **Paid tiers**: Default opted-in (contributes all requests → gets network intelligence + IP-based threat correlation), can opt-out via Settings → Privacy (loses network benefits, keeps own data only)
- **Key principle**: Only contributors benefit from collective intelligence
- GDPR right to deletion: Delete all identifiable data via API
- GDPR right to access: Export all data associated with your account

## API Documentation

See [docs/API.md](docs/API.md) for complete API reference.

### Custom Lists

**NEW (October 2025)**: Define business-specific phrases to guide AI validation decisions.

#### How It Works
Custom lists provide **confidence signals** to the AI validator, not instant block/allow decisions:
- **Blacklist match** (0.9 confidence) → Routes to AI with high attack signal
- **Whitelist match** (0.8 confidence) → Routes to AI with high business signal
- **Pattern detection always runs** (XSS, SQL injection cannot be overridden)

#### API Usage

```javascript
// Option 1: Per-request custom rules
const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sp_live_YOUR_KEY',
    'X-User-IP': userIP,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: userInput,
    customRules: {
      whitelist: ['shipping address', 'customer service', 'order tracking'],
      blacklist: ['admin override', 'system prompt']
    }
  })
});

// Option 2: Use profile-level lists (managed in dashboard)
// No need to pass customRules - uses your saved lists
const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sp_live_YOUR_KEY',
    'X-User-IP': userIP,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: userInput })
});

// Check if custom rule matched
if (result.customRuleMatched) {
  console.log(`Matched ${result.customRuleMatched.type}: "${result.customRuleMatched.phrase}"`);
}
```

#### Dashboard Management
Manage your custom lists at `https://dashboard.safeprompt.dev/custom-lists`:
- Add/edit/delete custom phrases
- View tier limits (X/Y phrases used)
- Toggle default lists on/off
- Remove specific default phrases (paid tiers)

#### Tier Limits
- **Free**: Default lists only (read-only)
- **Starter**: 25 whitelist + 25 blacklist phrases
- **Business**: 100 whitelist + 100 blacklist phrases
- **Internal**: 200 whitelist + 200 blacklist phrases

#### Important Notes
- **Blacklist priority**: Blacklist always wins over whitelist
- **Security first**: XSS/SQL patterns cannot be overridden by whitelist
- **Three-layer merging**: Request custom rules > Profile custom rules > Default lists
- **Case insensitive**: Matching is case-insensitive ("Admin" matches "admin")

## Development

```bash
# Clone the repo
git clone https://github.com/ianreboot/safeprompt-internal.git
cd safeprompt

# Install dependencies
npm install

# Run tests
npm test

# Start local server
npm run dev
```

## Support

- Documentation: [safeprompt.dev/#docs](https://safeprompt.dev/#docs)
- Contact: [safeprompt.dev/contact](https://safeprompt.dev/contact)
- API Status: [api.safeprompt.dev/status](https://api.safeprompt.dev/status)

## License

MIT - Use it however you want.

## Security

Found a vulnerability? Use our [contact form](https://safeprompt.dev/contact) for responsible disclosure.

---

Built with ❤️ for developers who just want their AI apps to be secure.

## Current Deployment Status (October 2025)

### Live Services

**Production Environment:**
- **Website**: https://safeprompt.dev ✅ (Cloudflare Pages)
- **API**: https://api.safeprompt.dev ✅ (Vercel: safeprompt-api)
- **Dashboard**: https://dashboard.safeprompt.dev ✅ (Cloudflare Pages)
- **Database**: Supabase (adyfhzbcsqzgqvyimycv) ✅

**Development Environment:**
- **Website**: https://dev.safeprompt.dev ✅ (Cloudflare Pages)
- **API**: https://dev-api.safeprompt.dev ✅ (Vercel: safeprompt-api-dev)
- **Dashboard**: https://dev-dashboard.safeprompt.dev ✅ (Cloudflare Pages)
- **Database**: Supabase (vkyggknknyfallmnrmfu) ✅

**Additional Services:**
- **Admin Panel**: https://dashboard.safeprompt.dev/admin ✅ (User management, waitlist approval)
- **Payments**: Stripe ✅ (production mode, accepting real payments)
- **Email**: Resend ✅ (configured for transactional emails)

### Recent Updates (October 2025)

**October 15, 2025 - PROD Deployment Complete** ✅
- ✅ **WaitlistForm Fix Live**: Deployed to production (commit fdf05f2)
- ✅ **DEV/PROD Consistency**: Both environments now fully synchronized
- ✅ **Launch Ready**: All signup flows functional in production, payment integration complete
- ✅ **Deployment Verified**: Early Bird signup working on production homepage

**October 14, 2025 - Signup Flow Validation & Business Model Alignment** ✅
- ✅ **Paid Signup Flow**: Early Bird option now correctly redirects to Stripe checkout for instant access
- ✅ **Free Signup Flow**: Waitlist approval workflow validated and working correctly
- ✅ **Business Model Confirmed**: Paid users get instant access via Stripe, free users require manual approval
- ✅ **Both Entry Points Working**: Homepage WaitlistForm and /signup page both functional
- ✅ **Documentation Updated**: CLAUDE.md and README.md reflect actual implementation

**October 14, 2025 - Post-Audit Remediation COMPLETE** ✅
- ✅ **Multi-Environment Audit**: 8 agents (4 DEV + 4 PROD) audited all pages
- ✅ **4 Critical Issues Fixed**: DEV database config, attack pattern count, tier limits, documentation accuracy
- ✅ **DEV Dashboard Fix**: Rebuilt with correct DEV database (vkyggknknyfallmnrmfu)
- ✅ **Website Updates**: Home page shows accurate "27 Attack Patterns" in DEV and PROD
- ✅ **Test Suite Validation**: Corrected tier limits, 120/120 payment tests passing
- ✅ **Documentation Sync**: Playground tier comments match actual attack counts
- ✅ **All Deployments Verified**: Changes confirmed live in both DEV and PROD environments

**October 8, 2025 - Phase 6 Intelligence Pipeline DEPLOYED** 🎉
- ✅ **Pattern Discovery**: Automated ML analysis discovers new attack patterns from real threats (3 AM UTC daily cron)
- ✅ **Campaign Detection**: Temporal clustering identifies coordinated attacks (3:30 AM UTC daily cron)
- ✅ **Honeypot Learning**: Auto-deploys patterns from fake endpoints with 100% malicious traffic (4 AM UTC daily cron)
- ✅ **Complete Admin Dashboard**: Review pattern proposals, investigate campaigns, monitor auto-deployments
- ✅ **Production Deployment**: All 3 Vercel cron jobs deployed and scheduled
- ✅ **Database Schema**: 4 Phase 6 tables deployed (pattern_proposals, attack_campaigns, honeypot_learnings, extended threat_intelligence_samples)
- ✅ **Monitoring & Rollback**: Complete documentation for health checks and recovery procedures

**October 8, 2025 - Phase 1A Network Defense DEPLOYED** 🛡️
- ✅ **Threat Intelligence System**: Free tier contributes and benefits, paid tiers can opt-out (lose benefits)
- ✅ **IP Reputation System**: Hash-based tracking with <10ms lookup (paid tiers, manual blocking)
- ✅ **Multi-Turn Attack Detection**: Session-based validation for context priming and RAG poisoning
- ✅ **Privacy Compliance**: GDPR export/deletion APIs, opt-out controls for paid tiers
- ✅ **Complete Test Coverage**: 67 tests passing (compliance, performance, security, integration)
- ✅ **Dashboard UI**: Privacy settings, IP management, threat intelligence analytics (11 components)
- ✅ **Website Updates**: Network defense content, pricing updates, FAQ additions
- ✅ **API Documentation**: GDPR endpoints, intelligence collection, IP reputation fields

**October 8, 2025 - Payment Testing VALIDATED** 💳
- ✅ **Revenue-Critical Flows**: All Stripe payment and subscription flows tested
- ✅ **Test Results**: 120/120 payment tests passing (9 test files, comprehensive coverage)
- ✅ **Tier Management**: User tier upgrades, downgrades, subscription lifecycle verified
- ✅ **Webhook Integration**: Stripe events update database atomically
- ✅ **Usage Tracking**: Monthly validation limits and reset mechanism functional

**October 8, 2025 - Custom Lists V2 DEPLOYED** ✨
- ✅ **Custom Whitelist/Blacklist**: Business-specific phrase management
- ✅ **Default Lists**: Pre-configured phrases for common business scenarios
- ✅ **Dashboard UI**: Complete CRUD interface at `/custom-lists`
- ✅ **API Integration**: Three-layer merging (request > profile > defaults)
- ✅ **132 Tests Passing**: Comprehensive coverage (sanitizer, validator, checker, integration)
- ✅ **Tier Limits**: Free (defaults only), Starter (25/25), Business (100/100), Internal (200/200)

**October 7, 2025 - Quarter 1 Security Hardening COMPLETE** 🎉
- ✅ **Total**: 135+ tasks completed across 5 major phases (Phase 1A, 1B, 1C, Phase 2, Phase 6)
- ✅ **Production Status**: All components deployed and operational

**October 3, 2025:**
- ✅ **Complete Dev/Prod Separation**: Dual API architecture implemented (safeprompt-api + safeprompt-api-dev)
- ✅ **Environment Isolation**: Each environment has its own API endpoint, database, and Vercel project
- ✅ **DNS Configuration**: Added dev-api.safeprompt.dev for development API
- ✅ **Code Cleanup**: Eliminated all hardcoded URLs, using environment variables
- ✅ **Production Database Live**: PROD database (adyfhzbcsqzgqvyimycv) operational with 5 users
- ✅ **Password Management**: Forgot password, reset password, and change password features added

**October 2, 2025:**
- ✅ **Database Audit Complete**: Fixed signup flow, added missing RLS policies, verified data integrity
- ✅ **Admin Panel Live**: User management, waitlist approval, activity logs, subscription management
- ✅ **Schema Documentation**: `/database/setup.sql` updated to match production schema 100%

### Beta Access & Signup

**Two Ways to Get Started:**

**Option 1: Instant Access (Paid - $5/month Early Bird)**
1. Visit https://safeprompt.dev or https://safeprompt.dev/signup
2. Select "Early Bird Access" option
3. Complete Stripe checkout (production payments accepted)
4. **Instant dashboard access** with your API key
5. First 50 users lock in $5/month pricing forever

**Option 2: Free Tier (Waitlist)**
1. Visit https://safeprompt.dev or https://safeprompt.dev/signup
2. Select "Join Waitlist" option
3. Wait for admin approval (typically 1-2 business days)
4. Receive email with login link
5. Access dashboard with 1,000 free validations/month
6. Can upgrade to paid plan anytime in dashboard

**After Signup:**
- Access your dashboard at https://dashboard.safeprompt.dev
- Login with your email and password
- View your API key, usage metrics, and documentation
- Manage billing and subscription settings

### Current Beta Pricing (October 2025)
- **Free Tier**: 1,000 validations/month (contributes attack data)
- **Early Bird**: $5/month for 10,000 validations (first 50 users only - price locked forever)
- **Starter**: $29/month for 10,000 validations (IP threat correlation, multi-turn protection, intelligence opt-out)
- **Business**: $99/month for 250,000 validations (all Starter features at scale)

## Technical Implementation

### Production Performance (October 2025)
- **Single-Turn Accuracy**: 98.9% (93/94 professional tests passed)
- **Multi-Turn Accuracy**: 95.0% (19/20 sophisticated attack sequences blocked)
- **Response Time**: <100ms for 67% requests (pattern detection), 2-3s for AI validation
- **Zero-Cost Rate**: 67% of requests handled instantly via pattern/reference detection
- **Architecture**: Hardened 2-pass validator with intelligent routing and consensus
- **Test Coverage**: 852 unit tests (100% pass rate) + 94 professional integration tests + 20 multi-turn tests + 67 Phase 1A tests + 120 payment tests
  - Custom Lists: 132 tests (sanitizer, validator, checker, integration)
  - Multi-Turn Detection: 20 tests (95% accuracy, 100% reconnaissance detection)
  - Phase 1A: 67 tests (GDPR compliance, performance, IP reputation, intelligence collection)
  - Payment Testing: 120/120 tests passing (9 test files, comprehensive Stripe integration coverage)
- **Unit Test Coverage**: 52.71% overall, 74-96% on critical validation paths
- **Attack Detection**: 96.8% (60/62 single-turn attacks blocked), 95.0% (19/20 multi-turn sequences blocked)
- **False Positive Rate**: 0% (32/32 legitimate requests approved)
- **Uptime SLA**: 99.9% for paid plans

### AI Models (Updated October 2025)
**Pass 1** (Quick screening, ~36% of requests):
- **Primary**: Google Gemini 2.0 Flash
- **Fallback**: Llama 3.1 8B Instruct

**Pass 2** (Deep validation, ~5% of requests):
- **Primary**: Google Gemini 2.5 Flash
- **Fallback**: Llama 3.1 70B Instruct

### Recent Improvements
- **October 2025**: External reference action detection - blocks "visit URL", "access file" while allowing legitimate mentions
- **Pattern Detection**: XSS, SQL injection, template injection, command injection, semantic extraction
- **External References**: URL/IP/file detection with action-based blocking, sensitive path protection, encoding/obfuscation resistance

### Test Suite Details (94 Professional Tests)

**Attack Categories Tested (62 tests):**
- **XSS Basic (5)**: Classic script injection, event handlers, SVG attacks, iframe exploits, body onload
- **XSS Obfuscated (5)**: Nested tags, HTML entities, hex encoding, character code obfuscation, unicode escapes
- **XSS Polyglot (5)**: Comment breaks, JavaScript context, attribute breaks, universal polyglots, conditional execution
- **Code Injection (5)**: Jinja2 templates, JavaScript templates, SQL injection, SQL tautology, ERB templates
- **External References Plain (5)**: URLs, IPs, file paths, fetch commands
- **External References Obfuscated (5)**: Spaced URLs, defanged notation, bracket IPs, localhost
- **External References Encoded (5)**: ROT13, Base64, hex, percent encoding, homoglyphs
- **Prompt Manipulation (5)**: Instruction override, DAN jailbreak, impersonation, system injection, escape attempts
- **Language Switching (4)**: Spanish, French, Japanese, Chinese bypass attempts (OWASP 2025)
- **Semantic Manipulation (4)**: Riddles, definitions, rhymes, incremental disclosure (Gandalf/Lakera)
- **Indirect Injection (3)**: RAG poisoning, content embedding, split payloads (OWASP LLM01 #1)
- **Adversarial Suffix (3)**: Special chars, repetition, invisible Unicode bypasses
- **Modern Jailbreaks (4)**: STAN, DevMode, AIM, dual model simulation (2025 trending)
- **Nested Encoding (2)**: Base64-of-Base64, ROT13 commands
- **Edge Cases (2)**: Ambiguous attacks

**False Positive Prevention (32 tests):**
- **Security Discussion (5)**: Academic research, security testing, training materials, implementation guides
- **Business Context (10)**: Policy updates, authorization workflows, revision requests, instruction clarification
- **Technical Support (5)**: Debugging assistance, code review, implementation help, security consulting
- **Customer Service (5)**: Refunds, corrections, follow-ups, escalations, account inquiries
- **Idiomatic English (6)**: Common phrases like "forget about", "bypass the line", "override previous"
- **Edge Cases (1)**: Ambiguous reference that could be legitimate

**Each test includes:**
- Exact prompt text
- Expected result (safe/unsafe)
- Attack category classification
- Reasoning for classification

**Full test suite:** `/home/projects/safeprompt/test-suite/realistic-test-suite.js`

---

## Internal Documentation

**Target Audience & Messaging**: See [docs/TARGET_AUDIENCE.md](docs/TARGET_AUDIENCE.md) for:
- Complete target audience research and personas (5 awareness stages)
- Messaging framework and voice/tone guidelines
- Competitive positioning and social proof strategy
- Content strategy and Product Hunt launch plan

**Technical Documentation**: See [docs/](docs/) directory for:
- Architecture and deployment guides
- API documentation and testing standards
- Security hardening and privacy compliance
- Phase implementation summaries and audit reports
