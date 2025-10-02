# SafePrompt

**API-first prompt injection protection for AI applications.**

One POST request secures your LLM from attacks. No complex setup, no ML expertise required.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/safeprompt.svg)](https://www.npmjs.com/package/safeprompt)
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
| **Accuracy** | 98% | ~60% | ~30% |
| **Speed** | ~350ms avg | ~300ms | Instant |
| **Prompt Injection Detection** | ✅ | ❌ | ❌ |
| **External Reference Detection** | ✅ | ❌ | ❌ |
| **Context Awareness** | ✅ | ❌ | ❌ |
| **Pricing** | $29/mo | Free* | Free |

\* OpenAI Moderation doesn't detect prompt injection attacks

---

## 🎯 Features

- **🛡️ 2-Pass Validation** - Fast pattern matching + deep AI analysis
- **📍 External Reference Detection** - Catches "fetch this URL" attacks (95% accuracy)
- **⚡ Blazing Fast** - Pattern detection catches threats instantly, ~350ms avg total
- **💰 Affordable Pricing** - $29/month for unlimited access
- **🔒 Privacy Focused** - No data retention, SSL encrypted
- **📊 Real-time Dashboard** - Monitor threats and API usage

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
- [Next.js Chatbot](./examples/nextjs-chatbot) - Full-stack AI chat with SafePrompt
- [Express API](./examples/express-api) - REST API integration
- More examples coming soon!

---

## 🔥 Live Demo

Try it yourself: **[safeprompt.dev/playground](https://safeprompt.dev/playground)**

Test real-world attack examples:
- System prompt extraction
- Jailbreak attempts
- External reference attacks
- Multi-language exploits

---

## 📚 Documentation

- [Quick Start Guide](./docs/quickstart.md)
- [API Reference](./docs/api-reference.md)
- [Migration Guide](./docs/migration.md)
- [Best Practices](./docs/best-practices.md)

**Full docs**: [safeprompt.dev/docs](https://safeprompt.dev/docs)

---

## 💡 How It Works

SafePrompt uses a **hardened 2-pass validation system**:

### Pass 1: Pattern + External Reference Detection (67% of requests)
- Instant pattern matching (<1ms)
- External reference detection (URLs, file paths)
- Zero cost, maximum speed

### Pass 2: AI-Powered Deep Analysis (33% of requests)
- Small model quick screening (Llama 8B / Gemini 2.0)
- Large model validation for edge cases (Gemini 2.5 / Llama 70B)
- Context-aware threat detection

**Result**: 98% accuracy, ~350ms average response time

---

## 🏢 Who Uses SafePrompt?

Perfect for:
- **Indie Developers** - Ship fast without security headaches
- **Startups** - Enterprise security at indie pricing
- **AI Product Builders** - Focus on features, not security
- **Chatbot Developers** - Protect customer-facing AI
- **API Developers** - Secure your AI endpoints

---

## 🚀 Get Started

### 1. Sign Up
Get your API key: **[safeprompt.dev/signup](https://safeprompt.dev/signup)**

**Pricing**: $29/month

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
  const validation = await client.check(message);

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
- **Twitter**: [@safeprompt](https://twitter.com/safeprompt)

---

## ⭐ Show Your Support

If SafePrompt helps secure your AI, give us a star! ⭐

**Built with ❤️ by indie developers, for indie developers.**
