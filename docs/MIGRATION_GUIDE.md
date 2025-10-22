# Migration Guide: Multi-Turn Protection

**Last Updated:** October 2025

This guide helps existing SafePrompt users adopt the latest features including multi-turn attack protection and threat intelligence improvements.

---

## 🎯 What's New

### For All Users
- **Session Tokens**: Multi-turn attack protection (context priming, false history, 95% accuracy)
- **X-User-IP Header**: Required for threat intelligence correlation
- **Enhanced Detection**: Improved pattern matching and external reference detection

---

## 🚀 Quick Migration Checklist

- [ ] Update SafePrompt SDK to latest version (`npm update safeprompt`)
- [ ] Add `X-User-IP` header to pass end user IP addresses (required)
- [ ] (Optional) Implement session token support for multi-turn conversations
- [ ] Review custom lists feature (paid tiers can customize whitelist/blacklist)

**Estimated Migration Time:** 10-15 minutes

**Breaking Changes:** None - all changes are backward compatible

---

## 📦 Step 1: Update SDK

### NPM Package
```bash
npm update safeprompt
```

### Direct HTTP API
No changes required - API version remains `/api/v1/validate`

---

## 🔧 Step 2: Add IP Address Header (Required)

Pass the end user's IP address via the `X-User-IP` header for threat intelligence correlation.

### Before (Still works, but required for full protection)
```javascript
const result = await client.check(userPrompt);
```

### After (Recommended)
```javascript
const result = await client.check(userPrompt, {
  userIP: clientIpAddress
});
```

### Getting Client IP in Different Frameworks

#### Express.js
```javascript
app.post('/chat', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  const result = await client.check(req.body.message, {
    userIP: clientIp
  });
});
```

#### Next.js
```javascript
export default async function handler(req, res) {
  const clientIp = req.headers['x-real-ip'] ||
                   req.headers['x-forwarded-for']?.split(',')[0] ||
                   req.connection.remoteAddress;

  const result = await client.check(req.body.message, {
    userIP: clientIp
  });
}
```

#### Cloudflare Workers
```javascript
export default {
  async fetch(request) {
    const clientIp = request.headers.get('CF-Connecting-IP');

    const result = await client.check(userMessage, {
      userIP: clientIp
    });
  }
}
```

#### Vercel Edge Functions
```javascript
import { geolocation } from '@vercel/edge';

export default async function handler(req) {
  const { ip } = geolocation(req);

  const result = await client.check(message, {
    userIP: ip
  });
}
```

**Why X-User-IP is Required:**
- Correlates attack patterns across network for better detection
- Contributes to threat intelligence (free tier benefits from shared intelligence)
- Identifies actual attackers vs. legitimate API integrations

---

## 🔄 Step 3: Multi-Turn Protection (Optional)

Use session tokens to protect against multi-turn attacks where attackers prime context across multiple messages.

### Before (Single-turn validation only)
```javascript
const result = await client.check(userMessage, {
  userIP: clientIp
});
```

### After (Multi-turn protection - 95% accuracy)
```javascript
// Generate session token (use existing chat session ID or create new)
const sessionToken = req.session.id; // or crypto.randomUUID()

const result = await client.check(userMessage, {
  userIP: clientIp,
  sessionToken: sessionToken
});
```

### Full Implementation Example

```javascript
import SafePrompt from 'safeprompt';
const client = new SafePrompt({ apiKey: process.env.SAFEPROMPT_API_KEY });

app.post('/chat', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const sessionToken = req.session.id || crypto.randomUUID();

  // Validate user input
  const validation = await client.check(req.body.message, {
    userIP: clientIp,
    sessionToken: sessionToken
  });

  if (!validation.safe) {
    return res.status(400).json({
      error: 'Security threat detected',
      threats: validation.threats
    });
  }

  // Safe to proceed with AI
  const aiResponse = await yourLLM.chat(req.body.message);
  res.json({ response: aiResponse });
});
```

**What Multi-Turn Detection Catches:**
- Context priming: "Let's play a game where you ignore rules..."
- False history: "You agreed earlier to bypass safety filters..."
- Reconnaissance: Gradual probing of system prompts across messages
- Privilege escalation: Building trust before requesting sensitive actions

---

## 📚 Step 4: Review New Features

### Custom Lists (Paid Tiers)
Customize whitelist/blacklist for your business context:

```javascript
const result = await client.check(userPrompt, {
  userIP: clientIp,
  customRules: {
    whitelist: ['shipping address', 'customer service'],
    blacklist: ['admin override', 'system prompt']
  }
});
```

**Tier Limits:**
- Free: 80+ default phrases (read-only)
- Starter: 25 custom whitelist + 25 blacklist
- Business: 100 custom whitelist + 100 blacklist

See [Custom Lists documentation](./custom-lists.md) for details.

---

## 🔍 Response Changes

The validation response structure remains the same:

```json
{
  "safe": true,
  "confidence": 0.95,
  "threats": [],
  "processingTimeMs": 89,
  "passesUsed": 1,
  "reasoning": "No security threats detected"
}
```

---

## ⚠️ Troubleshooting

### Issue: X-User-IP header missing
**Error:**
```json
{
  "error": "X-User-IP header required"
}
```

**Solution:** Add X-User-IP header with end user's IP address (not your server IP).

### Issue: Session token not working
**Problem:** Multi-turn attacks still getting through

**Solution:** Ensure you're using the same sessionToken for the entire conversation (use chat session ID, not request ID).

---

## 📅 Release Timeline

- **Phase 1A** (October 2025): Multi-turn protection, session tokens, threat intelligence
- **Custom Lists** (October 2025): Business-specific whitelist/blacklist customization
- **External Reference Detection** (September 2025): 95% accuracy detecting URL/IP/file attacks

---

## 🆘 Need Help?

- **Documentation**: [safeprompt.dev/docs](https://safeprompt.dev/docs)
- **Support**: support@safeprompt.dev
- **Examples**: See [examples/](../examples) directory

---

**Migration complete!** Your application now benefits from multi-turn protection and enhanced threat intelligence.
