# SafePrompt Test Suite

## Current Test Suite (Comprehensive)

**File**: `realistic-test-suite.js`
**Tests**: 74 professional, realistic test cases
**Runner**: `run-realistic-tests.js`

### Test Coverage

#### Attack Tests (42 tests)
- **XSS Basic** (5 tests): Classic script injection, event handlers, SVG attacks
- **XSS Obfuscated** (5 tests): Nested tags, HTML entities, hex encoding
- **XSS Polyglot** (5 tests): Comment breaks, context escapes, universal polyglots
- **Code Injection** (5 tests): SQL injection, template injection (Jinja2, ERB, JS)
- **External References Plain** (5 tests): URLs, IPs, file paths, fetch commands
- **External References Obfuscated** (5 tests): Spaced URLs, defanged notation, bracket IPs
- **External References Encoded** (5 tests): ROT13, Base64, hex, percent encoding, homoglyphs
- **Prompt Manipulation** (5 tests): Instruction override, DAN jailbreak, impersonation, system injection
- **Edge Cases** (2 tests): Ambiguous attacks that require judgment

#### Legitimate Tests (32 tests)
- **Security Discussion** (5 tests): Academic research, security testing, training materials
- **Business Communication** (10 tests): Policy updates, authorization workflows, revisions
- **Technical Assistance** (5 tests): Debugging help, code review, implementation questions
- **Customer Service** (5 tests): Refunds, corrections, follow-ups, escalations
- **Idiomatic English** (6 tests): Common phrases that sound like attacks but aren't
- **Edge Cases** (1 test): Ambiguous legitimate communication

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
