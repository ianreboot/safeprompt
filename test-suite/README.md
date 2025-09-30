# SafePrompt Test Suite

## Current Test Suite (Phase 1)

**File**: `realistic-test-suite.js`  
**Tests**: 50 professional, realistic test cases  
**Runner**: `run-realistic-tests.js`

### Test Coverage

#### XSS & Code Injection (20 tests)
- Classic XSS (5 tests)
- Obfuscated XSS (5 tests)
- Polyglot attacks (5 tests)
- Code injection: SQL, template injection (5 tests)

#### Business Context (15 tests)
- Legitimate security discussions (5 tests)
- Business communication with trigger words (5 tests)
- Context boundary testing (5 tests)

#### False Positive Prevention (15 tests)
- Technical assistance (5 tests)
- Customer service (5 tests)
- Idiomatic English (5 tests)

### Running Tests

```bash
# Run Phase 1 test suite (50 tests)
node run-realistic-tests.js

# Run original comprehensive tests (31 tests)
node test-hardened-comprehensive.js
```

### Test Results

Results are saved to JSON files:
- `realistic-test-results.json` - Phase 1 results with detailed metrics
- `hardened-comprehensive-results.json` - Original test results

### Test Quality Standards

✅ **Good Test Characteristics:**
- Based on real attack patterns
- Realistic language/context
- Clear expected behavior
- Covers specific validation feature
- Representative of user behavior

❌ **Bad Test Characteristics (Avoided):**
- Algorithmically generated
- Unnatural language
- Permutations of same pattern
- No real-world applicability
- Padding numbers

### Future Phases

See `COMPREHENSIVE_TEST_PLAN.md` for roadmap to 150-200 tests.

**Phase 2** (Planned): Sophisticated attacks, encoding bypasses  
**Phase 3** (Planned): Edge cases, additional coverage

### Archive

`archive-2025-09-30/` contains the old 3,000-test dataset (68% duplicates, algorithmically generated).
