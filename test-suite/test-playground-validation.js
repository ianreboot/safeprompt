/**
 * Test Playground Examples Against Actual Validation System
 *
 * Verifies that all 15 playground tests produce expected results
 * when run through the actual SafePrompt validation system.
 */

import { PLAYGROUND_TEST_SUITE } from './playground-test-suite.js';
import validateWithAI from '../api/lib/ai-validator-hardened.js';

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function formatResult(test, actual) {
  const passed = (test.expectedResult === 'unsafe' && !actual.safe) ||
                 (test.expectedResult === 'safe' && actual.safe);

  const icon = passed ? '✅' : '❌';
  const color = passed ? colors.green : colors.red;

  const reasoningText = actual.reasoning ?
    (typeof actual.reasoning === 'string' ? actual.reasoning : JSON.stringify(actual.reasoning)) :
    'No reasoning provided';

  return `${icon} ${color}[${test.id}]${colors.reset} ${test.name}
  Expected: ${test.expectedResult === 'unsafe' ? 'BLOCKED' : 'ALLOWED'}
  Actual: ${actual.safe ? 'ALLOWED' : 'BLOCKED'} (stage: ${actual.stage || 'unknown'}, confidence: ${actual.confidence?.toFixed(2) || 'N/A'})
  Detection: ${actual.detectionMethod || actual.stage || 'unknown'}
  ${reasoningText ? `Reasoning: ${reasoningText.substring(0, 100)}...` : ''}`;
}

async function testPlayground() {
  console.log(`${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║  SafePrompt Playground Validation Test                   ║
║  Testing all 15 playground examples                      ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}\n`);

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  for (const test of PLAYGROUND_TEST_SUITE) {
    try {
      console.log(`${colors.blue}Testing:${colors.reset} ${test.name}...`);

      const actual = await validateWithAI(test.prompt, {
        skipPatterns: false,
        skipExternalCheck: false
      });

      const passed = (test.expectedResult === 'unsafe' && !actual.safe) ||
                     (test.expectedResult === 'safe' && actual.safe);

      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }

      results.tests.push({
        test,
        actual,
        passed
      });

      console.log(formatResult(test, actual));
      console.log(''); // Blank line

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`${colors.red}ERROR testing ${test.id}:${colors.reset}`, error.message);
      results.failed++;
      results.tests.push({
        test,
        actual: { error: error.message },
        passed: false
      });
    }
  }

  // Summary
  console.log(`${colors.bold}${colors.cyan}
═══════════════════════════════════════════════════════════
                    TEST SUMMARY
═══════════════════════════════════════════════════════════${colors.reset}
`);

  const accuracy = (results.passed / PLAYGROUND_TEST_SUITE.length * 100).toFixed(1);
  const color = accuracy >= 90 ? colors.green : accuracy >= 70 ? colors.yellow : colors.red;

  console.log(`${colors.bold}Accuracy: ${color}${accuracy}%${colors.reset} (${results.passed}/${PLAYGROUND_TEST_SUITE.length} tests passed)\n`);

  // Breakdown by category
  console.log(`${colors.bold}Results by Category:${colors.reset}`);
  const byCategory = {};

  for (const result of results.tests) {
    const cat = result.test.category;
    if (!byCategory[cat]) {
      byCategory[cat] = { passed: 0, total: 0 };
    }
    byCategory[cat].total++;
    if (result.passed) byCategory[cat].passed++;
  }

  for (const [category, stats] of Object.entries(byCategory)) {
    const catAccuracy = (stats.passed / stats.total * 100).toFixed(0);
    const catColor = stats.passed === stats.total ? colors.green : colors.yellow;
    console.log(`  ${catColor}${category}:${colors.reset} ${stats.passed}/${stats.total} (${catAccuracy}%)`);
  }

  // Failed tests detail
  if (results.failed > 0) {
    console.log(`\n${colors.bold}${colors.red}Failed Tests:${colors.reset}`);
    for (const result of results.tests) {
      if (!result.passed) {
        console.log(`\n  ${colors.red}❌ ${result.test.id}${colors.reset}: ${result.test.name}`);
        console.log(`     Expected: ${result.test.expectedResult}`);
        console.log(`     Actual: ${result.actual.safe ? 'safe' : 'unsafe'}`);
        console.log(`     Stage: ${result.actual.stage}`);
        console.log(`     Expected Detection: ${result.test.detectionMethod}`);
        if (result.actual.reasoning) {
          const reasoningText = typeof result.actual.reasoning === 'string' ?
            result.actual.reasoning : JSON.stringify(result.actual.reasoning);
          console.log(`     Reasoning: ${reasoningText.substring(0, 120)}...`);
        }
        if (result.actual.error) {
          console.log(`     ${colors.red}Error: ${result.actual.error}${colors.reset}`);
        }
      }
    }
  }

  // Detection method breakdown
  console.log(`\n${colors.bold}Detection Method Distribution:${colors.reset}`);
  const byStage = {};
  for (const result of results.tests) {
    const stage = result.actual.stage || 'unknown';
    byStage[stage] = (byStage[stage] || 0) + 1;
  }

  for (const [stage, count] of Object.entries(byStage).sort((a, b) => b[1] - a[1])) {
    const pct = (count / PLAYGROUND_TEST_SUITE.length * 100).toFixed(1);
    console.log(`  ${stage}: ${count} (${pct}%)`);
  }

  console.log(`\n${colors.bold}${results.failed === 0 ? colors.green + '✅ All tests passed!' : colors.yellow + '⚠️  Some tests failed'}${colors.reset}\n`);

  return results;
}

// Run tests
testPlayground().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
