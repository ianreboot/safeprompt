# Migration Guide

**Last Updated:** October 2025

This guide helps existing SafePrompt users adopt the latest features, including threat intelligence improvements and checking conversations in one call.

---

## 🎯 What's New

### For All Users
- **Conversations**: send the turns you want judged together in one check
- **X-User-IP Header**: Required for threat intelligence correlation
- **Enhanced Detection**: Improved pattern matching and external reference detection

---

## 🚀 Quick Migration Checklist

- [ ] Update SafePrompt SDK to latest version (`npm update safeprompt`)
- [ ] Add `X-User-IP` header to pass end user IP addresses (required)
- [ ] (Optional) Send conversation turns that must be judged together in one check
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

## 🔄 Step 3: Checking Conversations (Optional)

SafePrompt judges every check on its own. To have several turns judged together, send them together in one check.

```javascript
import SafePrompt from 'safeprompt';
const client = new SafePrompt({ apiKey: process.env.SAFEPROMPT_API_KEY });

app.post('/chat', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // The recent turns your app is about to send to the model, plus the new message
  const turns = [...req.session.history.slice(-5), { role: 'user', content: req.body.message }];
  const transcript = turns.map((t) => `${t.role}: ${t.content}`).join('\n');

  const validation = await client.check(transcript, { userIP: clientIp });

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

The `session_token` / `sessionToken` field is accepted for older integrations and does not change the verdict. Keep conversation state and authorization in your application.

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
  "processingTime": 89,
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

### Issue: An attack spread over several messages passes
**Problem:** Each message passes when checked alone.

**Solution:** SafePrompt judges each check on its own and keeps no session state. Send the recent turns together in one check (see [multi-turn.md](./multi-turn.md)).

---

## 📅 Release Timeline

- **Phase 1A** (October 2025): Threat intelligence and the X-User-IP header
- **Custom Lists** (October 2025): Business-specific whitelist/blacklist customization
- **External Reference Detection** (September 2025): detects URL, IP and file-path references in prompts

---

## 🆘 Need Help?

- **Documentation**: [safeprompt.dev/docs](https://safeprompt.dev/docs)
- **Support**: support@safeprompt.dev
- **Examples**: See [examples/](../examples) directory

---

**Migration complete!** Your application now benefits from enhanced threat intelligence.
