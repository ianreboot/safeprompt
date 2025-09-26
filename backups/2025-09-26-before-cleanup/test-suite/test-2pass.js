/**
 * Test the 2-Pass Validation System
 * Pass 1: Fast pre-filter (200ms) to catch obvious cases
 * Pass 2: Full V2 validation (1.3s) only when needed
 *
 * Goal: Maintain V2's 63.6% accuracy with reduced average latency
 */

import fs from 'fs';
import { validate2Pass } from '/home/projects/safeprompt/api/lib/ai-validator-2pass.js';

// Test configuration
const CONFIG = {
  verbose: false,
  aiDelay: 1500,  // Delay between AI calls to avoid rate limits
  showPassStats: true,  // Show which tests needed 1 vs 2 passes
  // Thresholds for fast decisions
  preFilterThreshold: {
    high: 0.8,  // Confidence to reject immediately
    low: 0.8    // Confidence to approve immediately
  }
};

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  system: "2-PASS - Fast Pre-filter + Full V2 Validation",

  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    accuracy: 0
  },

  byCategory: {},

  byPasses: {
    onePass: { count: 0, avgTime: 0, times: [] },
    twoPasses: { count: 0, avgTime: 0, times: [] }
  },

  performance: {
    allTimes: [],
    fastOnlyTimes: [],  // Tests resolved in pass 1
    fullValidationTimes: []  // Tests needing pass 2
  },

  failures: [],
  improvements: []
};

// Load baseline and V2 results for comparison
let baseline = null;
let v2Results = null;
if (fs.existsSync('/home/projects/safeprompt/test-suite/baseline-results.json')) {
  baseline = JSON.parse(fs.readFileSync('/home/projects/safeprompt/test-suite/baseline-results.json', 'utf8'));
}
if (fs.existsSync('/home/projects/safeprompt/test-suite/new-prompt-results.json')) {
  v2Results = JSON.parse(fs.readFileSync('/home/projects/safeprompt/test-suite/new-prompt-results.json', 'utf8'));
}

async function testPrompt(test, category) {
  const result = {
    text: test.text.substring(0, 100),
    category: category,
    expected: test.expected.safe,
    actual: {},
    passed: false
  };

  try {
    // Add delay for AI rate limiting
    if (results.summary.total > 0) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.aiDelay));
    }

    const start = Date.now();
    const validationResult = await validate2Pass(test.text, {
      model: 'google/gemini-2.0-flash-exp:free',
      timeout: 10000,
      preFilterThreshold: CONFIG.preFilterThreshold
    });
    const totalTime = Date.now() - start;

    result.actual = {
      safe: validationResult.safe,
      confidence: validationResult.confidence,
      threats: validationResult.threats,
      reasoning: validationResult.reasoning,
      passesExecuted: validationResult.passesExecuted,
      passes: validationResult.passes
    };

    // Track performance
    results.performance.allTimes.push(totalTime);

    if (validationResult.passesExecuted === 1) {
      results.byPasses.onePass.count++;
      results.byPasses.onePass.times.push(totalTime);
      results.performance.fastOnlyTimes.push(totalTime);
    } else {
      results.byPasses.twoPasses.count++;
      results.byPasses.twoPasses.times.push(totalTime);
      results.performance.fullValidationTimes.push(totalTime);
    }

    // Evaluate pass/fail
    result.passed = (validationResult.safe === test.expected.safe);

    if (!result.passed) {
      results.failures.push({
        category: category,
        text: test.text.substring(0, 60) + '...',
        expected: test.expected.safe,
        got: validationResult.safe,
        passesUsed: validationResult.passesExecuted,
        reasoning: test.reasoning
      });
    }

    // Track improvements over baseline and V2
    const baselineFailure = baseline?.failures.find(f =>
      f.text.startsWith(test.text.substring(0, 30))
    );
    const v2Failure = v2Results?.failures.find(f =>
      f.text.startsWith(test.text.substring(0, 30))
    );

    if ((baselineFailure || v2Failure) && result.passed) {
      results.improvements.push({
        category: category,
        text: test.text.substring(0, 60) + '...',
        fixedFrom: baselineFailure && v2Failure ? 'both' : (baselineFailure ? 'baseline' : 'v2'),
        passesUsed: validationResult.passesExecuted
      });
    }

    // Log details for debugging if needed
    if (CONFIG.verbose) {
      console.log(`  [${result.passed ? '✓' : '✗'}] ${test.text.substring(0, 50)}...`);
      console.log(`      Passes: ${validationResult.passesExecuted}, Time: ${totalTime}ms`);
    }

  } catch (error) {
    result.error = error.message;
    result.passed = false;
  }

  return result;
}

async function run2PassTest() {
  console.log('========================================');
  console.log('2-PASS VALIDATION SYSTEM TEST');
  console.log('Architecture:');
  console.log('- Pass 1: Fast pre-filter (GPT-3.5, ~200ms)');
  console.log('- Pass 2: Full V2 validation (Gemini, ~1.3s)');
  console.log('========================================\n');

  // Load test suite
  const testSuite = JSON.parse(
    fs.readFileSync('/home/projects/safeprompt/test-suite/real-tests.json', 'utf8')
  );

  console.log('Goals:');
  console.log('- Maintain V2 accuracy (63.6%)');
  console.log('- Reduce average latency');
  console.log('- Fast-track obvious safe/unsafe cases\n');

  // Test each category
  for (const [category, tests] of Object.entries(testSuite.tests)) {
    console.log(`\nTesting ${category}: ${tests.length} tests`);
    console.log('Progress: ', { end: '' });

    results.byCategory[category] = {
      total: tests.length,
      passed: 0,
      failed: 0,
      accuracy: 0,
      onePassCount: 0,
      twoPassCount: 0
    };

    for (const test of tests) {
      const result = await testPrompt(test, category);

      results.summary.total++;

      if (result.passed) {
        results.summary.passed++;
        results.byCategory[category].passed++;
        process.stdout.write('.');
      } else {
        results.summary.failed++;
        results.byCategory[category].failed++;
        process.stdout.write('F');
      }

      // Track pass distribution
      if (result.actual.passesExecuted === 1) {
        results.byCategory[category].onePassCount++;
      } else {
        results.byCategory[category].twoPassCount++;
      }
    }

    // Calculate accuracy for category
    results.byCategory[category].accuracy =
      (results.byCategory[category].passed / results.byCategory[category].total * 100).toFixed(1);

    console.log(`\n${category}: ${results.byCategory[category].passed}/${results.byCategory[category].total} passed (${results.byCategory[category].accuracy}%)`);
    console.log(`  → ${results.byCategory[category].onePassCount} resolved in 1 pass, ${results.byCategory[category].twoPassCount} needed 2 passes`);
  }

  // Calculate overall accuracy
  results.summary.accuracy = (results.summary.passed / results.summary.total * 100).toFixed(1);

  // Calculate performance averages
  const avgOnePass = results.byPasses.onePass.times.length > 0 ?
    results.byPasses.onePass.times.reduce((a, b) => a + b, 0) /
    results.byPasses.onePass.times.length : 0;

  const avgTwoPass = results.byPasses.twoPasses.times.length > 0 ?
    results.byPasses.twoPasses.times.reduce((a, b) => a + b, 0) /
    results.byPasses.twoPasses.times.length : 0;

  const avgOverall = results.performance.allTimes.reduce((a, b) => a + b, 0) /
                     results.performance.allTimes.length;

  results.byPasses.onePass.avgTime = avgOnePass;
  results.byPasses.twoPasses.avgTime = avgTwoPass;

  // Print detailed report
  console.log('\n========================================');
  console.log('2-PASS SYSTEM RESULTS SUMMARY');
  console.log('========================================\n');

  console.log('Overall Performance:');
  console.log(`  Total Tests: ${results.summary.total}`);
  console.log(`  Passed: ${results.summary.passed}`);
  console.log(`  Failed: ${results.summary.failed}`);
  console.log(`  Accuracy: ${results.summary.accuracy}%\n`);

  console.log('Performance by Category:');
  for (const [category, stats] of Object.entries(results.byCategory)) {
    const baselineAccuracy = baseline?.byCategory[category]?.accuracy || 'N/A';
    const v2Accuracy = v2Results?.byCategory[category]?.accuracy || 'N/A';

    console.log(`  ${category}: ${stats.accuracy}% (baseline: ${baselineAccuracy}%, V2: ${v2Accuracy}%)`);
  }

  console.log('\nPass Distribution:');
  console.log(`  Single Pass (fast): ${results.byPasses.onePass.count} tests (${(results.byPasses.onePass.count / results.summary.total * 100).toFixed(1)}%)`);
  console.log(`  Two Passes (full): ${results.byPasses.twoPasses.count} tests (${(results.byPasses.twoPasses.count / results.summary.total * 100).toFixed(1)}%)`);

  console.log('\nTiming Performance:');
  console.log(`  Avg Single Pass: ${avgOnePass.toFixed(2)}ms`);
  console.log(`  Avg Two Passes: ${avgTwoPass.toFixed(2)}ms`);
  console.log(`  Overall Average: ${avgOverall.toFixed(2)}ms`);

  // Calculate time savings
  const v2AvgTime = 1360;  // From V2 test results
  const timeSavings = ((v2AvgTime - avgOverall) / v2AvgTime * 100).toFixed(1);
  console.log(`  Time Savings vs V2: ${timeSavings}% (${v2AvgTime}ms → ${avgOverall.toFixed(0)}ms)`);

  // Show improvements
  if (results.improvements.length > 0) {
    console.log('\n✅ FIXED FROM PREVIOUS VERSIONS:');
    results.improvements.slice(0, 5).forEach(imp => {
      console.log(`  - [${imp.category}] "${imp.text}" (${imp.passesUsed} pass${imp.passesUsed > 1 ? 'es' : ''})`);
    });
    if (results.improvements.length > 5) {
      console.log(`  ... and ${results.improvements.length - 5} more`);
    }
  }

  // Show remaining failures
  if (results.failures.length > 0) {
    console.log('\n⚠️  STILL FAILING:');
    results.failures.slice(0, 5).forEach(f => {
      console.log(`  - [${f.category}] "${f.text}" (${f.passesUsed} pass${f.passesUsed > 1 ? 'es' : ''})`);
    });
    if (results.failures.length > 5) {
      console.log(`  ... and ${results.failures.length - 5} more`);
    }
  }

  // Save results
  fs.writeFileSync(
    '/home/projects/safeprompt/test-suite/2pass-results.json',
    JSON.stringify(results, null, 2)
  );

  // Comparison with V2
  console.log('\n========================================');
  console.log('COMPARISON WITH V2 (SINGLE PASS)');
  console.log('========================================\n');

  const v2Accuracy = v2Results ? parseFloat(v2Results.summary.accuracy) : 0;
  const twoPassAccuracy = parseFloat(results.summary.accuracy);

  console.log(`V2 Single Pass: ${v2Accuracy}% accuracy @ ${v2AvgTime}ms avg`);
  console.log(`2-Pass System: ${twoPassAccuracy}% accuracy @ ${avgOverall.toFixed(0)}ms avg`);
  console.log(`Accuracy Delta: ${(twoPassAccuracy - v2Accuracy).toFixed(1)}%`);
  console.log(`Speed Improvement: ${timeSavings}%`);

  console.log('\n========================================');
  console.log('VERDICT');
  console.log('========================================\n');

  if (twoPassAccuracy >= v2Accuracy - 2 && avgOverall < v2AvgTime * 0.8) {
    console.log('✅ SUCCESS - 2-pass maintains accuracy with better speed');
  } else if (twoPassAccuracy >= v2Accuracy) {
    console.log('🔶 GOOD - 2-pass maintains or improves accuracy');
  } else if (twoPassAccuracy >= v2Accuracy - 5) {
    console.log('⚠️  ACCEPTABLE - Small accuracy loss for speed gain');
  } else {
    console.log('❌ POOR - Significant accuracy loss');
  }

  console.log(`\nResults saved to: 2pass-results.json`);
}

// Run 2-pass test
run2PassTest().catch(console.error);