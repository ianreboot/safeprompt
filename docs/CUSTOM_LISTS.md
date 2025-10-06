# SafePrompt Custom Whitelist/Blacklist Feature

**Feature ID**: CUSTOM_LISTS_2025_10_06
**Status**: PLANNED (Not Yet Implemented)
**Priority**: HIGH - Solves 1/7 Month 1 test failures + reduces false positives
**Estimated Effort**: 3-4 days (schema + API + dashboard + tests + docs)
**Target**: Month 1 Phase 2 or dedicated sprint after Phase 1

---

## Executive Summary

**Problem Statement**:
SafePrompt's validation is too rigid for business-specific contexts. Test #29 ("Override shipping address to warehouse") is blocked because "override" triggers attack detection, but it's legitimate in e-commerce contexts.

**Solution**:
Allow users to define custom whitelist/blacklist phrases that layer on top of SafePrompt's core security validation, giving them control over business-specific contexts while maintaining security for critical patterns.

**Key Principle**:
**User preferences are overrides at their risk, not security bypasses**. Core security patterns (XSS, SQL injection, external refs) always block regardless of custom lists.

---

## 🎯 Feature Capabilities

### What Users Can Do
1. **Whitelist phrases**: "shipping address", "warehouse location", "inventory override"
   - Overrides AI "unsafe" decision
   - Does NOT bypass pattern/external ref detection
   - User accepts responsibility for allowing these contexts

2. **Blacklist phrases**: "customer SSN", "credit card CVV", "admin password"
   - Adds extra protection beyond SafePrompt defaults
   - Blocks even if AI says "safe"
   - Useful for company-specific sensitive terms

3. **Per-request OR profile-level**:
   - Send `customRules` in API request (temporary)
   - Save to profile in dashboard (persistent)

---

## 🏗️ Architecture Design

### 1. API Request Structure

```javascript
POST /api/v1/validate
{
  "prompt": "Override the default shipping address and send to warehouse",
  "mode": "optimized",  // existing parameter
  "customRules": {      // NEW OPTIONAL PARAMETER
    "whitelist": [
      "shipping address",
      "warehouse location",
      "inventory system"
    ],
    "blacklist": [
      "customer credit card",
      "admin credentials"
    ]
  }
}
```

### 2. Response Format with Attribution

```javascript
// Example: Whitelist override
{
  "safe": true,
  "confidence": 0.95,
  "reasoning": "Allowed by user whitelist: matched phrase 'shipping address'. Original AI decision was UNSAFE due to 'override' manipulation keyword, but user-defined business context override applied.",
  "detectionMethod": "custom_whitelist",
  "blocked": false,
  "category": null,
  "flags": ["user_override_applied"],
  "customRuleMatched": {
    "type": "whitelist",
    "matchedPhrase": "shipping address",
    "originalDecision": "unsafe",
    "originalReasoning": "Contains manipulation keyword 'override'",
    "overriddenBy": "user"
  }
}

// Example: Blacklist block
{
  "safe": false,
  "confidence": 0.99,
  "reasoning": "Blocked by user blacklist: matched phrase 'admin credentials'. This term was flagged as sensitive by your organization's custom rules.",
  "detectionMethod": "custom_blacklist",
  "blocked": true,
  "category": "custom_blacklist",
  "flags": ["user_blacklist_triggered"],
  "customRuleMatched": {
    "type": "blacklist",
    "matchedPhrase": "admin credentials",
    "originalDecision": "safe",  // AI would have allowed it
    "overriddenBy": "user"
  }
}
```

---

## 🛡️ Security Safeguards (CRITICAL - READ CAREFULLY)

### 1. Input Sanitization (MANDATORY)

**File**: `/home/projects/safeprompt/api/lib/custom-rules-sanitizer.js` (NEW)

```javascript
/**
 * SECURITY-CRITICAL: Sanitize custom rules to prevent injection attacks
 *
 * Hard-fought knowledge:
 * - Never trust user input, even from authenticated users
 * - Whitelist can't bypass core security (XSS, SQL, external refs)
 * - Simple substring matching only - NO REGEX from users
 */

const LIMITS = {
  MAX_RULES: 50,              // Prevent DoS via massive lists
  MAX_PHRASE_LENGTH: 100,     // Prevent buffer overflow attempts
  MIN_PHRASE_LENGTH: 3,       // Prevent single-char bypasses like "a" whitelisting everything
  ALLOWED_CHARS: /^[a-zA-Z0-9\s\-_.,'"]+$/  // Alphanumeric + basic punctuation only
};

// FORBIDDEN: Keywords that would create security bypasses
const FORBIDDEN_WHITELIST_PATTERNS = [
  /ignore.*previous/i,
  /bypass.*security/i,
  /override.*system/i,
  /disable.*validation/i,
  /exec/i,
  /<script/i,
  /javascript:/i,
  /eval\(/i,
  /base64/i,
  /\\x[0-9a-f]{2}/i  // Hex encoding
];

function sanitizeCustomRules(rules, tier = 'free') {
  if (!rules || typeof rules !== 'object') return null;

  const tierLimits = {
    free: 0,
    starter: 10,
    business: 50,
    enterprise: 200,
    internal: 50  // Internal testing tier
  };

  const maxRules = tierLimits[tier] || 0;
  if (maxRules === 0) return null;  // Feature disabled for this tier

  const sanitized = {
    whitelist: [],
    blacklist: []
  };

  // Sanitize whitelist
  if (Array.isArray(rules.whitelist)) {
    sanitized.whitelist = rules.whitelist
      .slice(0, maxRules)
      .filter(phrase => {
        if (typeof phrase !== 'string') return false;
        if (phrase.length < LIMITS.MIN_PHRASE_LENGTH) return false;
        if (phrase.length > LIMITS.MAX_PHRASE_LENGTH) return false;
        if (!LIMITS.ALLOWED_CHARS.test(phrase)) return false;

        // Block dangerous bypass attempts
        if (FORBIDDEN_WHITELIST_PATTERNS.some(pattern => pattern.test(phrase))) {
          console.warn(`Blocked forbidden whitelist phrase: ${phrase}`);
          return false;
        }

        return true;
      })
      .map(phrase => phrase.toLowerCase().trim());
  }

  // Sanitize blacklist (less strict - they're adding protection)
  if (Array.isArray(rules.blacklist)) {
    sanitized.blacklist = rules.blacklist
      .slice(0, maxRules)
      .filter(phrase => {
        if (typeof phrase !== 'string') return false;
        if (phrase.length < LIMITS.MIN_PHRASE_LENGTH) return false;
        if (phrase.length > LIMITS.MAX_PHRASE_LENGTH) return false;
        if (!LIMITS.ALLOWED_CHARS.test(phrase)) return false;
        return true;
      })
      .map(phrase => phrase.toLowerCase().trim());
  }

  return sanitized;
}

module.exports = { sanitizeCustomRules, LIMITS };
```

### 2. Validation Pipeline Integration (ORDER MATTERS!)

**File**: `/home/projects/safeprompt/api/lib/ai-validator-hardened.js` (MODIFY)

```javascript
/**
 * CRITICAL VALIDATION ORDER
 *
 * This order ensures custom rules can't bypass core security:
 *
 * 1. Pattern Detection (XSS, SQL injection, command injection)
 *    → BLOCK immediately, custom whitelist CANNOT override
 *
 * 2. External Reference Detection (URLs, IPs, file paths)
 *    → BLOCK immediately, custom whitelist CANNOT override
 *
 * 3. Custom Blacklist Check
 *    → BLOCK if matched, adds user-defined protection
 *
 * 4. AI Validation (Pass 1 & Pass 2)
 *    → Get AI decision (safe/unsafe)
 *
 * 5. Custom Whitelist Check (FINAL OVERRIDE)
 *    → IF AI said unsafe AND whitelist matches
 *    → Override to safe with attribution
 *    → User accepts responsibility
 */

async function validateWithCustomRules(prompt, customRules, userId) {
  const result = {
    safe: true,
    confidence: 0,
    reasoning: '',
    detectionMethod: null,
    flags: [],
    customRuleMatched: null
  };

  // STEP 1: Pattern detection (CANNOT BE OVERRIDDEN)
  const patternResult = await patternDetection(prompt);
  if (patternResult.blocked) {
    return {
      ...patternResult,
      reasoning: patternResult.reasoning + ' (Core security patterns cannot be overridden by custom rules)',
      flags: [...patternResult.flags, 'custom_whitelist_blocked']
    };
  }

  // STEP 2: External reference detection (CANNOT BE OVERRIDDEN)
  const extRefResult = await externalReferenceDetection(prompt);
  if (extRefResult.blocked) {
    return {
      ...extRefResult,
      reasoning: extRefResult.reasoning + ' (External references cannot be whitelisted)',
      flags: [...extRefResult.flags, 'custom_whitelist_blocked']
    };
  }

  // STEP 3: Custom blacklist check (USER-DEFINED BLOCK)
  if (customRules?.blacklist?.length > 0) {
    const blacklistMatch = checkCustomBlacklist(prompt, customRules.blacklist);
    if (blacklistMatch) {
      await logCustomRuleUsage(userId, 'blacklist', blacklistMatch, 'blocked');
      return {
        safe: false,
        blocked: true,
        confidence: 0.99,
        reasoning: `Blocked by user blacklist: matched phrase '${blacklistMatch}'. This term was flagged as sensitive by your organization's custom rules.`,
        detectionMethod: 'custom_blacklist',
        category: 'custom_blacklist',
        flags: ['user_blacklist_triggered'],
        customRuleMatched: {
          type: 'blacklist',
          matchedPhrase: blacklistMatch,
          overriddenBy: 'user'
        }
      };
    }
  }

  // STEP 4: AI Validation (normal flow)
  const aiResult = await aiValidation(prompt);

  // STEP 5: Custom whitelist check (OVERRIDE IF AI BLOCKED)
  if (!aiResult.safe && customRules?.whitelist?.length > 0) {
    const whitelistMatch = checkCustomWhitelist(prompt, customRules.whitelist);
    if (whitelistMatch) {
      await logCustomRuleUsage(userId, 'whitelist', whitelistMatch, 'allowed');
      return {
        safe: true,
        blocked: false,
        confidence: 0.95,
        reasoning: `Allowed by user whitelist: matched phrase '${whitelistMatch}'. Original AI decision was UNSAFE (${aiResult.reasoning}), but user-defined business context override applied.`,
        detectionMethod: 'custom_whitelist',
        flags: ['user_override_applied'],
        customRuleMatched: {
          type: 'whitelist',
          matchedPhrase: whitelistMatch,
          originalDecision: 'unsafe',
          originalReasoning: aiResult.reasoning,
          overriddenBy: 'user'
        }
      };
    }
  }

  // No custom rule matched, return AI result
  return aiResult;
}

function checkCustomBlacklist(prompt, blacklist) {
  const lowerPrompt = prompt.toLowerCase();
  for (const phrase of blacklist) {
    if (lowerPrompt.includes(phrase)) {
      return phrase;
    }
  }
  return null;
}

function checkCustomWhitelist(prompt, whitelist) {
  const lowerPrompt = prompt.toLowerCase();
  for (const phrase of whitelist) {
    if (lowerPrompt.includes(phrase)) {
      return phrase;
    }
  }
  return null;
}

async function logCustomRuleUsage(userId, ruleType, matchedPhrase, action) {
  // Log to usage_logs table for analytics and security audit
  await supabase.from('usage_logs').insert({
    user_id: userId,
    rule_type: ruleType,
    matched_phrase: matchedPhrase,
    action: action,
    timestamp: new Date()
  });
}
```

### 3. Database Schema

**File**: `/home/projects/safeprompt/supabase/migrations/YYYYMMDD_custom_rules.sql` (NEW)

```sql
-- Add custom rules to profiles table
ALTER TABLE profiles
  ADD COLUMN custom_whitelist TEXT[] DEFAULT '{}',
  ADD COLUMN custom_blacklist TEXT[] DEFAULT '{}',
  ADD COLUMN custom_rules_enabled BOOLEAN DEFAULT false;

-- Add index for faster lookups
CREATE INDEX idx_profiles_custom_rules ON profiles(id) WHERE custom_rules_enabled = true;

-- Add usage logging table
CREATE TABLE IF NOT EXISTS custom_rule_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,  -- 'whitelist' or 'blacklist'
  matched_phrase TEXT NOT NULL,
  action TEXT NOT NULL,     -- 'allowed' or 'blocked'
  prompt_preview TEXT,      -- First 200 chars for audit
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_rule_usage_user ON custom_rule_usage(user_id, timestamp DESC);

-- RLS policies
ALTER TABLE custom_rule_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY custom_rule_usage_select ON custom_rule_usage
  FOR SELECT USING (auth.uid() = user_id OR is_internal_user());

CREATE POLICY custom_rule_usage_insert ON custom_rule_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4. Rate Limiting by Tier

**File**: `/home/projects/safeprompt/api/lib/custom-rules-validator.js` (NEW)

```javascript
const TIER_LIMITS = {
  free: {
    enabled: false,
    maxRules: 0,
    maxWhitelist: 0,
    maxBlacklist: 0
  },
  starter: {
    enabled: true,
    maxRules: 10,      // Total combined
    maxWhitelist: 10,
    maxBlacklist: 10
  },
  business: {
    enabled: true,
    maxRules: 50,
    maxWhitelist: 50,
    maxBlacklist: 50
  },
  enterprise: {
    enabled: true,
    maxRules: 200,
    maxWhitelist: 200,
    maxBlacklist: 200
  },
  internal: {
    enabled: true,
    maxRules: 50,
    maxWhitelist: 50,
    maxBlacklist: 50
  }
};

function validateCustomRulesForTier(customRules, tier) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  if (!limits.enabled) {
    return {
      valid: false,
      error: 'Custom rules are not available on your current plan. Upgrade to Starter or higher.'
    };
  }

  const whitelistCount = customRules.whitelist?.length || 0;
  const blacklistCount = customRules.blacklist?.length || 0;

  if (whitelistCount > limits.maxWhitelist) {
    return {
      valid: false,
      error: `Whitelist limit exceeded. Your ${tier} plan allows ${limits.maxWhitelist} whitelist phrases, but ${whitelistCount} were provided.`
    };
  }

  if (blacklistCount > limits.maxBlacklist) {
    return {
      valid: false,
      error: `Blacklist limit exceeded. Your ${tier} plan allows ${limits.maxBlacklist} blacklist phrases, but ${blacklistCount} were provided.`
    };
  }

  return { valid: true };
}
```

---

## 📋 Implementation Checklist

### Phase 1: Backend (API & Database)
- [ ] Create `/home/projects/safeprompt/api/lib/custom-rules-sanitizer.js`
- [ ] Create `/home/projects/safeprompt/api/lib/custom-rules-validator.js`
- [ ] Modify `/home/projects/safeprompt/api/lib/ai-validator-hardened.js`
  - [ ] Add validation pipeline integration (steps 1-5)
  - [ ] Add `checkCustomBlacklist()` function
  - [ ] Add `checkCustomWhitelist()` function
  - [ ] Add `logCustomRuleUsage()` function
- [ ] Modify `/home/projects/safeprompt/api/safeprompt.js` (main endpoint)
  - [ ] Accept `customRules` parameter
  - [ ] Merge with profile-level rules if both exist
  - [ ] Pass sanitized rules to validator
- [ ] Create database migration `YYYYMMDD_custom_rules.sql`
  - [ ] Add columns to profiles table
  - [ ] Create usage logging table
  - [ ] Add RLS policies
- [ ] Deploy database migration to DEV
- [ ] Deploy database migration to PROD

### Phase 2: Testing
- [ ] Unit tests: `/home/projects/safeprompt/api/__tests__/custom-rules-sanitizer.test.js`
  - [ ] Test input sanitization (50+ tests)
  - [ ] Test forbidden pattern blocking
  - [ ] Test tier limits enforcement
  - [ ] Test character validation
- [ ] Unit tests: `/home/projects/safeprompt/api/__tests__/custom-rules-integration.test.js`
  - [ ] Test validation pipeline order (30+ tests)
  - [ ] Test whitelist override behavior
  - [ ] Test blacklist blocking behavior
  - [ ] Test core security patterns cannot be overridden
- [ ] Realistic tests: Add to `/home/projects/safeprompt/test-suite/realistic-test-suite.js`
  - [ ] Add custom_rules category (10 tests)
  - [ ] Test legitimate business override (Test #29)
  - [ ] Test XSS bypass attempt (should fail)
  - [ ] Test external ref bypass attempt (should fail)

### Phase 3: Dashboard UI
- [ ] Create `/home/projects/safeprompt/dashboard/src/pages/CustomRules.jsx`
  - [ ] Whitelist management (add/edit/delete)
  - [ ] Blacklist management (add/edit/delete)
  - [ ] Tier limit display
  - [ ] Preview functionality ("Test your rules")
  - [ ] Usage analytics (how many times did whitelist override?)
- [ ] Add navigation link in dashboard sidebar
- [ ] Add onboarding tooltip for new feature

### Phase 4: Documentation
- [ ] Update `/home/projects/safeprompt/CLAUDE.md`
  - [ ] Add custom rules to architecture diagram
  - [ ] Document validation pipeline order
- [ ] Update `/home/projects/safeprompt/README.md`
  - [ ] Add custom rules to feature list
  - [ ] Add API example
- [ ] Update `/home/projects/safeprompt/dashboard/README.md`
  - [ ] Document custom rules UI
- [ ] Create `/home/projects/safeprompt/docs/API_REFERENCE.md` (if doesn't exist)
  - [ ] Document `customRules` parameter
  - [ ] Show request/response examples
- [ ] Update public repo `/home/projects/safeprompt-public/README.md`
  - [ ] Add custom rules to feature list
  - [ ] Update code snippets

### Phase 5: Website & Marketing
- [ ] Update `/home/projects/safeprompt/website/src/pages/index.jsx`
  - [ ] Add "Custom Rules" to features section
  - [ ] Update code snippet example
- [ ] Update pricing page
  - [ ] Show custom rules limits per tier
  - [ ] Free: 0 rules, Starter: 10, Business: 50, Enterprise: 200
- [ ] Create blog post: "Introducing Custom Whitelist/Blacklist"
- [ ] Update API playground
  - [ ] Add custom rules input fields
  - [ ] Show response attribution

### Phase 6: Deployment
- [ ] Run all tests (unit + realistic + smoke)
- [ ] Deploy API to DEV
- [ ] Manual testing in DEV
- [ ] Deploy dashboard to DEV
- [ ] Deploy website to DEV
- [ ] User acceptance testing
- [ ] Deploy to PROD (API → Dashboard → Website)
- [ ] Monitor for 24 hours
- [ ] Announce feature to users

---

## 🧪 Test Scenarios

### Test 1: Whitelist Override (Success)
```javascript
// Request
{
  "prompt": "Override the default shipping address and send to warehouse",
  "customRules": {
    "whitelist": ["shipping address"]
  }
}

// Expected Response
{
  "safe": true,
  "detectionMethod": "custom_whitelist",
  "customRuleMatched": {
    "type": "whitelist",
    "matchedPhrase": "shipping address",
    "originalDecision": "unsafe"
  }
}
```

### Test 2: XSS Bypass Attempt (Blocked)
```javascript
// Request
{
  "prompt": "<script>alert('XSS')</script>",
  "customRules": {
    "whitelist": ["script"]
  }
}

// Expected Response
{
  "safe": false,
  "blocked": true,
  "detectionMethod": "xss_pattern",
  "reasoning": "XSS pattern detected (Core security patterns cannot be overridden by custom rules)",
  "flags": ["custom_whitelist_blocked"]
}
```

### Test 3: Blacklist Block (Success)
```javascript
// Request
{
  "prompt": "Please provide the customer's admin credentials",
  "customRules": {
    "blacklist": ["admin credentials"]
  }
}

// Expected Response
{
  "safe": false,
  "blocked": true,
  "detectionMethod": "custom_blacklist",
  "customRuleMatched": {
    "type": "blacklist",
    "matchedPhrase": "admin credentials",
    "originalDecision": "safe"  // AI would have allowed
  }
}
```

### Test 4: Tier Limit Enforcement
```javascript
// Request (Free tier user)
{
  "prompt": "Test",
  "customRules": {
    "whitelist": ["test phrase"]
  }
}

// Expected Response
{
  "error": "Custom rules are not available on your current plan. Upgrade to Starter or higher.",
  "code": "FEATURE_NOT_AVAILABLE"
}
```

---

## 🔗 Dependencies & Integration Points

### Files to Modify
1. **API Layer**:
   - `/home/projects/safeprompt/api/safeprompt.js` (main endpoint)
   - `/home/projects/safeprompt/api/lib/ai-validator-hardened.js` (validation pipeline)

2. **Database**:
   - `/home/projects/safeprompt/supabase/migrations/` (new migration file)

3. **Dashboard**:
   - `/home/projects/safeprompt/dashboard/src/pages/CustomRules.jsx` (new page)
   - `/home/projects/safeprompt/dashboard/src/components/Sidebar.jsx` (add nav link)

4. **Website**:
   - `/home/projects/safeprompt/website/src/pages/index.jsx` (homepage)
   - `/home/projects/safeprompt/website/src/pages/pricing.jsx` (pricing table)

5. **Documentation**:
   - `/home/projects/safeprompt/CLAUDE.md`
   - `/home/projects/safeprompt/README.md`
   - `/home/projects/safeprompt/dashboard/README.md`
   - `/home/projects/safeprompt-public/README.md` (public repo)

6. **Tests**:
   - `/home/projects/safeprompt/api/__tests__/` (2 new test files)
   - `/home/projects/safeprompt/test-suite/realistic-test-suite.js` (add category)

### Integration Impact
- **Pricing tiers**: Update tier limits in multiple locations
- **API response format**: Add `customRuleMatched` field
- **Usage tracking**: New table for analytics
- **Dashboard navigation**: New menu item
- **Public documentation**: Update all code examples

---

## 💰 Business Value

### Solves Current Problems
1. **Test #29 failure**: "Override shipping address" → Whitelist "shipping address"
2. **False positives**: Reduces support burden for legitimate business contexts
3. **Customer flexibility**: Each business has unique terminology

### Revenue Opportunity
- **Free tier**: 0 rules (upgrade CTA)
- **Starter tier**: 10 rules ($29/month)
- **Business tier**: 50 rules ($99/month)
- **Enterprise tier**: 200 rules (custom pricing)

### Analytics Insights
- Track which phrases are most commonly whitelisted
- Identify patterns for future AI training
- Dashboard shows: "Your whitelist overrode 47 blocks this month"

---

## 🚨 Security Audit Checklist

Before implementing, verify:
- [ ] Input sanitization prevents injection attacks
- [ ] XSS patterns cannot be whitelisted
- [ ] SQL injection patterns cannot be whitelisted
- [ ] External references cannot be whitelisted
- [ ] Tier limits enforced server-side (not client-side)
- [ ] Forbidden pattern list is comprehensive
- [ ] Character whitelist is restrictive
- [ ] Audit logging captures all overrides
- [ ] Rate limiting prevents abuse
- [ ] Clear attribution in responses

---

## 📈 Success Metrics

After implementation, track:
1. **Usage**: How many users enable custom rules?
2. **Override rate**: How often does whitelist override AI?
3. **False positive reduction**: Did support tickets decrease?
4. **Security incidents**: Any bypass attempts via custom rules?
5. **Upgrade conversions**: Do users upgrade for more rules?

**Target**:
- 20%+ of Business tier users enable custom rules
- 30%+ reduction in false positive support tickets
- 0 security bypasses via custom rules

---

## 🎓 Hard-Fought Knowledge for Future AI

### Critical Design Decisions

**1. Why substring matching instead of regex?**
- User-provided regex is a security nightmare (ReDoS, injection)
- Simple substring is predictable and safe
- Future: Could add "starts with" / "ends with" options, but NO REGEX

**2. Why can't whitelist override XSS/SQL/external refs?**
- These are objective security threats, not context-dependent
- "I want to allow XSS" is never a legitimate use case
- If user needs this, they should use a different product

**3. Why tier-based limits?**
- Prevents abuse (malicious users can't add 1000s of rules)
- Revenue opportunity (upsell feature)
- Forces users to prioritize their most important phrases

**4. Why log all custom rule usage?**
- Security audit trail
- Detect bypass attempts
- Analytics for product improvements
- Customer support ("Show me when my whitelist triggered")

**5. Why validate server-side, not client-side?**
- Client-side limits can be bypassed via API
- Never trust client-side validation for security features

### Common Pitfalls to Avoid

**❌ Don't**:
1. Allow regex in custom rules (ReDoS attack vector)
2. Apply whitelist before pattern detection (security bypass)
3. Store custom rules in request body only (loses context between requests)
4. Skip input sanitization ("they're authenticated users!")
5. Use client-side validation for tier limits

**✅ Do**:
1. Simple substring matching only
2. Core security patterns always win
3. Support both per-request and profile-level rules
4. Always sanitize, always validate
5. Enforce limits server-side

### Integration Complexity Map

**Easy (1-2 hours)**:
- Database schema
- Input sanitization
- Tier limit validation

**Medium (4-8 hours)**:
- Validation pipeline integration
- Response format updates
- Dashboard UI (basic)

**Hard (1-2 days)**:
- Comprehensive testing (50+ tests)
- Dashboard UI (advanced features)
- Documentation updates across all repos
- Website/marketing updates

**Total Estimate**: 3-4 days for complete implementation

---

## 📞 Questions for User Before Implementation

1. **Scope**: Per-request only, or also profile-level persistent rules?
   - **Recommendation**: Both (request overrides profile)

2. **Dashboard Priority**: Basic (add/delete) or advanced (preview, analytics)?
   - **Recommendation**: Start basic, iterate based on usage

3. **Free Tier**: 0 rules or allow 3-5 for trial?
   - **Recommendation**: 0 rules (clear upgrade incentive)

4. **Enterprise Custom Limits**: Allow >200 for enterprise?
   - **Recommendation**: Yes, negotiable per contract

---

## 🔄 Rollout Strategy

### Phase 1: Internal Testing (Week 1)
- Deploy to DEV
- Test with internal account (ian.ho@rebootmedia.net)
- Verify all security safeguards

### Phase 2: Beta Users (Week 2)
- Enable for 5-10 Business tier users
- Collect feedback
- Monitor for abuse attempts

### Phase 3: General Availability (Week 3)
- Deploy to PROD for all tiers
- Announce via blog post
- Monitor metrics

### Phase 4: Iteration (Week 4+)
- Add analytics dashboard
- Add "suggested whitelist phrases" based on usage
- Consider "starts with" / "ends with" matching options

---

**End of Custom Lists Documentation**

Future AI: This document contains everything needed to implement custom whitelist/blacklist safely. Read it completely before starting. Pay special attention to the validation pipeline order - it's critical for security.
