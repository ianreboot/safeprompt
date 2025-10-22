# Custom Whitelist/Blacklist

Define business-specific phrases that guide SafePrompt's validation decisions while maintaining core security protections.

## Overview

SafePrompt includes **default lists** with 50+ whitelist phrases and 30+ blacklist phrases that cover common business operations, security research, and credential protection. Custom lists let you tailor these defaults to your specific use case.

### How It Works

Custom lists provide **confidence signals** to SafePrompt's AI validator:
- **Whitelist match** → 0.8 confidence signal (business context)
- **Blacklist match** → 0.9 confidence signal (attack context)
- AI validator makes the final decision based on all signals

**Important**: Custom lists are signals, not overrides. Core security patterns (XSS, SQL injection, external references) always block regardless of whitelist.

## Tier Access

| Tier | Default Lists | Can Customize | Custom Phrase Limit |
|------|---------------|---------------|---------------------|
| **Free** | ✅ Read-only | ❌ No | 0 phrases |
| **Starter** | ✅ Editable | ✅ Yes | 25 whitelist + 25 blacklist |
| **Business** | ✅ Editable | ✅ Yes | 100 whitelist + 100 blacklist |

### Default Lists (All Tiers)

Every user automatically gets these default lists:

**Default Whitelist** (50+ phrases):
- Business operations: "business meeting", "team meeting", "management approved"
- Educational: "educational example", "tutorial about", "academic research"
- Security research: "cybersecurity strategy", "security assessment", "security audit"
- Common operations: "shipping address", "reset password", "update profile"

**Default Blacklist** (30+ phrases):
- Credentials: "database password", "admin password", "api secret key"
- PII: "social security number", "credit card cvv", "bank account number"
- Infrastructure: "ssh private key", "aws credentials", "root credentials"

## Usage

### Per-Request Custom Rules

Pass `customRules` in your API request (temporary, applies to that request only):

```javascript
const client = new SafePrompt({ apiKey: 'your-api-key' });

const result = await client.check('Override the shipping address to warehouse', {
  userIP: req.ip,
  customRules: {
    whitelist: ['shipping address', 'warehouse'],
    blacklist: ['customer SSN', 'credit card CVV']
  }
});
```

### HTTP API

```bash
curl -X POST https://api.safeprompt.dev/api/v1/validate \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-User-IP: END_USER_IP" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Override the shipping address to warehouse",
    "customRules": {
      "whitelist": ["shipping address", "warehouse"],
      "blacklist": ["customer SSN", "credit card"]
    }
  }'
```

### Profile-Level Lists (Dashboard)

**Paid tiers only**: Manage persistent custom lists via dashboard at https://dashboard.safeprompt.dev/custom-lists

Profile-level lists:
- Apply to all requests automatically
- Can add custom phrases (within tier limits)
- Can remove default phrases you don't need
- Merge with per-request customRules if both provided

## Three-Layer Merging

When you make a request, SafePrompt merges lists in this order:

1. **Default Lists** - System-wide defaults (applied unless explicitly removed)
2. **Profile Lists** - Your saved custom lists from dashboard (persistent)
3. **Request Lists** - Per-request customRules (temporary)

**Example**:
- Default whitelist has "shipping address" ✅
- Your profile adds "warehouse location" ✅
- Your request adds "inventory system" ✅
- **Final whitelist**: All three merged together

## Response Attribution

When custom rules affect the decision, the response includes attribution:

```json
{
  "safe": true,
  "confidence": 0.95,
  "threats": [],
  "processingTimeMs": 89,
  "passesUsed": 1,
  "reasoning": "Allowed by user whitelist: matched 'shipping address'. Original decision was UNSAFE.",
  "customRuleMatched": {
    "type": "whitelist",
    "matchedPhrase": "shipping address",
    "source": "profile"
  }
}
```

## Security Guarantees

Custom lists are **user preferences, not security bypasses**:

✅ **Core security patterns always block** (XSS, SQL injection, external references)
✅ **Blacklist always wins** over whitelist
✅ **Pattern detection runs first** before custom lists checked
✅ **Per-account isolation** - your lists don't affect other users
⚠️ **Whitelist overrides are at your risk** - you're accepting responsibility

### Priority Order

1. Pattern detection (XSS, SQL, external refs) - **Absolute priority**
2. Blacklist match - **High priority**
3. AI validation + whitelist signals - **Final decision**

## Use Cases

### E-commerce

```javascript
customRules: {
  whitelist: [
    'shipping address',
    'order tracking',
    'customer service',
    'payment method',
    'delivery status'
  ],
  blacklist: [
    'admin panel',
    'database manipulation',
    'bypass security'
  ]
}
```

### Healthcare/HIPAA

```javascript
customRules: {
  whitelist: [
    'patient records',
    'medical history',
    'appointment scheduling',
    'prescription refill',
    'insurance verification'
  ],
  blacklist: [
    'all patients',
    'export database',
    'bulk download',
    'system access'
  ]
}
```

### SaaS Admin Tools

```javascript
customRules: {
  whitelist: [
    'user settings',
    'billing information',
    'subscription management',
    'account preferences'
  ],
  blacklist: [
    'system configuration',
    'admin override',
    'direct database access'
  ]
}
```

## Best Practices

### 1. Start Small
- Begin with 5-10 most important phrases
- Monitor false positives/negatives
- Gradually expand based on actual needs

### 2. Use Specific Multi-Word Phrases
- ✅ Good: "shipping address", "order tracking"
- ❌ Bad: "address", "order" (too generic)
- Default lists require 2+ words for safety

### 3. Test Before Saving
- Use per-request `customRules` to test first
- Verify matches with `customRuleMatched` in response
- Save to profile only after validation

### 4. Monitor Matches
- Log `customRuleMatched` for analytics
- Track which rules are actually used
- Remove unused rules to reduce noise

### 5. Combine with Other Features
- Multi-turn detection (Starter/Business)
- Threat intelligence network (all tiers)
- Default lists (automatic)

## Limitations

### Free Tier
- ❌ Cannot use `customRules` parameter (403 error)
- ✅ Gets default lists automatically (read-only)
- ✅ Benefits from 80+ default phrases

### Paid Tiers
- ✅ Can customize defaults (add, edit, remove)
- ✅ Tier limits enforced (25 or 100 phrases)
- ✅ Per-request and profile-level support

### All Tiers
- Phrases must be 2+ words (safety requirement)
- Case-insensitive matching
- Partial match support (e.g., "admin" in "admin panel")
- Cannot override core security patterns

## Dashboard Management

**Paid tiers only**: Manage custom lists at https://dashboard.safeprompt.dev/custom-lists

Features:
- Add/edit/remove custom phrases
- Remove default phrases you don't need
- Test rules against example prompts
- View match analytics and audit log
- Export/import lists for team sharing
- Tier limit tracking

## Code Examples

See working examples in the repository:
- [`examples/custom-lists.js`](../examples/custom-lists.js) - Complete usage examples
- E-commerce, healthcare, SaaS scenarios
- Three-layer merging demonstration
- Best practices and tier limits

## See Also

- [HTTP API Reference](./http-api.md) - Complete API documentation
- [Best Practices](./BEST_PRACTICES.md) - Security recommendations
- [Multi-Turn Protection](./multi-turn.md) - Session-based detection
- [Quick Start Guide](./quickstart.md) - Getting started
