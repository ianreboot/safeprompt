# Testing Strategy: Unit vs Integration

## Current Problem

**928 tests in CI/CD:**
- 141 tests make real LLM API calls (~$0.75 per CI/CD run)
- 120 second test duration
- 98-99% pass rate due to API flakiness
- Runs 3x per commit (Node 18, 20, coverage)
- Monthly cost: ~$225 for CI/CD alone

## Proposed Solution

### 1. Split Test Suites

**Unit Tests (CI/CD - Fast & Free):**
```bash
npm run test:unit      # <30s, 100% pass rate, $0 cost
```
- Mock all external APIs
- Test business logic only
- Run on every commit
- Block PRs if failing

**Integration Tests (Scheduled/Manual):**
```bash
npm run test:integration  # 120s, 98% pass rate, $0.75 cost
```
- Real LLM API calls
- Test external integrations
- Run nightly or before releases
- Don't block PRs

### 2. Test Classification

**Files to move to integration:**
- `ai-orchestrator.test.js` (35 tests)
- `ai-validator-multistate.test.js` (28 tests)
- `ai-validator-pass2.test.js` (31 tests)
- `ai-validator-patterns.test.js` (47 tests)

**Files to keep in unit:**
- All mocked tests (consensus-engine, etc.)
- Pattern detection tests (no API calls)
- Utility function tests

### 3. Implementation Plan

**Step 1:** Rename integration test files:
```bash
mv ai-orchestrator.test.js ai-orchestrator.integration.test.js
mv ai-validator-multistate.test.js ai-validator-multistate.integration.test.js
mv ai-validator-pass2.test.js ai-validator-pass2.integration.test.js
mv ai-validator-patterns.test.js ai-validator-patterns.integration.test.js
```

**Step 2:** Update `package.json`:
```json
{
  "scripts": {
    "test": "npm run test:unit",
    "test:unit": "vitest run --exclude '**/*.integration.test.js'",
    "test:integration": "vitest run '**/*.integration.test.js'",
    "test:all": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Step 3:** Update `.github/workflows/test.yml`:
```yaml
- name: Run unit tests (fast, no API calls)
  run: npm run test:unit

- name: Run integration tests (main branch only)
  if: github.ref == 'refs/heads/main'
  run: npm run test:integration
  env:
    OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

### 4. Expected Impact

**Before:**
- CI/CD time: 120s per run × 2 (Node versions) = 240s
- CI/CD cost: $0.75 × 3 runs = $2.25 per commit
- Monthly: $225 @ 10 commits/day
- Flakiness: 1-2% test failure rate

**After:**
- CI/CD time: 30s per run × 2 = 60s (4x faster ✅)
- CI/CD cost: $0 (no API calls ✅)
- Monthly savings: $225 ✅
- Flakiness: 0% (mocked APIs ✅)
- Integration tests: Run nightly or pre-release

### 5. Alternative: Mock LLM Responses

Create fixtures for common LLM responses:
```javascript
// __fixtures__/llm-responses.js
export const mockOrchestratorResponse = {
  fast_reject: false,
  routing: { attack_detector: true },
  confidence: 0.85,
  reasoning: "Suspicious pattern detected"
}
```

Then mock in unit tests:
```javascript
vi.mock('../lib/ai-orchestrator.js', () => ({
  orchestrate: vi.fn(() => mockOrchestratorResponse)
}))
```

**Pros:** Fast, reliable, free
**Cons:** Doesn't test real API integration

## Recommendation

**For indie/solo developer:**
1. **Immediate:** Split unit and integration tests
2. **CI/CD:** Run only unit tests (fast, free, reliable)
3. **Integration:** Run manually before releases or nightly
4. **Monitoring:** Track real API failures in production, not CI/CD

**Why:** You can't afford to burn $225/month testing if OpenRouter is up. Focus CI/CD on catching YOUR bugs, not their API issues.

## Implementation Priority

**High Priority (Do Now):**
- [ ] Rename 4 integration test files
- [ ] Update package.json scripts
- [ ] Update GitHub Actions workflow
- [ ] Test locally

**Medium Priority (This Week):**
- [ ] Add mocked versions of critical tests
- [ ] Set up nightly integration test run
- [ ] Document when to run integration tests

**Low Priority (Nice to Have):**
- [ ] Create LLM response fixtures
- [ ] Add integration test reporting dashboard
- [ ] Set up pre-release integration gate
