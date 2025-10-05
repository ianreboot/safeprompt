# SafePrompt Testing Standards

**Last Updated**: 2025-10-05
**Status**: Production System - Testing Regiment 100% Complete
**Purpose**: Define testing requirements, standards, and best practices for SafePrompt development

---

## Overview

SafePrompt uses a **4-tier testing strategy** designed to balance comprehensive coverage with rapid development velocity:

1. **Tier 1: CI/CD Unit Tests** - Automated, fast, deterministic (every push)
2. **Tier 2: Smoke Tests** - Manual, critical paths only (before prod deploys)
3. **Tier 3: Realistic Test Suite** - Manual, comprehensive accuracy validation (weekly/monthly)
4. **Tier 4: Manual Validation** - Ad-hoc testing for specific scenarios

---

## 📊 Coverage Requirements

### Overall Targets

| Component | Minimum Coverage | Target Coverage | Priority |
|-----------|------------------|-----------------|----------|
| **api/lib/** (all validation logic) | 80% | 90% | CRITICAL |
| **prompt-validator.js** | 85% | 95% | CRITICAL |
| **external-reference-detector.js** | 90% | 98% | CRITICAL |
| **ai-validator-hardened.js** | 70% | 85% | HIGH |
| **api/api/** (endpoints) | 60% | 75% | MEDIUM |
| **dashboard/src/lib/** (client utils) | 50% | 70% | LOW |

### Current Status (2025-10-05)

- **188 unit tests** passing (100% pass rate)
- **prompt-validator.js**: 86.82% lines ✅
- **external-reference-detector.js**: 96.65% lines ✅
- **Overall api/lib**: 28.4% → Need 52% more coverage

---

## Tier 1: CI/CD Unit Tests

### Purpose
Fast, deterministic tests that run on every push to catch regressions immediately.

### Requirements

**MANDATORY**:
- ✅ All external APIs mocked (no real OpenRouter/Supabase calls)
- ✅ Execution time <40 seconds total
- ✅ Zero dependencies on external services
- ✅ Deterministic results (no randomness, no time-dependent logic)
- ✅ Coverage uploaded to Codecov on every run

**Test Categories**:
1. **Pattern Matching** (84 tests) - XSS, prompt injection, business whitelist
2. **Encoding Bypass Detection** (35 tests) - Unicode, hex, URL, HTML entities
3. **External Reference Detection** (75 tests) - URLs, IPs, file paths, obfuscation
4. **Confidence Scoring** - Decision thresholds and edge cases

### Running Tier 1 Tests

```bash
cd /home/projects/safeprompt/api

# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (for TDD)
npm run test:unit:watch

# CI/CD runs automatically via GitHub Actions
# See: .github/workflows/test.yml
```

### Writing New Tier 1 Tests

**File Naming**: `__tests__/{component-name}.test.js`

**Test Structure**:
```javascript
import { describe, it, expect } from 'vitest';
import { functionToTest } from '../lib/component.js';

describe('Component Name - Feature Category', () => {
  describe('Specific Behavior Group', () => {
    it('should do X when condition Y', () => {
      const input = 'test input';
      const expected = 'expected output';

      const result = functionToTest(input);

      expect(result).toBe(expected);
    });
  });
});
```

**Quality Standards**:
- ✅ One assertion per test (prefer multiple small tests over one large test)
- ✅ Descriptive test names that explain the behavior
- ✅ Clear arrange-act-assert structure
- ✅ No magic numbers or hardcoded strings (use constants)
- ✅ Test edge cases explicitly (empty strings, null, undefined, special characters)

**Example: Pattern Matching Test**
```javascript
describe('Pattern Matching - XSS Detection', () => {
  it('should detect basic script tags', () => {
    const input = '<script>alert("xss")</script>';
    const result = validatePromptSync(input);

    expect(result.safe).toBe(false);
    expect(result.threats).toContain('xss_attempt');
  });

  it('should detect encoded script tags', () => {
    const input = '&lt;script&gt;alert("xss")&lt;/script&gt;';
    const result = validatePromptSync(input);

    expect(result.safe).toBe(false);
    expect(result.threats).toContain('xss_attempt');
  });
});
```

---

## Tier 2: Smoke Tests

### Purpose
Verify critical user paths work correctly before deploying to production. Fast enough to run manually, comprehensive enough to catch major breaks.

### Requirements

**MANDATORY**:
- ✅ Tests real production code paths (no mocks except rate limiting)
- ✅ Uses actual OpenRouter API (real AI validation)
- ✅ Execution time <30 seconds
- ✅ Cost <$0.01 per run

**Test Coverage**:
1. **Pattern Stage** - XSS detected instantly via regex
2. **AI Pass 1** - External reference + AI validation (Gemini 2.0 Flash)
3. **AI Pass 2** - Complex jailbreak detection (Gemini 2.5 Flash)
4. **Business Whitelist** - Legitimate security queries pass
5. **Safe Baseline** - Normal user queries pass quickly

### Running Smoke Tests

```bash
cd /home/projects/safeprompt/api

# Run smoke tests before production deployment
npm run test:smoke

# Exit codes:
#   0 = All tests passed → Safe to deploy
#   1 = Tests failed → DO NOT deploy
```

### When to Run
- ✅ **BEFORE every production deployment**
- ✅ After significant AI validator changes
- ✅ After pattern matching updates
- ✅ Weekly as confidence check
- ❌ NOT in CI/CD (too slow, costs money)

---

## Tier 3: Realistic Test Suite

### Purpose
Comprehensive validation of production accuracy using real-world attack patterns and edge cases.

### Requirements

**MANDATORY**:
- ✅ Manual trigger only (NEVER in CI/CD)
- ✅ Uses real OpenRouter API
- ✅ Tests production accuracy targets (98%+)
- ✅ Execution time 8-10 minutes
- ✅ Cost ~$0.50 per run

**Test Categories** (94 total):
- XSS & Code Injection: 20 tests
- External References: 15 tests (URL/IP/file + encoding bypasses)
- Prompt Manipulation: 5 tests (jailbreaks, system injection)
- Language Switching: 4 tests (non-English bypass attempts)
- Semantic Manipulation: 4 tests (indirect extraction)
- Indirect Injection: 3 tests (RAG poisoning)
- Adversarial Suffixes: 3 tests (filter bypass)
- Modern Jailbreaks: 4 tests (STAN, DevMode, AIM)
- Nested Encoding: 2 tests (layered obfuscation)
- Legitimate Business: 15 tests (false positive prevention)
- Technical/Customer Service: 16 tests (safe contexts)

### Running Realistic Tests

```bash
cd /home/projects/safeprompt/api

# Full 94-test suite
npm run test:realistic

# Quick mode (subset, faster)
npm run test:quick

# Specific test modes
npm run test:accuracy      # Focus on accuracy metrics
npm run test:performance   # Focus on latency benchmarks
npm run test:no-ai         # Skip AI calls (pattern-only)
```

### When to Run
- ✅ After AI model changes
- ✅ After validation logic updates
- ✅ Before major releases
- ✅ Weekly/monthly accuracy tracking
- ❌ NOT in CI/CD

---

## Tier 4: Manual Validation

### Purpose
Ad-hoc testing for debugging specific issues or validating edge cases.

### Tools

**Production API Testing**:
```bash
# Test with internal key (unlimited requests)
curl -X POST https://api.safeprompt.dev/api/v1/validate \
  -H "X-API-Key: sp_live_INTERNAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test prompt","mode":"optimized"}'

# Test dev environment
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "X-API-Key: sp_live_INTERNAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test prompt"}'
```

**Internal Test Account**: `ian.ho@rebootmedia.net` (unlimited tier)

---

## Best Practices

### Writing Deterministic Tests

**DO**:
```javascript
// ✅ Test with static input
it('should detect XSS', () => {
  const input = '<script>alert(1)</script>';
  expect(validatePromptSync(input).safe).toBe(false);
});

// ✅ Test edge cases explicitly
it('should handle empty strings', () => {
  expect(validatePromptSync('')).toBeDefined();
});
```

**DON'T**:
```javascript
// ❌ No random data
it('should validate random prompts', () => {
  const input = generateRandomString(); // Non-deterministic
  validatePromptSync(input);
});

// ❌ No time-dependent logic
it('should validate with current timestamp', () => {
  const input = `Test ${Date.now()}`; // Changes every run
  validatePromptSync(input);
});
```

### Mocking External APIs

```javascript
// ✅ Mock OpenRouter calls in unit tests
vi.mock('../lib/openrouter-client.js', () => ({
  callOpenRouter: vi.fn().mockResolvedValue({
    choices: [{ message: { content: 'SAFE' } }]
  })
}));

// ✅ Use real API in smoke/realistic tests
// No mocking - test actual integration
```

### Coverage Targets by File Type

| File Type | Min Coverage | Rationale |
|-----------|--------------|-----------|
| **Security-critical** (validators, auth) | 95% | Any gaps = potential bypass |
| **Business logic** (pricing, limits) | 85% | Edge cases matter |
| **Utilities** (formatting, parsing) | 70% | Lower risk |
| **API endpoints** (routing, middleware) | 60% | Integration tests cover most |
| **UI components** (React) | 50% | Visual testing more valuable |

---

## Test Infrastructure

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

**Triggers**:
- Every push to `main` or `dev` branches
- Every pull request
- Manual workflow dispatch

**Matrix Testing**:
- Node.js 18.x
- Node.js 20.x

**Steps**:
1. Checkout code
2. Install dependencies
3. Run unit tests (`npm test`)
4. Generate coverage report
5. Upload to Codecov (Node 20.x only)

**Status**: ✅ Fully configured and operational

### Codecov Integration

**Purpose**: Track coverage trends over time, prevent regressions

**Configuration**: `.codecov.yml`

**Dashboard**: https://codecov.io/gh/ianreboot/safeprompt-internal

**Requirements**:
- Overall coverage must not decrease
- New code must have >70% coverage
- Security-critical files must have >90% coverage

---

## Testing Roadmap

### Completed ✅
- [x] 188 unit tests for core validation logic
- [x] GitHub Actions CI/CD pipeline
- [x] Codecov integration
- [x] Smoke test suite (5 tests)
- [x] Realistic test suite (94 tests)

### In Progress 🔄
- [ ] Increase api/lib coverage from 28.4% → 80%+
- [ ] Add unit tests for dashboard calculations
- [ ] Add unit tests for auth flows

### Planned 📋
- [ ] Add integration tests for API endpoints
- [ ] Add E2E tests for critical user journeys
- [ ] Add visual regression tests for dashboard
- [ ] Implement mutation testing for validation logic

---

## Common Testing Scenarios

### Testing New Pattern Detection

```javascript
describe('New Pattern - SQL Injection', () => {
  it('should detect basic SQL injection', () => {
    const input = "1' OR '1'='1";
    const result = validatePromptSync(input);

    expect(result.safe).toBe(false);
    expect(result.threats).toContain('sql_injection');
  });

  it('should not flag legitimate database queries', () => {
    const input = 'What is SQL and how does it work?';
    const result = validatePromptSync(input);

    expect(result.safe).toBe(true);
  });
});
```

### Testing Encoding Bypass

```javascript
describe('Encoding Bypass - Unicode', () => {
  it('should decode unicode escape sequences', () => {
    const input = '\\u003cscript\\u003e'; // <script>
    const decoded = decodeEncodingBypasses(input);

    expect(decoded).toBe('<script>');
  });

  it('should detect threats after decoding', () => {
    const input = '\\u003cscript\\u003ealert(1)\\u003c/script\\u003e';
    const result = validatePromptSync(input);

    expect(result.safe).toBe(false);
  });
});
```

### Testing External Reference Detection

```javascript
describe('External Reference - URL Detection', () => {
  it('should detect standard URLs', () => {
    const result = detector.detect('Visit https://evil.com');

    expect(result.hasExternalReferences).toBe(true);
    expect(result.urlsDetected).toContain('https://evil.com');
  });

  it('should detect obfuscated URLs', () => {
    const result = detector.detect('Visit h t t p://evil.com');

    expect(result.hasExternalReferences).toBe(true);
    expect(result.obfuscationDetected).toBe(true);
  });
});
```

---

## Troubleshooting

### Tests Failing Locally But Passing in CI

**Cause**: Environment differences (Node version, dependencies, OS)

**Fix**:
```bash
# Match CI environment
nvm use 20
rm -rf node_modules package-lock.json
npm install
npm test
```

### Coverage Report Not Generating

**Cause**: Missing coverage configuration

**Fix**:
```bash
# Check vitest.config.js has coverage settings
grep -A 10 "coverage" vitest.config.js

# Regenerate coverage
npm run test:coverage
```

### Codecov Upload Failing

**Cause**: Missing CODECOV_TOKEN secret

**Fix**: Verify secret exists in GitHub repo settings → Secrets → CODECOV_TOKEN

---

## References

- **Complete Testing Plan**: `/home/projects/safeprompt/TESTING_REGIMENT.md`
- **Test Documentation**: `/home/projects/safeprompt/api/README-TESTING.md`
- **GitHub Actions**: `.github/workflows/test.yml`
- **Codecov Dashboard**: https://codecov.io/gh/ianreboot/safeprompt-internal

---

**End of Testing Standards**
