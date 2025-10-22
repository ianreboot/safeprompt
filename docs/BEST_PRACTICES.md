# Best Practices Guide

**Last Updated:** October 2025

Best practices for using SafePrompt effectively, including performance optimization, error handling, and security hardening.

---

## 📋 Table of Contents

1. [Session Token Management](#session-token-management)
2. [Performance Optimization](#performance-optimization)
3. [Error Handling](#error-handling)
4. [Privacy & Compliance](#privacy--compliance)
5. [Security Hardening](#security-hardening)
6. [Monitoring & Alerts](#monitoring--alerts)

---

## 🔄 Session Token Management

### Best Practices

1. **Store per user, not globally**
   ```javascript
   // ✅ Good - per user
   const userSession = sessions.get(userId);

   // ❌ Bad - shared across users
   let globalSessionToken;
   ```

2. **Expire tokens client-side**
   ```javascript
   // Store with timestamp
   const sessionData = {
     token: result.session_token,
     createdAt: Date.now()
   };

   // Check expiry (2 hours)
   const isExpired = Date.now() - sessionData.createdAt > 2 * 60 * 60 * 1000;
   ```

3. **Clear on logout**
   ```javascript
   app.post('/logout', (req, res) => {
     sessions.delete(req.user.id);
     res.clearCookie('safeprompt_session');
   });
   ```

### Session Storage Options

#### Development: In-Memory Map
```javascript
// Simple but not production-ready
const sessions = new Map();
sessions.set(userId, sessionToken);
```

#### Production: Redis
```javascript
// Scalable and persistent
await redis.setex(
  `session:${userId}`,
  7200,  // 2 hours TTL
  sessionToken
);
```

#### Stateless: HTTP-Only Cookies
```javascript
// No server-side storage needed
res.cookie('safeprompt_session', sessionToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 2 * 60 * 60 * 1000  // 2 hours
});
```

---

## ⚡ Performance Optimization

### 1. Cache Safe Responses (Advanced)

```javascript
// ⚠️ Only cache if you understand the risks

const cache = new Map();

async function checkWithCache(prompt) {
  // Hash the prompt
  const hash = crypto.createHash('sha256').update(prompt).digest('hex');

  // Check cache
  if (cache.has(hash)) {
    const cached = cache.get(hash);
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min TTL
      return cached.result;
    }
  }

  // Validate
  const result = await client.check(prompt);

  // Cache if safe (NEVER cache unsafe prompts)
  if (result.safe) {
    cache.set(hash, {
      result,
      timestamp: Date.now()
    });
  }

  return result;
}
```

**⚠️ Warning:** Caching has security implications. Only cache:
- Exact string matches (hash-based)
- Safe responses (never cache threats)
- Short TTLs (5-10 minutes max)
- Non-sensitive applications

### 2. Parallel Validation (Batch API)

```javascript
// Validate multiple prompts in one request
const results = await client.checkBatch([
  'First prompt',
  'Second prompt',
  'Third prompt'
]);

// Process results
results.forEach((result, index) => {
  if (!result.safe) {
    console.log(`Prompt ${index} blocked:`, result.threats);
  }
});
```

### 3. Fail-Open Strategy (Downtime Handling)

```javascript
async function validateWithFallback(prompt) {
  try {
    const result = await client.check(prompt, {
      timeout: 5000  // 5 second timeout
    });
    return result;
  } catch (error) {
    // SafePrompt is down - fail open (allow request)
    console.error('SafePrompt unavailable:', error);

    // Log for review
    await logger.warn('safeprompt_down', {
      prompt: prompt.substring(0, 100),
      error: error.message
    });

    // Allow request to proceed
    return { safe: true, failedOpen: true };
  }
}
```

**⚠️ Fail-Open Trade-Off:**
- **Pros**: App stays online during SafePrompt outages
- **Cons**: Temporarily vulnerable to attacks
- **Recommendation**: Fail-open for low-risk apps, fail-closed for high-security apps

---

## ⚠️ Error Handling

### Comprehensive Error Handling

```javascript
async function robustValidation(prompt, clientIp) {
  try {
    const result = await client.check(prompt, { userIP: clientIp });

    // Handle unsafe prompts
    if (!result.safe) {
      return {
        status: 400,
        error: 'UNSAFE_INPUT',
        message: 'Security check failed',
        threats: result.threats
      };
    }

    return { status: 200, result };

  } catch (error) {
    // Network errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('SafePrompt network error:', error);
      // Fail open or retry
      return { status: 200, result: { safe: true, failedOpen: true } };
    }

    // API errors
    if (error.response?.status === 429) {
      // Rate limit - wait and retry
      await sleep(1000);
      return robustValidation(prompt, clientIp);
    }

    if (error.response?.status === 401) {
      // Invalid API key
      return {
        status: 500,
        error: 'CONFIGURATION_ERROR',
        message: 'API authentication failed'
      };
    }

    // Unknown error - fail closed (reject request)
    return {
      status: 500,
      error: 'VALIDATION_ERROR',
      message: 'Security check unavailable'
    };
  }
}
```

---

## 🔒 Privacy & Compliance

### GDPR/CCPA Compliance

1. **Data Deletion Requests**
   ```javascript
   // User requests data deletion
   await client.privacy.delete();
   ```

2. **Data Export Requests**
   ```javascript
   // User requests data export
   const data = await client.privacy.export();
   res.json(data);
   ```

3. **Opt-Out of Intelligence Sharing (Paid tiers)**
   ```javascript
   await client.preferences.update({
     contribute_intelligence: false
   });
   ```

### Privacy-First Practices

- ✅ **Always** pass end-user IP (not your server IP) for threat intelligence
- ✅ **Never** log full prompts in your application
- ✅ **Use** session tokens for multi-turn conversations
- ✅ **Enable** automatic PII deletion (24-hour window)
- ❌ **Don't** store SafePrompt responses long-term
- ❌ **Don't** share IP addresses with third parties

---

## 🛡️ Security Hardening

### 1. Validate Before LLM, Not After

```javascript
// ✅ Correct - validate before LLM
const validation = await client.check(userPrompt);
if (!validation.safe) {
  return res.status(400).json({ error: 'Invalid input' });
}
const llmResponse = await openai.chat(userPrompt);

// ❌ Wrong - validate after LLM (too late!)
const llmResponse = await openai.chat(userPrompt);
const validation = await client.check(userPrompt);
```

### 2. Never Trust Client-Side Validation

```javascript
// ❌ Bad - client can bypass
// Client: await safeprompt.check() then send to server

// ✅ Good - validate server-side
app.post('/api/chat', async (req, res) => {
  const validation = await client.check(req.body.message);
  // ...
});
```

### 3. Log Blocked Attempts

```javascript
const result = await client.check(prompt, { userIP: clientIp });

if (!result.safe) {
  await securityLogger.log({
    event: 'threat_blocked',
    ip: clientIp,
    threats: result.threats,
    prompt: prompt.substring(0, 100), // Partial for privacy
    timestamp: new Date()
  });
}
```

### 4. Rate Limit Your Endpoints

```javascript
// Combine SafePrompt with rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per window
});

app.post('/api/chat', limiter, async (req, res) => {
  const validation = await client.check(req.body.message);
  // ...
});
```

---

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

1. **Validation Rate**
   ```javascript
   // Track safe vs unsafe ratio
   metrics.increment('safeprompt.validation', {
     result: result.safe ? 'safe' : 'unsafe'
   });
   ```

2. **Threat Detection Rate**
   ```javascript
   // Monitor detected threats
   if (!result.safe) {
     metrics.increment('safeprompt.threats_blocked', {
       threat_type: result.threats[0]
     });
   }
   ```

3. **Response Times**
   ```javascript
   const start = Date.now();
   const result = await client.check(prompt);
   const duration = Date.now() - start;

   metrics.timing('safeprompt.latency', duration);
   ```

### Alert Thresholds

Set up alerts for:
- **Threat spike**: >10% unsafe prompts in 1 hour
- **High latency**: >5 seconds average response time
- **Failed validations**: >1% error rate
- **API errors**: >0.1% authentication failures

### Dashboard Monitoring

Check [Admin Dashboard](https://dashboard.safeprompt.dev/admin) daily for:
- Intelligence metrics (samples collected, patterns discovered)
- Threat detection trends
- Error rates and failed jobs
- Usage statistics per tier

---

## 🎯 Quick Reference

### Production Checklist

- [ ] Session tokens implemented for multi-turn conversations
- [ ] Proper error handling (fail-open or fail-closed strategy)
- [ ] X-User-IP header passed for threat intelligence correlation
- [ ] Monitoring and alerts configured
- [ ] Privacy controls documented for users
- [ ] Rate limiting on API endpoints
- [ ] Security logging for blocked attempts
- [ ] Custom lists configured (paid tiers)

---

## 📚 Additional Resources

- **Migration Guide**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **HTTP API Reference**: [http-api.md](./http-api.md)
- **Custom Lists**: [custom-lists.md](./custom-lists.md)
- **Multi-Turn Protection**: [multi-turn.md](./multi-turn.md)
- **Code Examples**: [/examples](../examples/)
- **Dashboard**: [dashboard.safeprompt.dev](https://dashboard.safeprompt.dev)

---

## 🤝 Need Help?

- **Documentation**: [safeprompt.dev/docs](https://safeprompt.dev/docs)
- **Support**: support@safeprompt.dev

---

**Follow these best practices to maximize protection while minimizing false positives.**
