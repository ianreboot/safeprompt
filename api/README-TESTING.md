# SafePrompt API Testing Guide

## Quick Start

```bash
# Run unit tests (fast, no external APIs)
npm test

# Run unit tests in watch mode (for development)
npm run test:unit:watch

# Run tests with coverage report
npm run test:coverage

# Run realistic test suite (uses AI APIs)
npm run test:realistic

# Run all tests (unit + realistic + e2e)
npm run test:all
```

## Test Types

### 1. Unit Tests (Vitest)
**Location**: `__tests__/*.test.js`
**Framework**: Vitest with V8 coverage
**Speed**: Fast (<1s for 5 tests)
**Purpose**: Test individual functions and modules

**Example**:
```javascript
import { describe, it, expect } from 'vitest';

describe('My Function', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### 2. Realistic Test Suite
**Location**: `../test-suite/realistic-test-suite.js`
**Tests**: 94 professional test cases
**Speed**: Medium (varies by mode)
**Purpose**: Validate AI validation accuracy with real-world prompts

**Modes**:
- `npm run test:quick` - Fast validation (subset of tests)
- `npm run test:full` - Complete test suite
- `npm run test:accuracy` - Accuracy-focused testing
- `npm run test:performance` - Performance benchmarks
- `npm run test:no-ai` - Skip AI validation (pattern matching only)

### 3. E2E Tests
**Location**: `../test-suite/playground-test-suite.js`
**Purpose**: Test complete user journeys
**Speed**: Slow (requires full API stack)

## Coverage Targets

| Component | Target | Priority |
|-----------|--------|----------|
| Validation logic | 90%+ | Critical |
| Authentication | 90%+ | Critical |
| Payment flows | 90%+ | Critical |
| Dashboard | 80%+ | High |
| Website | 60%+ | Medium |
| **Overall** | **80%+** | **Goal** |

## Running Tests Locally

### Prerequisites
1. Node.js 18+ installed
2. Environment variables configured (copy from `/home/projects/.env`)
3. Dependencies installed: `npm install`

### Environment Setup

For realistic tests (uses AI APIs):
```bash
# Required environment variables
export OPENROUTER_API_KEY="your-key"
export SAFEPROMPT_DEV_SUPABASE_URL="your-supabase-url"
export SAFEPROMPT_DEV_SUPABASE_ANON_KEY="your-anon-key"
```

For unit tests: No environment variables required (uses mocks)

## CI/CD Integration

### GitHub Actions
**Workflow**: `.github/workflows/test.yml`
**Triggers**: Push to main/dev, Pull requests
**Jobs**:
1. **Unit Tests**: Runs on Node 18.x and 20.x
2. **Coverage**: Uploads to Codecov (Node 20.x only)
3. **Realistic Tests**: Runs on main branch pushes only (API quota)
4. **Lint**: Verifies test infrastructure exists

**Status**: ✅ Configured and ready

### Vercel Deployment
**Protection**: None (auto-deploys on push)
**Recommendation**: Add deployment protection requiring tests to pass

## Writing New Tests

### Unit Test Template

Create file in `__tests__/` directory:

```javascript
/**
 * Unit tests for my-module.js
 */
import { describe, it, expect, vi } from 'vitest';
import { myFunction } from '../lib/my-module.js';

describe('myFunction', () => {
  it('should handle valid input', () => {
    const result = myFunction('valid input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(() => myFunction(null)).toThrow();
  });

  it('should work with async operations', async () => {
    const promise = myAsyncFunction();
    await expect(promise).resolves.toBe('result');
  });
});
```

### Testing Patterns

**Mocking Supabase**:
```javascript
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }))
}));
```

**Testing API responses**:
```javascript
it('should validate safe prompts', async () => {
  const result = await validate('Hello world');
  expect(result.safe).toBe(true);
  expect(result.confidence).toBeGreaterThan(0.9);
});
```

## Test Organization

```
api/
├── __tests__/              # Unit tests
│   ├── prompt-validator.test.js
│   ├── ai-validator.test.js
│   └── rate-limiter.test.js
├── vitest.config.js        # Test configuration
└── coverage/               # Coverage reports (generated)
    ├── lcov.info
    └── html/

test-suite/                 # Integration tests
├── realistic-test-suite.js
├── playground-test-suite.js
└── run-realistic-tests.js
```

## Troubleshooting

### Tests fail with "Cannot find module"
- Check imports use correct paths (relative or aliased)
- Ensure `type: "module"` in package.json
- Verify vitest.config.js has correct aliases

### Coverage not generating
- Run `npm run test:coverage` instead of `npm test`
- Check `coverage/` directory is not in .gitignore
- Verify @vitest/coverage-v8 is installed

### Realistic tests timeout
- Increase timeout in test file: `{ timeout: 60000 }`
- Use `--mode=quick` for faster testing
- Check API keys are valid

### CI tests pass but local tests fail
- Ensure environment variables match
- Check Node.js version (use 18.x or 20.x)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## Performance

**Unit Tests**: <1s for 5 tests
**Coverage Report**: +200ms overhead
**Realistic Suite (quick)**: ~2-3 minutes
**Realistic Suite (full)**: ~8-10 minutes

**CI Pipeline**: ~3-5 minutes total

## Best Practices

1. **Write tests first** (TDD) for new features
2. **Run tests in watch mode** during development
3. **Aim for 90%+ coverage** on critical paths
4. **Mock external services** (Supabase, Stripe, OpenRouter)
5. **Use descriptive test names** (should, when, given)
6. **Test edge cases** (null, undefined, empty, invalid)
7. **Keep tests fast** (<100ms per unit test)
8. **Avoid AI calls in unit tests** (use realistic suite for that)

## Next Steps

Current status: ✅ **Foundation Complete**

**Immediate priorities**:
1. Write 10 unit tests for validation endpoint
2. Add coverage for security vulnerabilities
3. Mock Supabase client for auth tests
4. Add Stripe webhook tests

**Future improvements**:
1. Visual regression testing (Percy/Chromatic)
2. Performance regression tests
3. Load testing in CI
4. Mutation testing (Stryker)

## References

- [Vitest Documentation](https://vitest.dev/)
- [Coverage Configuration](https://vitest.dev/guide/coverage.html)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Codecov Integration](https://about.codecov.io/)
