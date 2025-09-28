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
    'Authorization': 'Bearer sp_live_YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: userInput })
});

const result = await response.json();
if (!result.safe) {
  throw new Error('Prompt blocked: potential injection detected');
}
```

## Features

- **🚀 One-Line Integration**: Literally just POST to /check
- **⚡ 5ms Response**: Your users won't even notice
- **💰 30% Cost Savings**: Smart caching reduces your bill automatically
- **📊 Batch Processing**: Validate 100 prompts in one call
- **🛡️ Real Protection**: Not just regex - multi-layer AI validation
- **📈 Usage Dashboard**: See threats blocked, track usage, export reports

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

- **Free**: 10,000 validations/month - Full AI protection, community support
- **Early Bird**: $5/month - 100,000 validations/month, priority support, 99.9% uptime SLA (beta pricing)

Both tiers include the SAME technology - full regex + AI validation with 99.9% accuracy.

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

1. **External Reference Detection** (5ms): Blocks URLs, IPs, file paths (including encoded/obfuscated)
2. **Pattern Matching** (0ms): Fast detection of known attack patterns
3. **Pass 1 AI Validation** (~200ms): Llama 8B for quick risk assessment
4. **Pass 2 AI Validation** (~400ms): Llama 70B for uncertain cases only
5. **Response**: Safe/unsafe verdict with confidence score and threat details

## API Documentation

See [docs/API.md](docs/API.md) for complete API reference.

## Development

```bash
# Clone the repo
git clone https://github.com/ianreboot/safeprompt.git
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

## Current Deployment Status (January 2025)

### Live Services
- **Website**: https://safeprompt.dev ✅ (Cloudflare Pages)
- **API**: https://api.safeprompt.dev ✅ (Vercel Functions)
- **Dashboard**: https://dashboard.safeprompt.dev ✅ (Cloudflare Pages)
- **Database**: Supabase ✅ (fully configured with RLS)
- **Payments**: Stripe ✅ (integration ready for production)
- **Email**: Resend ✅ (configured for transactional emails)

### Beta Access
- Sign up at https://safeprompt.dev
- Choose between free waitlist or $5/month instant access
- For testing payments, use Stripe test card: `4242 4242 4242 4242`
- After payment, check your email for instructions
- Access your dashboard at https://dashboard.safeprompt.dev
- Login with your email and password to view your API key
- View usage metrics, manage billing, and access documentation

### Current Beta Pricing (September 2025)
- **Free Tier**: 10,000 validations/month
- **Early Bird Special**: $5/month for 100,000 validations (limited time)

## Technical Implementation

- **Accuracy**: 92.9% detection rate (up from 43%)
- **Response Time**: 250ms average (down from 1360ms)
- **Internal Cost**: [BUSINESS CONFIDENTIAL - DO NOT EXPOSE TO CUSTOMERS: $0.50 per 100K requests]
- **Architecture**: Hardened 2-pass validator with external reference detection
- **Uptime SLA**: 99.9% for paid plans

