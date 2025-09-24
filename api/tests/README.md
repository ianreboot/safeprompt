# SafePrompt Testing Documentation

## Overview

This directory contains the comprehensive test suite for SafePrompt, including 2000+ test prompts and automated validation scripts to ensure consistent system functionality over time.

## Test Structure

```
tests/
├── data/
│   └── test-datasets.json     # 2000+ test prompts (legitimate & malicious)
├── scripts/
│   ├── benchmark.js           # Performance benchmarking
│   ├── test-ai-validation.js  # AI model testing
│   └── test-false-positives.js # False positive rate testing
├── results/
│   └── test-run-*.json       # Test execution results
├── test-suite.js              # Main test runner
└── README.md                  # This file
```

## Quick Start

### Run All Tests (Standard Mode)
```bash
npm test
# or
node tests/test-suite.js
```

### Run Quick Validation (10 samples)
```bash
npm run test:quick
```

### Run Full Validation (1000 samples)
```bash
npm run test:full
```

### Run Specific Test
```bash
npm run test:accuracy      # Accuracy testing only
npm run test:performance   # Performance benchmarks only
npm run test:no-ai         # Skip AI tests (avoid rate limits)
```

## Test Suite Components

### 1. Accuracy Test
- **Purpose**: Validate classification accuracy
- **Samples**: 100 legitimate + 100 malicious prompts (standard mode)
- **Target**: >95% accuracy for legitimate, >20% for malicious (regex-only)
- **Metrics**: Legitimate accuracy, malicious detection rate

### 2. False Positive Test
- **Purpose**: Ensure legitimate prompts aren't blocked
- **Samples**: 100 legitimate prompts
- **Target**: <0.5% false positive rate
- **Metrics**: False positive rate, count of misclassified prompts

### 3. Performance Test
- **Purpose**: Measure response times
- **Samples**: 10-100 mixed prompts
- **Target**: P95 latency <2000ms
- **Metrics**: Average, P50, P95, P99 latency

### 4. Cache Test
- **Purpose**: Validate caching effectiveness
- **Method**: Test with duplicate prompts
- **Target**: >70% cache hit rate for duplicates
- **Metrics**: Hit rate, cache size, memory usage

### 5. AI Validation Test
- **Purpose**: Test AI model integration
- **Samples**: 4 carefully selected test cases
- **Target**: 100% accuracy
- **Metrics**: Accuracy, average response time
- **Note**: Limited samples to avoid rate limits

## Test Dataset

The `test-datasets.json` file contains:

- **1000 Legitimate Prompts**:
  - Questions (What, How, Why, When, Where)
  - Programming requests
  - Creative tasks
  - Educational queries
  - Business requests
  - Technical support
  - Analysis requests

- **1000 Malicious Prompts**:
  - Instruction override attempts
  - Role manipulation
  - Hidden instructions
  - Prompt leaking attempts
  - Code injection (XSS, SQL)
  - Encoding tricks
  - Sophisticated attacks

- **500 Mixed Dataset**: Shuffled combination for realistic testing

## Command Line Options

```bash
node tests/test-suite.js [options]

Options:
  --test=NAME     Run specific test (accuracy, falsePositives, performance, caching, ai)
  --mode=MODE     Test mode: quick (10), standard (100), full (1000) samples
  --skip-ai       Skip AI validation tests (to avoid rate limits)
  --help          Show help message
```

## Test Results

Test results are automatically saved to `tests/results/test-run-{timestamp}.json` with:

- Timestamp and duration
- Overall pass/fail status
- Detailed metrics for each test
- Individual test results
- Configuration used

## Continuous Integration

### GitHub Actions (Example)
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:no-ai  # Skip AI to avoid rate limits in CI
```

### Daily Validation
Run full test suite daily to ensure system integrity:
```bash
# Cron job (runs daily at 2 AM)
0 2 * * * cd /path/to/safeprompt/api && npm run test:full >> test.log 2>&1
```

## Performance Baselines

Current system performance (as of 2025-09-23):

| Metric | Target | Actual |
|--------|--------|--------|
| **Regex Accuracy** | >95% | 100% (legitimate) |
| **AI Accuracy** | >95% | 100% |
| **False Positive Rate** | <0.5% | 0% |
| **False Negative Rate** | <1% | 0% (with AI) |
| **P95 Latency (Regex)** | <50ms | 0ms |
| **P95 Latency (AI)** | <2000ms | 1048ms |
| **Cache Hit Rate** | >70% | 33.3% (quick test) |
| **Test Suite Runtime** | <30s | 4.2s (quick mode) |

## Testing Best Practices

### 1. Regular Testing
- Run quick tests before commits
- Run standard tests before deployments
- Run full tests weekly

### 2. Rate Limit Management
- Use `--skip-ai` flag for frequent testing
- Limit AI tests to 4-10 samples
- Implement delays between AI calls

### 3. Test Data Maintenance
- Periodically update test datasets
- Add new attack patterns as discovered
- Balance legitimate vs malicious samples

### 4. Performance Monitoring
- Track latency trends over time
- Monitor cache effectiveness
- Alert on degradation

### 5. Result Analysis
- Review failed tests immediately
- Compare results against baselines
- Document any changes in behavior

## Troubleshooting

### Common Issues

**Rate Limit Errors**
```bash
# Skip AI tests
npm run test:no-ai
```

**Module Import Errors**
```bash
# Ensure package.json has "type": "module"
# Check all imports use .js extensions
```

**Cache Test Failures**
```bash
# Clear cache before testing
rm -rf /tmp/safeprompt-cache/*
```

## Adding New Tests

To add a new test to the suite:

1. Create test function in `test-suite.js`:
```javascript
async function testNewFeature() {
  const results = new TestResults('New Feature Test');
  // Test implementation
  return results;
}
```

2. Add to test runner:
```javascript
case 'newFeature':
  result = await testNewFeature();
  break;
```

3. Update package.json:
```json
"test:new": "node tests/test-suite.js --test=newFeature"
```

## Maintenance

### Weekly Tasks
- Run full test suite
- Review test results
- Update baselines if needed

### Monthly Tasks
- Review and update test datasets
- Add new attack patterns
- Optimize test performance

### Quarterly Tasks
- Comprehensive performance analysis
- Test suite refactoring
- Documentation updates

## Support

For testing issues or questions:
- Check test results in `tests/results/`
- Review error logs
- Contact development team

---

**Last Updated**: 2025-09-23
**Version**: 1.0.0
**Maintainer**: SafePrompt Team