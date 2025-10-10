# SafePrompt

> Simple API for AI security. One endpoint, instant protection.

[![API Status](https://img.shields.io/badge/API-operational-green)](https://api.safeprompt.dev/status)
[![Beta](https://img.shields.io/badge/status-beta-yellow)](https://safeprompt.dev)

## What is SafePrompt?

SafePrompt protects your AI applications from prompt injection attacks. Built for developers who need security without complexity - whether you're working on a side project, building for a client, or scaling a business. No SDKs to install, no complex rules to write - just POST to our API and you're protected.

```javascript
// Use HTTP API directly (SDK coming soon)
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
// Optional: Check IP reputation (Pro tier)
if (result.ipReputationScore < 0.5) {
  console.warn('Request from low-reputation IP');
}
```

## What's New (October 2025)

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
- **Threat Intelligence**: Collects blocked prompts with 24-hour PII retention (GDPR/CCPA compliant)
- **IP Reputation**: Hash-based auto-blocking of malicious IPs (Pro tier, <10ms lookup)
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

- **🚀 One-Line Integration**: Literally just POST to /validate
- **⚡ Lightning Fast**: <100ms pattern detection (67% of requests), 2-3s AI validation when needed
- **🛡️ Real Protection**: External reference detection + regex + 2-pass AI validation
- **✨ Custom Lists**: Define business-specific whitelist/blacklist phrases
- **🧠 Network Intelligence**: IP reputation system learns from attacks across all customers (Pro tier)
- **🤖 Pattern Discovery**: Automated ML-powered attack pattern detection from real threats (Phase 6)
- **🎯 Campaign Detection**: Identifies coordinated attacks using temporal clustering (Phase 6)
- **🍯 Honeypot Learning**: Auto-deploys patterns from fake endpoints (Phase 6)
- **🔗 Multi-Turn Protection**: Session-based validation detects context priming and RAG poisoning
- **📊 Batch Processing**: Validate multiple prompts in one call
- **💰 Cost Optimized**: 67% requests require $0 AI cost (instant pattern/reference matching)
- **📈 Usage Dashboard**: See threats blocked, track usage, manage custom lists, review pattern proposals

## Quick Start

**Note**: NPM package coming soon. For now, use the HTTP API directly.

1. **Sign up** at [safeprompt.dev](https://safeprompt.dev)
2. **Access your dashboard** at [dashboard.safeprompt.dev](https://dashboard.safeprompt.dev) to get your API key
3. **Add validation** to your AI calls using the HTTP API:

```javascript
// Before (vulnerable)
const response = await openai.complete(userInput);

// After (protected)
const validation = await safeprompt.check(userInput);
if (validation.safe) {
  const response = await openai.complete(userInput);
}
```


## Pricing

- **Free**: 1,000 validations/month
  - Full AI protection with 98.9% accuracy
  - Contributes attack data to network intelligence
  - Community support
  - **No IP blocking** (contributes only)

- **Pro** (Early Bird $5/month, Regular $29/month):
  - 10,000 validations/month
  - All Free tier features PLUS:
  - **IP reputation blocking**: Auto-block malicious IPs (opt-in)
  - **Multi-turn attack detection**: Session-based validation
  - **Intelligence opt-out**: Disable data contribution if needed
  - Priority support
  - 99.9% uptime SLA

Both tiers use the SAME core technology - full regex + AI validation with 98.9% accuracy on 94 professional tests. Pro tier adds network defense features powered by collective intelligence.

## Why SafePrompt?

### The Problem
Every AI application is vulnerable to prompt injection. Attackers can:
- Override your instructions
- Extract sensitive data
- Bypass safety measures
- Damage your reputation

### Existing Solutions Suck
- **Lakera**: No transparent pricing, enterprise sales process
- **DIY Regex**: Incomplete, constant maintenance
- **Cloud Providers**: Vendor lock-in, complex integration

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
- Automatically collects blocked prompts from all customers (opt-out available for Pro tier)
- 24-hour anonymization: Full prompt text deleted after 24 hours (GDPR/CCPA compliant)
- Permanent attack pattern storage: Cryptographic hashes persist for network defense

**IP Reputation System (Pro tier):**
- Tracks attack patterns by IP address using cryptographic hashing
- Auto-blocking: IPs with >70% block rate automatically rejected (requires opt-in)
- Real-time scoring: Every validation updates IP reputation scores
- Allowlist support: Whitelist your CI/CD and internal testing infrastructure

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
- Free tier: Contributes attack data (no IP blocking capability)
- Pro tier: Opt-in for intelligence sharing + IP blocking features
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
- **Payments**: Stripe ✅ (sandbox mode, ready for production activation)
- **Email**: Resend ✅ (configured for transactional emails)

### Recent Updates (October 2025)

**October 8, 2025 - Phase 6 Intelligence Pipeline DEPLOYED** 🎉
- ✅ **Pattern Discovery**: Automated ML analysis discovers new attack patterns from real threats (3 AM UTC daily cron)
- ✅ **Campaign Detection**: Temporal clustering identifies coordinated attacks (3:30 AM UTC daily cron)
- ✅ **Honeypot Learning**: Auto-deploys patterns from fake endpoints with 100% malicious traffic (4 AM UTC daily cron)
- ✅ **Complete Admin Dashboard**: Review pattern proposals, investigate campaigns, monitor auto-deployments
- ✅ **Production Deployment**: All 3 Vercel cron jobs deployed and scheduled
- ✅ **Database Schema**: 4 Phase 6 tables deployed (pattern_proposals, attack_campaigns, honeypot_learnings, extended threat_intelligence_samples)
- ✅ **Monitoring & Rollback**: Complete documentation for health checks and recovery procedures

**October 8, 2025 - Phase 1A Network Defense DEPLOYED** 🛡️
- ✅ **Threat Intelligence System**: 24-hour PII retention, GDPR/CCPA compliant data collection
- ✅ **IP Reputation System**: Hash-based auto-blocking with <10ms lookup (Pro tier)
- ✅ **Multi-Turn Attack Detection**: Session-based validation for context priming and RAG poisoning
- ✅ **Privacy Compliance**: GDPR export/deletion APIs, opt-out controls for Pro tier
- ✅ **Complete Test Coverage**: 67 tests passing (compliance, performance, security, integration)
- ✅ **Dashboard UI**: Privacy settings, IP management, threat intelligence analytics (11 components)
- ✅ **Website Updates**: Network defense content, pricing updates, FAQ additions
- ✅ **API Documentation**: GDPR endpoints, intelligence collection, IP reputation fields

**October 8, 2025 - Payment Testing VALIDATED** 💳
- ✅ **Revenue-Critical Flows**: All Stripe payment and subscription flows tested
- ✅ **Test Results**: 12/15 tests passing (3 expected DEV failures - API not deployed to DEV)
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

### Beta Access
- Sign up at https://safeprompt.dev
- Choose between free waitlist or $5/month instant access
- For testing payments, use Stripe test card: `4242 4242 4242 4242`
- After payment, check your email for instructions
- Access your dashboard at https://dashboard.safeprompt.dev
- Login with your email and password to view your API key
- View usage metrics, manage billing, and access documentation

### Current Beta Pricing (October 2025)
- **Free Tier**: 1,000 validations/month (contributes attack data, no IP blocking)
- **Pro/Starter**: $29/month for 10,000 validations (IP blocking, multi-turn protection)
- **Early Bird Special**: $5/month for 10,000 validations (first 50 users only - discounted Pro tier)
- **Business**: $99/month for 250,000 validations (all Pro features at scale)

## Technical Implementation

### Production Performance (October 2025)
- **Single-Turn Accuracy**: 98.9% (93/94 professional tests passed)
- **Multi-Turn Accuracy**: 95.0% (19/20 sophisticated attack sequences blocked)
- **Response Time**: <100ms for 67% requests (pattern detection), 2-3s for AI validation
- **Zero-Cost Rate**: 67% of requests handled instantly via pattern/reference detection
- **Architecture**: Hardened 2-pass validator with intelligent routing and consensus
- **Test Coverage**: 852 unit tests (100% pass rate) + 94 professional integration tests + 20 multi-turn tests + 67 Phase 1A tests
  - Custom Lists: 132 tests (sanitizer, validator, checker, integration)
  - Multi-Turn Detection: 20 tests (95% accuracy, 100% reconnaissance detection)
  - Phase 1A: 67 tests (GDPR compliance, performance, IP reputation, intelligence collection)
  - Payment Testing: 12/15 tests passing (3 expected DEV failures)
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

