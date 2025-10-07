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

## Features

- **🚀 One-Line Integration**: Literally just POST to /validate
- **⚡ Lightning Fast**: <100ms pattern detection (67% of requests), 2-3s AI validation when needed
- **🛡️ Real Protection**: External reference detection + regex + 2-pass AI validation
- **🧠 Network Intelligence**: IP reputation system learns from attacks across all customers (Pro tier)
- **🔗 Multi-Turn Protection**: Session-based validation detects context priming and RAG poisoning
- **📊 Batch Processing**: Validate multiple prompts in one call
- **💰 Cost Optimized**: 67% requests require $0 AI cost (instant pattern/reference matching)
- **📈 Usage Dashboard**: See threats blocked, track usage, view IP reputation scores

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

**Multi-Turn Attack Detection:**
- Session-based validation tracks conversation history
- Context priming detection: Blocks fake ticket references, false authorization claims
- RAG poisoning protection: Detects malicious document injection attempts
- 2-hour session TTL with automatic cleanup

**Privacy & Compliance:**
- Free tier: Contributes attack data (no IP blocking capability)
- Pro tier: Opt-in for intelligence sharing + IP blocking features
- GDPR right to deletion: Delete all identifiable data via API
- GDPR right to access: Export all data associated with your account

## API Documentation

See [docs/API.md](docs/API.md) for complete API reference.

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

**October 7, 2025 - Quarter 1 Security Hardening COMPLETE** 🎉
- ✅ **Pattern Discovery Pipeline**: ML-powered automated pattern detection from real attacks
- ✅ **Campaign Detection**: Temporal clustering and similarity analysis for coordinated attacks
- ✅ **Honeypot Learning**: Safe auto-deployment of validated patterns from fake endpoints
- ✅ **Complete Admin Dashboard**: IP management (whitelist/blacklist), pattern proposals, campaign response
- ✅ **User Analytics**: Validation history, usage charts, privacy controls (GDPR/CCPA rights)
- ✅ **Total**: 135+ tasks completed across 5 major phases (Phase 1A, 1B, 1C, Phase 2, Phase 6)
- ✅ **Production Status**: All components deployed and operational

**October 6, 2025 - Phase 1A: Threat Intelligence System** 🚀
- ✅ **IP Reputation System**: Network defense intelligence across all customers
- ✅ **Multi-Turn Attack Detection**: Session-based validation for context priming and RAG poisoning
- ✅ **Threat Intelligence Collection**: 24-hour anonymization model (GDPR/CCPA compliant)
- ✅ **Pro Tier IP Blocking**: Auto-block malicious IPs with >70% attack rate (opt-in)
- ✅ **Privacy Compliance APIs**: GDPR right to deletion and data export
- ✅ **X-User-IP Header**: Required for accurate attack source tracking

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
- **Accuracy**: 98.9% (93/94 professional tests passed)
- **Response Time**: <100ms for 67% requests (pattern detection), 2-3s for AI validation
- **Zero-Cost Rate**: 67% of requests handled instantly via pattern/reference detection
- **Architecture**: Hardened 2-pass validator with intelligent routing and consensus
- **Test Coverage**: 386 unit tests (100% pass rate) + 94 professional integration tests
- **Unit Test Coverage**: 52.71% overall, 74-96% on critical validation paths
- **Attack Detection**: 96.8% (60/62 attacks blocked)
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

