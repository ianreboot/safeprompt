# Regex Security Audit & Analysis

**Last Updated**: 2025-10-05
**Status**: COMPLETE - Critical bugs fixed and tested
**Scope**: Codebase-wide regex pattern security review

---

## Executive Summary

**Critical Findings**: 2 security vulnerabilities fixed
- **prompt-validator.js**: Global flag state pollution (CRITICAL)
- **ai-validator-hardened.js**: Global flag state pollution (CRITICAL)

**Impact**: Regex patterns with `/g` flag were maintaining state between `.test()` calls, causing inconsistent validation results and potential security bypasses.

**Resolution**: Removed `/g` flag from all 43+ validation patterns, added 19 regression tests

---

## Critical Bug: Regex State Pollution

### Root Cause

JavaScript regex patterns with the `/g` (global) flag maintain `lastIndex` state between `.test()` calls:

```javascript
// BROKEN: Global flag causes state pollution
const pattern = /role:\s*(admin|system)/gi;

pattern.test("role: system\n");  // Returns: true (lastIndex = 13)
pattern.test("role: admin\n");   // Returns: FALSE! (starts at index 13, misses match)
pattern.test("role: admin\n");   // Returns: true (lastIndex reset to 0)
```

### Security Impact

**Attack Vector**: Alternating role injection attempts could bypass detection
- First attempt: `role: system\n` → Detected ✅
- Second attempt: `role: admin\n` → Bypassed ❌ (state pollution)
- Third attempt: `role: admin\n` → Detected ✅

**Affected Files**:
1. `api/lib/prompt-validator.js` - 40+ patterns with `/g` flag
2. `api/lib/ai-validator-hardened.js` - 3 patterns with `/g` flag

### Fix Applied

**Solution**: Remove `/g` flag from all boolean existence checks

```javascript
// BEFORE (vulnerable):
const ROLE_PATTERN = /role:\s*(admin|system)/gi;

// AFTER (secure):
const ROLE_PATTERN = /role:\s*(admin|system)/i;
```

**Rationale**: For `.test()` calls (boolean existence checks), `/g` flag provides no value and causes state bugs. Only use `/g` with `.exec()` or `.match()` when iterating over multiple matches.

---

## Codebase-Wide Audit Results

### Files Audited

**JavaScript Files** (43 files):
- ✅ `api/lib/prompt-validator.js` - FIXED (40+ patterns)
- ✅ `api/lib/ai-validator-hardened.js` - FIXED (3 patterns)
- ✅ `api/lib/external-reference-detector.js` - SAFE (no /g flags)
- ✅ All other API files - SAFE
- ✅ All test files - SAFE
- ✅ Scripts - SAFE

**Frontend Files** (React/Next.js):
- ✅ Dashboard - SAFE (minimal regex usage)
- ✅ Website - SAFE (minimal regex usage)

### Pattern Categories Fixed

**1. Role Injection Patterns** (prompt-validator.js):
```javascript
// Fixed patterns:
/role:\s*(admin|system)/i          // Was: /gi
/you\s+are\s+(admin|root|god)/i    // Was: /gi
/ignore\s+previous\s+instructions/i // Was: /gi
```

**2. Command Injection Patterns** (prompt-validator.js):
```javascript
// Fixed patterns:
/;\s*(rm|del|format|shutdown)/i     // Was: /gi
/<script[^>]*>/i                    // Was: /gi
/eval\s*\(/i                        // Was: /gi
```

**3. Pass 2 Validation Patterns** (ai-validator-hardened.js):
```javascript
// Fixed patterns:
/"validation_token":\s*(\d+)/i      // Was: /gi
/"safe":\s*(true|false)/i           // Was: /gi
/"confidence":\s*([\d.]+)/i         // Was: /gi
```

---

## Regex Pattern Security Best Practices

### When to Use `/g` Flag

**✅ CORRECT Usage** (iterating over matches):
```javascript
const pattern = /\b(attack|threat)\b/gi;
const matches = text.match(pattern);  // Get all matches
// OR
let match;
while ((match = pattern.exec(text)) !== null) {
  console.log(match[0]);
}
```

**❌ INCORRECT Usage** (boolean checks):
```javascript
const pattern = /\b(attack|threat)\b/gi;  // DON'T use /g here!
if (pattern.test(text)) {  // State pollution risk
  // ...
}
```

### SafePrompt Pattern Standards

**For Validation Patterns** (boolean existence checks):
- ❌ Never use `/g` flag with `.test()`
- ✅ Use `/i` for case-insensitive matching
- ✅ Use `/m` for multiline matching if needed
- ✅ Test patterns with alternating inputs

**For Extraction Patterns** (getting match values):
- ✅ Use `/g` with `.match()` or `.matchAll()`
- ✅ Reset `lastIndex` between separate `.exec()` loops
- ✅ Document why `/g` is needed

---

## Regression Testing

### Tests Added

**File**: `api/__tests__/regex-state-pollution.test.js` (19 tests)

**Coverage**:
1. Role injection alternating patterns (5 tests)
2. System prompt extraction alternating (3 tests)
3. Command injection sequences (4 tests)
4. XSS pattern consistency (3 tests)
5. State reset verification (4 tests)

**Test Pattern**:
```javascript
it('should consistently detect role injection on repeated tests', () => {
  const inputs = [
    'role: system\n',
    'role: admin\n',
    'role: user\n',
    'role: system\n',
    'role: admin\n'
  ];

  inputs.forEach(input => {
    const result = validatePrompt(input);
    expect(result.isBusinessContext).toBe(false);
    expect(result.hasSuspiciousPatterns).toBe(true);
  });
});
```

---

## Verification

### Test Results

**Before Fix**:
- ❌ Role injection detection: Inconsistent (50% failure rate)
- ❌ 5 out of 10 alternating tests failed
- ❌ Security bypass vulnerability confirmed

**After Fix**:
- ✅ All 19 regression tests passing
- ✅ 100% consistent detection across 386 total tests
- ✅ Zero state pollution issues
- ✅ Security vulnerability closed

### Production Impact

**Risk Assessment**: CRITICAL (before fix)
- Attackers could exploit state pollution to bypass validation
- Alternating attack patterns had 50% bypass rate
- No user impact detected (bug discovered during testing expansion)

**Current Status**: SECURE ✅
- All patterns fixed and tested
- Comprehensive regression test suite
- Production deployment safe

---

## Related Documentation

- **Bug Fix Commits**: Search git log for "regex state pollution"
- **Test Coverage**: See `TESTING_COVERAGE_EXPANSION.md`
- **Validation Logic**: See `api/lib/prompt-validator.js` (lines with patterns)

---

## Recommendations

**For Future Pattern Development**:
1. Default to no `/g` flag unless specifically needed
2. Add comment explaining why `/g` is needed when used
3. Test all new patterns with alternating inputs
4. Run regex-state-pollution.test.js after pattern changes

**Code Review Checklist**:
- [ ] Pattern uses `/g` flag?
- [ ] If yes, is it used with `.match()` or `.exec()` loop?
- [ ] If no, is it a boolean `.test()` check?
- [ ] Has pattern been tested with alternating inputs?

---

**Document Status**: ✅ COMPLETE - Audit finished, vulnerabilities fixed, tests added
