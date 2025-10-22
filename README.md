# SafePrompt

**Your AI is leaking secrets. One API call stops it.**

Protect AI automations, workflows, and features from prompt injection and manipulation attacks. Built for developers who ship fast.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/safeprompt.svg)](https://www.npmjs.com/package/safeprompt)
[![CodeQL](https://github.com/ianreboot/safeprompt/workflows/CodeQL%20Security%20Scan/badge.svg)](https://github.com/ianreboot/safeprompt/actions/workflows/codeql.yml)
[![GitHub stars](https://img.shields.io/github/stars/ianreboot/safeprompt?style=social)](https://github.com/ianreboot/safeprompt)

---

## 🚀 Quick Start

```bash
npm install safeprompt
```

```javascript
import SafePrompt from 'safeprompt';

const client = new SafePrompt({ apiKey: 'your-api-key' });

// Validate user input before sending to your LLM
const result = await client.check('Ignore previous instructions and...');

if (result.safe) {
  // Safe to proceed
  const llmResponse = await yourLLM.chat(userInput);
} else {
  // Handle malicious input
  console.log('Attack detected:', result.threats);
}
```

**That's it.** Your AI is protected.

---

## ⚡ Why SafePrompt?

### The Problem
Prompt injection attacks can:
- Leak your system prompts
- Extract training data
- Bypass safety filters
- Execute unintended actions
- Cost you money through token abuse

### The Solution
SafePrompt stops attacks **before** they reach your LLM:

| Feature | SafePrompt | OpenAI Moderation | DIY Regex |
|---------|-----------|-------------------|-----------|
| **Accuracy** | 98.9% | ~60% | ~30% |
| **Speed** | <100ms (pattern), 2-3s (AI) | ~300ms | Instant |
| **Prompt Injection Detection** | ✅ | ❌ | ❌ |
| **External Reference Detection** | ✅ | ❌ | ❌ |
| **Multi-Turn Attack Detection** | ✅ (95%) | ❌ | ❌ |
| **Context Awareness** | ✅ | ❌ | ❌ |
| **Pricing** | $29/mo | Free* | Free |

\* OpenAI Moderation doesn't detect prompt injection attacks

---

## 🎯 Features

### Core Protection
- **🛡️ 2-Pass Validation** - Fast pattern matching + deep AI analysis
- **📍 External Reference Detection** - Catches "fetch this URL" attacks (95% accuracy)
- **⚡ Blazing Fast** - Pattern detection <100ms (67% of requests), AI validation 2-3s when needed
- **🔄 Multi-Turn Attack Protection** - Session-based validation detects context priming and false history claims (95% accuracy)
- **✨ Custom Lists** - 80+ default phrases (all tiers), customize for your business (paid tiers: 25-100 custom phrases)

### Network Defense
- **🧠 Threat Intelligence Sharing** - Free tier contributes and benefits from network-wide protection, paid tiers can opt-out (but lose network benefits)
- **🔒 Privacy First** - 24-hour anonymization window, GDPR/CCPA compliant

### Developer Experience
- **💰 Affordable Pricing** - $29/month starter plan, transparent pricing
- **📊 Real-time Dashboard** - Monitor threats, view usage, manage custom lists
- **🔐 Privacy Focused** - Encrypted data, automatic PII deletion, full export/deletion rights

---

## 📦 What's Included

### JavaScript/TypeScript SDK
```bash
npm install safeprompt
```
Full TypeScript support, works in Node.js and browsers.

### Python SDK *(coming soon)*
```bash
pip install safeprompt
```

### Examples

Check the [examples/](./examples) directory for working code samples:
- `multi-turn.js` - Session-based multi-turn attack detection
- `attack-examples.js` - Test against 27 real attack patterns
- `custom-lists.js` - Whitelist/blacklist configuration (paid tiers)
- `session-tokens.js` - Session management patterns
- `ip-reputation.js` - IP reputation scoring and auto-blocking (paid tiers)
- `preferences.js` - Managing user preferences and settings

---

## 🔥 Live Demo

Try it yourself: **[safeprompt.dev/playground](https://safeprompt.dev/playground)**

Test real-world attack examples:
- System prompt extraction
- Jailbreak attempts
- External reference attacks
- Multi-language exploits
- Multi-turn reconnaissance

---

## 📚 Documentation

- [Quick Start Guide](./docs/quickstart.md)
- [HTTP API Reference](./docs/http-api.md) - Direct HTTP API usage (includes X-User-IP requirement)
- [Multi-Turn Protection](./docs/multi-turn.md) - Session-based attack detection
- [Custom Lists](./docs/custom-lists.md) - Whitelist/blacklist configuration (paid tiers)
- [Migration Guide](./docs/MIGRATION_GUIDE.md)
- [Best Practices](./docs/BEST_PRACTICES.md)

**Full docs**: [safeprompt.dev/docs](https://safeprompt.dev/docs)

---

## 💡 How It Works

SafePrompt uses a **3-layer defense system**:

### Layer 1: Pattern + External Reference Detection (67% of requests)
- Instant pattern matching (<1ms)
- External reference detection (URLs, file paths, IPs)
- XSS, SQL injection, template injection detection
- Lightning-fast threat detection

### Layer 2: AI-Powered Deep Analysis (33% of requests)
- Fast model quick screening for common threats
- Advanced model validation for edge cases
- Context-aware threat detection
- Custom list confidence signals

### Layer 3: Network Intelligence
- **Threat Intelligence**: Learn from attacks across all users (free tier contributes and benefits)
- **Multi-Turn Tracking**: Detect context priming and reconnaissance patterns (95% accuracy)
- **24h Anonymization**: GDPR/CCPA compliant automatic PII deletion

**Result**: 98.9% single-turn accuracy, 95% multi-turn accuracy, 0% false positive rate, <100ms for 67% of requests

---

## 🎯 Use Cases

SafePrompt protects any application processing user input with AI:

- **🤖 AI Automation Workflows** - n8n, Zapier, Make workflows
- **📧 AI-Powered Forms** - Contact forms → AI summary → inbox
- **💰 AI Quotation Systems** - User input → pricing/proposals
- **🎯 AI Customer Outreach** - Automated personalization engines
- **🔍 AI Search & RAG** - User queries → document retrieval
- **🤝 AI Agents** - Research, data processing, task automation
- **💬 AI Chatbots** - Customer support, conversational interfaces

---

## 🏢 Who Uses SafePrompt?

Perfect for:
- **Indie Developers** - Ship fast without security headaches
- **Automation Builders** - Protect n8n/Zapier workflows
- **Startups** - Enterprise security at indie pricing
- **AI Product Teams** - Focus on features, not security
- **API Developers** - Secure your AI endpoints

---

## 🚀 Get Started

### 1. Sign Up
Get your API key: **[safeprompt.dev/signup](https://safeprompt.dev/signup)**

**Pricing**:
- **Free**: 1,000 validations/month
  - Full AI protection (98.9% accuracy)
  - Contributes and benefits from threat intelligence network
  - Community support

- **Early Bird** (LIMITED - First 50 users): $5/month forever
  - Lock in $5/mo pricing for life
  - 10,000 validations/month
  - Multi-turn attack detection (95% accuracy)
  - Custom whitelist/blacklist (25 phrases each)
  - Intelligence opt-out option (loses network benefits)
  - Priority support

- **Starter**: $29/month for 10,000 validations
  - All Free tier features PLUS:
  - Multi-turn attack detection (95% accuracy)
  - Custom whitelist/blacklist (25 phrases each)
  - Intelligence opt-out option (loses network benefits)
  - Priority support
  - 99.9% uptime SLA

- **Business**: $99/month for 250,000 validations
  - All Starter features at scale
  - Custom lists (100 phrases each)
  - Dedicated support
  - 99.9% uptime SLA

### 2. Install SDK
```bash
npm install safeprompt
```

### 3. Integrate
```javascript
import SafePrompt from 'safeprompt';

const client = new SafePrompt({ apiKey: process.env.SAFEPROMPT_API_KEY });

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  // Check for threats
  const validation = await client.check(message, {
    userIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  });

  if (!validation.safe) {
    return res.status(400).json({
      error: 'Invalid input',
      threats: validation.threats
    });
  }

  // Safe to proceed
  const response = await openai.chat({ messages: [{ role: 'user', content: message }] });
  res.json(response);
});
```

### 4. Monitor
View threats and usage: **[dashboard.safeprompt.dev](https://dashboard.safeprompt.dev)**

---

## 📊 Attack Detection Capabilities

SafePrompt detects **98.9% of single-turn attacks** and **95% of multi-turn attacks** across these categories:

### XSS (Cross-Site Scripting)
- Basic script injection, event handlers
- Obfuscated variants (HTML entities, hex encoding)
- Polyglot attacks (works in multiple contexts)

### Code Injection
- SQL injection and tautologies
- Template injection (Jinja2, ERB, JavaScript)
- Command injection

### External References
- URLs, IPs, file paths
- Obfuscated notation (defanged, spaced, bracketed)
- Encoded variants (ROT13, Base64, hex)
- Action-based detection (blocks "visit URL" while allowing mentions)

### Prompt Manipulation
- Instruction override and DAN jailbreaks
- Impersonation and system injection
- Language switching (Spanish, French, Japanese, Chinese)
- Semantic manipulation (riddles, definitions, incremental disclosure)

### Advanced Attacks
- Indirect injection (RAG poisoning, content embedding)
- Adversarial suffixes (special chars, repetition, invisible Unicode)
- Modern jailbreaks (STAN, DevMode, AIM)
- Multi-turn reconnaissance and privilege escalation

---

## 🔒 Privacy & Compliance

### GDPR Compliant
- 24-hour PII retention (prompt text, IP addresses)
- Automatic anonymization after 24 hours
- Right to deletion: Complete PII removal via API
- Right to access: Machine-readable data export
- Anonymized data preserved for network defense (Article 17(3)(d) - Scientific research)

### CCPA Compliant
- Opt-out mechanism for intelligence sharing (paid tiers)
- No data sale - Internal threat intelligence only
- Clear disclosure in signup flow and privacy policy

---

## 🤝 Contributing

We love contributions! See our [Contributing Guide](./CONTRIBUTING.md) for details.

### Found a Security Issue?
Please email security@safeprompt.dev instead of opening a public issue.

---

## 📜 License

This SDK and examples are [MIT licensed](./LICENSE).

The SafePrompt API service is proprietary. See [safeprompt.dev/terms](https://safeprompt.dev/terms) for details.

---

## 🔗 Links

- **Website**: [safeprompt.dev](https://safeprompt.dev)
- **Dashboard**: [dashboard.safeprompt.dev](https://dashboard.safeprompt.dev)
- **Playground**: [safeprompt.dev/playground](https://safeprompt.dev/playground)
- **Support**: support@safeprompt.dev
- **Twitter**: [@ianreboot](https://x.com/ianreboot)

---

## ⭐ Show Your Support

If SafePrompt helps secure your AI, give us a star! ⭐

**Built with ❤️ by indie developers, for indie developers.**
