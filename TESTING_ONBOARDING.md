# SafePrompt Testing Onboarding Guide

**Welcome!** This guide will help you write your first tests for SafePrompt and understand our testing philosophy.

---

## Quick Start (5 Minutes)

### 1. Set Up Your Environment

```bash
# Navigate to API directory
cd /home/projects/safeprompt/api

# Install dependencies (if not already done)
npm install

# Verify tests work
npm test

# You should see: "188 passed"
```

### 2. Run Tests in Watch Mode

```bash
# Start watch mode for TDD
npm run test:unit:watch

# This will re-run tests automatically when you save files
# Perfect for test-driven development
```

### 3. Write Your First Test

Create a new file: `__tests__/my-first-test.test.js`

```javascript
import { describe, it, expect } from 'vitest';

describe('My First Test', () => {
  it('should pass', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });
});
```

Save the file and watch it pass! 🎉

---

## Testing Philosophy

### Core Principles

1. **Tests are documentation** - Write tests that explain what the code does
2. **Fast feedback loops** - Tests should run in seconds, not minutes
3. **Confidence over coverage** - Focus on critical paths, not 100% coverage
4. **Fail fast** - Tests should catch bugs immediately, not in production

### The 4-Tier Strategy

SafePrompt uses different test types for different purposes:

| Tier | Purpose | Speed | Frequency | Cost |
|------|---------|-------|-----------|------|
| **Tier 1: Unit Tests** | Catch regressions | <40s | Every push | $0 |
| **Tier 2: Smoke Tests** | Verify critical paths | <30s | Before deploys | $0.01 |
| **Tier 3: Realistic Suite** | Validate accuracy | 8-10min | Weekly | $0.50 |
| **Tier 4: Manual** | Ad-hoc debugging | Varies | As needed | Varies |

**You'll mostly work with Tier 1 (unit tests).**

---

## Writing Unit Tests

### Test Structure: AAA Pattern

Every test follows **Arrange-Act-Assert**:

```javascript
it('should detect XSS attacks', () => {
  // ARRANGE: Set up test data
  const maliciousPrompt = '<script>alert("xss")</script>';

  // ACT: Execute the code under test
  const result = validatePromptSync(maliciousPrompt);

  // ASSERT: Verify the result
  expect(result.safe).toBe(false);
  expect(result.threats).toContain('xss_attempt');
});
```

### Good Test Names

**DO**:
- ✅ `should detect basic XSS attempts`
- ✅ `should handle empty strings without errors`
- ✅ `should return confidence score between 0 and 1`

**DON'T**:
- ❌ `test1`
- ❌ `it works`
- ❌ `validate function`

**Formula**: `should [expected behavior] when [condition]`

### One Assertion Per Test (Usually)

**DO**:
```javascript
it('should flag unsafe prompts', () => {
  const result = validatePromptSync('<script>alert(1)</script>');
  expect(result.safe).toBe(false);
});

it('should identify the threat type', () => {
  const result = validatePromptSync('<script>alert(1)</script>');
  expect(result.threats).toContain('xss_attempt');
});
```

**DON'T**:
```javascript
it('should validate prompts correctly', () => {
  const result1 = validatePromptSync('safe');
  expect(result1.safe).toBe(true);

  const result2 = validatePromptSync('<script>');
  expect(result2.safe).toBe(false);

  const result3 = validatePromptSync('http://evil.com');
  expect(result3.hasExternalReferences).toBe(true);
  // Too many unrelated assertions!
});
```

**Exception**: Related assertions on the same object are fine:
```javascript
it('should return complete validation result', () => {
  const result = validatePromptSync('test');

  expect(result.safe).toBeDefined();
  expect(result.confidence).toBeDefined();
  expect(result.threats).toBeInstanceOf(Array);
});
```

---

## Common Testing Scenarios

### Testing Pattern Detection

**Goal**: Verify regex patterns catch malicious input

```javascript
import { validatePromptSync } from '../lib/prompt-validator.js';

describe('Pattern Detection - XSS', () => {
  it('should detect script tags', () => {
    const input = '<script>alert(1)</script>';
    const result = validatePromptSync(input);

    expect(result.safe).toBe(false);
    expect(result.threats).toContain('xss_attempt');
  });

  it('should detect script tags with attributes', () => {
    const input = '<script src="evil.js"></script>';
    const result = validatePromptSync(input);

    expect(result.safe).toBe(false);
  });

  it('should detect obfuscated script tags', () => {
    const input = '<ScRiPt>alert(1)</ScRiPt>';
    const result = validatePromptSync(input);

    expect(result.safe).toBe(false);
  });
});
```

### Testing Edge Cases

**Always test**:
- Empty strings
- Very long strings
- Special characters
- Unicode characters
- Null/undefined
- Whitespace-only strings

```javascript
describe('Edge Cases', () => {
  it('should handle empty strings', () => {
    const result = validatePromptSync('');
    expect(result).toBeDefined();
  });

  it('should handle very long strings', () => {
    const longString = 'a'.repeat(10000);
    const result = validatePromptSync(longString);
    expect(result).toBeDefined();
  });

  it('should handle special characters', () => {
    const input = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
    const result = validatePromptSync(input);
    expect(result).toBeDefined();
  });

  it('should handle unicode characters', () => {
    const input = '你好世界 🌍';
    const result = validatePromptSync(input);
    expect(result).toBeDefined();
  });
});
```

### Testing Encoding Bypass Detection

```javascript
import { decodeEncodingBypasses } from '../lib/prompt-validator.js';

describe('Encoding Bypass Detection', () => {
  it('should decode URL encoding', () => {
    const input = '%3Cscript%3E'; // <script>
    const decoded = decodeEncodingBypasses(input);

    expect(decoded).toBe('<script>');
  });

  it('should decode HTML entities', () => {
    const input = '&lt;script&gt;'; // <script>
    const decoded = decodeEncodingBypasses(input);

    expect(decoded).toBe('<script>');
  });

  it('should decode unicode escapes', () => {
    const input = '\\u003cscript\\u003e'; // <script>
    const decoded = decodeEncodingBypasses(input);

    expect(decoded).toBe('<script>');
  });
});
```

### Testing External Reference Detection

```javascript
import { ExternalReferenceDetector } from '../lib/external-reference-detector.js';

describe('External Reference Detection - URLs', () => {
  const detector = new ExternalReferenceDetector();

  it('should detect standard HTTP URLs', () => {
    const result = detector.detect('Visit https://example.com');

    expect(result.hasExternalReferences).toBe(true);
    expect(result.urlsDetected).toContain('https://example.com');
  });

  it('should detect obfuscated URLs', () => {
    const result = detector.detect('Visit h t t p://example.com');

    expect(result.hasExternalReferences).toBe(true);
    expect(result.obfuscationDetected).toBe(true);
  });

  it('should not flag safe content', () => {
    const result = detector.detect('What is HTTP?');

    expect(result.hasExternalReferences).toBe(false);
  });
});
```

---

## Mocking External Dependencies

### When to Mock

**DO mock**:
- External APIs (OpenRouter, Supabase)
- File system operations
- Date/time (for deterministic tests)
- Random number generation

**DON'T mock**:
- Your own code (test real integration)
- Simple utility functions
- Pure functions with no side effects

### How to Mock

```javascript
import { vi, describe, it, expect } from 'vitest';
import { callOpenRouter } from '../lib/openrouter-client.js';

// Mock the entire module
vi.mock('../lib/openrouter-client.js', () => ({
  callOpenRouter: vi.fn()
}));

describe('AI Validation', () => {
  it('should validate prompt via OpenRouter', async () => {
    // Set up mock response
    callOpenRouter.mockResolvedValue({
      choices: [{ message: { content: 'SAFE' } }]
    });

    const result = await validateWithAI('test prompt');

    expect(result.safe).toBe(true);
    expect(callOpenRouter).toHaveBeenCalledWith('test prompt');
  });
});
```

---

## Test Organization

### File Structure

```
api/
├── __tests__/                          # All test files here
│   ├── pattern-matching.test.js        # Pattern detection tests
│   ├── encoding-bypass.test.js         # Encoding detection tests
│   ├── external-reference-detector.test.js
│   └── prompt-validator.test.js
├── lib/                                # Source code
│   ├── prompt-validator.js
│   ├── external-reference-detector.js
│   └── ai-validator-hardened.js
└── vitest.config.js                    # Test configuration
```

### Test File Naming

**Pattern**: `{component-name}.test.js`

Examples:
- `pattern-matching.test.js`
- `encoding-bypass.test.js`
- `rate-limiter.test.js`

### Describe Block Hierarchy

```javascript
describe('Component Name', () => {
  describe('Feature Category', () => {
    describe('Specific Behavior', () => {
      it('should do X when Y', () => {
        // Test implementation
      });
    });
  });
});
```

Example:
```javascript
describe('Prompt Validator', () => {
  describe('XSS Detection', () => {
    describe('Script Tags', () => {
      it('should detect basic script tags', () => {
        // ...
      });

      it('should detect script tags with attributes', () => {
        // ...
      });
    });

    describe('Event Handlers', () => {
      it('should detect onclick handlers', () => {
        // ...
      });
    });
  });
});
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended for TDD)
npm run test:unit:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test pattern-matching.test.js

# Run tests matching a pattern
npm test -- --grep "XSS"
```

### Understanding Test Output

```
✓ __tests__/pattern-matching.test.js (84 tests)
  ✓ Pattern Matching - XSS Detection (15 tests)
    ✓ should detect basic script tags
    ✓ should detect script tags with attributes
    ...

Test Files  1 passed (1)
     Tests  84 passed (84)
  Start at  12:07:36
  Duration  106ms
```

**Green checkmarks** = Tests passing ✅
**Red X** = Tests failing ❌

### Coverage Report

```bash
npm run test:coverage
```

Output:
```
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
prompt-validator.js|   86.82 |    83.33 |      80 |   86.82 | 80-288,364-391
-------------------|---------|----------|---------|---------|-------------------
```

**Target**: 80%+ for security-critical files

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Testing Implementation Details

```javascript
// ❌ BAD: Testing internal implementation
it('should call decodeEncodingBypasses', () => {
  const spy = vi.spyOn(validator, 'decodeEncodingBypasses');
  validator.validatePromptSync('test');
  expect(spy).toHaveBeenCalled();
});

// ✅ GOOD: Testing behavior
it('should detect encoded XSS', () => {
  const result = validatePromptSync('%3Cscript%3E');
  expect(result.safe).toBe(false);
});
```

### ❌ Mistake 2: Non-Deterministic Tests

```javascript
// ❌ BAD: Uses current time
it('should validate with timestamp', () => {
  const input = `Test ${Date.now()}`;
  validatePromptSync(input); // Different every run
});

// ✅ GOOD: Static input
it('should validate timestamped prompts', () => {
  const input = 'Test 1696800000000';
  const result = validatePromptSync(input);
  expect(result.safe).toBe(true);
});
```

### ❌ Mistake 3: Too Many Assertions

```javascript
// ❌ BAD: Too much in one test
it('should validate all cases', () => {
  expect(validatePromptSync('safe').safe).toBe(true);
  expect(validatePromptSync('<script>').safe).toBe(false);
  expect(validatePromptSync('http://evil').hasExternalReferences).toBe(true);
  // etc...
});

// ✅ GOOD: One scenario per test
it('should allow safe prompts', () => {
  expect(validatePromptSync('safe').safe).toBe(true);
});

it('should block XSS attempts', () => {
  expect(validatePromptSync('<script>').safe).toBe(false);
});
```

### ❌ Mistake 4: Testing External APIs

```javascript
// ❌ BAD: Calls real OpenRouter API
it('should validate via AI', async () => {
  const result = await callOpenRouter('test'); // Real API call!
  expect(result).toBeDefined();
});

// ✅ GOOD: Mock external API
vi.mock('../lib/openrouter-client.js');

it('should validate via AI', async () => {
  callOpenRouter.mockResolvedValue({ choices: [{ message: { content: 'SAFE' } }] });
  const result = await validateWithAI('test');
  expect(result.safe).toBe(true);
});
```

---

## Debugging Failing Tests

### Step 1: Read the Error Message

```
Expected: false
Received: true

 ❯ __tests__/pattern-matching.test.js:45:32
```

**This tells you**:
- **What failed**: Expected `false`, got `true`
- **Where**: Line 45, column 32 of pattern-matching.test.js

### Step 2: Add Console Logs

```javascript
it('should detect XSS', () => {
  const input = '<script>alert(1)</script>';
  const result = validatePromptSync(input);

  console.log('Input:', input);
  console.log('Result:', result);

  expect(result.safe).toBe(false);
});
```

### Step 3: Run Only That Test

```bash
# Run specific test file
npm test pattern-matching.test.js

# Run tests matching pattern
npm test -- --grep "should detect XSS"
```

### Step 4: Check Test Assumptions

**Common issues**:
- Input doesn't trigger the pattern you expect
- Function signature changed
- Mock not set up correctly
- Edge case not handled

---

## Getting Help

### Internal Resources

1. **Testing Standards**: `/home/projects/safeprompt/TESTING_STANDARDS.md`
2. **Testing Regiment**: `/home/projects/safeprompt/TESTING_REGIMENT.md`
3. **Existing Tests**: `api/__tests__/` - read these for examples
4. **Vitest Docs**: https://vitest.dev/

### Ask Questions

When stuck:
1. Check existing similar tests
2. Read the function implementation
3. Add console.logs to understand behavior
4. Ask: "What am I actually testing here?"

---

## Your First Real Test

**Challenge**: Add a test for detecting SQL injection patterns.

### Step 1: Find the Pattern

Look in `api/lib/prompt-validator.js` for SQL injection patterns.

### Step 2: Create Test File

If it doesn't exist, create `__tests__/sql-injection.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { validatePromptSync } from '../lib/prompt-validator.js';

describe('SQL Injection Detection', () => {
  it('should detect basic SQL injection', () => {
    const input = "1' OR '1'='1";
    const result = validatePromptSync(input);

    expect(result.safe).toBe(false);
    expect(result.threats).toContain('sql_injection');
  });

  it('should detect UNION attacks', () => {
    const input = "1' UNION SELECT * FROM users--";
    const result = validatePromptSync(input);

    expect(result.safe).toBe(false);
  });

  it('should not flag legitimate database questions', () => {
    const input = 'How do I use SQL SELECT statements?';
    const result = validatePromptSync(input);

    expect(result.safe).toBe(true);
  });
});
```

### Step 3: Run Your Test

```bash
npm test sql-injection.test.js
```

### Step 4: Celebrate! 🎉

You just wrote your first test for SafePrompt's security validation system.

---

## Next Steps

1. **Explore existing tests** in `api/__tests__/`
2. **Pick a component** that needs more coverage (check `npm run test:coverage`)
3. **Write tests** for uncovered edge cases
4. **Submit a PR** with your improvements

**Remember**: Tests are living documentation. Write tests you'd want to read 6 months from now.

---

## Quick Reference

### Essential Commands
```bash
npm test                    # Run all tests
npm run test:unit:watch    # Watch mode (TDD)
npm run test:coverage      # Coverage report
npm test -- --grep "XSS"   # Run specific tests
```

### Test Structure
```javascript
describe('Component', () => {
  it('should behavior', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Common Assertions
```javascript
expect(value).toBe(expected)           // Strict equality
expect(value).toEqual(expected)        // Deep equality
expect(value).toBeDefined()            // Not undefined
expect(value).toBeTruthy()             // Truthy value
expect(array).toContain(item)          // Array contains item
expect(fn).toThrow(error)              // Function throws
expect(fn).toHaveBeenCalled()          // Mock was called
```

---

**Happy Testing!** 🧪

Remember: Good tests make you confident to ship fast. Bad tests make you scared to change anything. Write tests that give you superpowers.
