/**
 * Test the OPTIMIZED 2-Pass Validation System
 *
 * Optimizations:
 * 1. FREE Gemini for both passes (zero cost)
 * 2. Pattern-based instant decisions
 * 3. Caching for repeated prompts
 * 4. Parallel regex checking
 * 5. Shorter prompts for faster responses
 */

import fs from 'fs';
import { validate2PassOptimized } from '/home/projects/safeprompt/api/lib/ai-validator-2pass-optimized.js';

// Test configuration
const CONFIG = {
  verbose: false,
  aiDelay: 1500,
  testCache: true,  // Test cache effectiveness
  preFilterThreshold: {
    high: 0.85,
    low: 0.90
  }
};

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  system: "OPTIMIZED 2-PASS - Free Gemini + Pattern Detection + Caching",

  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    accuracy: 0
  },

  byCategory: {},

  byPasses: {
    pattern: { count: 0, avgTime: 0, times: [] },  // Instant pattern match
    onePass: { count: 0, avgTime: 0, times: [] },  // AI pre-filter only
    twoPasses: { count: 0, avgTime: 0, times: [] }, // Full validation
    cached: { count: 0, avgTime: 0, times: [] }     // Cache hits
  },

  performance: {
    allTimes: [],
    patternTimes: [],
    fastOnlyTimes: [],
    fullValidationTimes: [],
    cachedTimes: []
  },

  failures: [],
  improvements: []
};

// Load comparison data
let baseline = null;
let v2Results = null;
let twoPassResults = null;
if (fs.existsSync('/home/projects/safeprompt/test-suite/baseline-results.json')) {
  baseline = JSON.parse(fs.readFileSync('/home/projects/safeprompt/test-suite/baseline-results.json', 'utf8'));
}
if (fs.existsSync('/home/projects/safeprompt/test-suite/new-prompt-results.json')) {
  v2Results = JSON.parse(fs.readFileSync('/home/projects/safeprompt/test-suite/new-prompt-results.json', 'utf8'));
}
if (fs.existsSync('/home/projects/safeprompt/test-suite/2pass-results.json')) {
  twoPassResults = JSON.parse(fs.readFileSync('/home/projects/safeprompt/test-suite/2pass-results.json', 'utf8'));
}

async function testPrompt(test, category, isRepeat = false) {
  const result = {
    text: test.text.substring(0, 100),
    category: category,
    expected: test.expected.safe,
    actual: {},
    passed: false,
    isRepeat
  };

  try {
    // Add delay for AI rate limiting (unless cached)
    if (!isRepeat && results.summary.total > 0) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.aiDelay));
    }

    const start = Date.now();
    const validationResult = await validate2PassOptimized(test.text, {
      model: 'google/gemini-2.0-flash-exp:free',
      timeout: 10000,
      preFilterThreshold: CONFIG.preFilterThreshold,
      useCache: CONFIG.testCache,
      parallelRegex: true
    });
    const totalTime = Date.now() - start;

    result.actual = {
      safe: validationResult.safe,
      confidence: validationResult.confidence,
      threats: validationResult.threats,
      reasoning: validationResult.reasoning,
      passesExecuted: validationResult.passesExecuted,
      method: validationResult.method,
      cached: validationResult.cached
    };

    // Track performance
    results.performance.allTimes.push(totalTime);

    if (validationResult.cached) {
      results.byPasses.cached.count++;
      results.byPasses.cached.times.push(totalTime);
      results.performance.cachedTimes.push(totalTime);
    } else if (validationResult.method === 'pattern' || validationResult.method === 'regex') {
      results.byPasses.pattern.count++;
      results.byPasses.pattern.times.push(totalTime);
      results.performance.patternTimes.push(totalTime);
    } else if (validationResult.passesExecuted === 1) {
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

    if (!result.passed && !isRepeat) {
      results.failures.push({
        category: category,
        text: test.text.substring(0, 60) + '...',
        expected: test.expected.safe,
        got: validationResult.safe,
        method: validationResult.method,
        reasoning: test.reasoning
      });
    }

    // Track improvements
    if (!isRepeat) {
      const baselineFailure = baseline?.failures.find(f =>
        f.text.startsWith(test.text.substring(0, 30))
      );
      const twoPassFailure = twoPassResults?.failures.find(f =>
        f.text.startsWith(test.text.substring(0, 30))
      );

      if ((baselineFailure || twoPassFailure) && result.passed) {
        results.improvements.push({
          category: category,
          text: test.text.substring(0, 60) + '...',
          method: validationResult.method
        });
      }
    }

  } catch (error) {
    result.error = error.message;
    result.passed = false;
  }

  return result;
}

async function runOptimizedTest() {
  console.log('========================================');
  console.log('OPTIMIZED 2-PASS VALIDATION TEST');
  console.log('Optimizations:');
  console.log('- FREE Gemini for both passes');
  console.log('- Pattern-based instant decisions');
  console.log('- Result caching');
  console.log('- Parallel regex checking');
  console.log('========================================\n');

  // Load test suite
  const testSuite = JSON.parse(
    fs.readFileSync('/home/projects/safeprompt/test-suite/real-tests.json', 'utf8')
  );

  console.log('Expected improvements over standard 2-pass:');
  console.log('- More instant decisions via patterns');
  console.log('- Zero cost (all free models)');
  console.log('- Cache hits on repeated prompts\n');

  // Test each category
  for (const [category, tests] of Object.entries(testSuite.tests)) {
    console.log(`\nTesting ${category}: ${tests.length} tests`);
    console.log('Progress: ', { end: '' });

    results.byCategory[category] = {
      total: tests.length,
      passed: 0,
      failed: 0,
      accuracy: 0,
      patternCount: 0,
      onePassCount: 0,
      twoPassCount: 0
    };

    for (const test of tests) {
      const result = await testPrompt(test, category);

      if (!result.isRepeat) {
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

        // Track method distribution
        if (result.actual.method === 'pattern' || result.actual.method === 'regex') {
          results.byCategory[category].patternCount++;
        } else if (result.actual.passesExecuted === 1) {
          results.byCategory[category].onePassCount++;
        } else {
          results.byCategory[category].twoPassCount++;
        }
      }
    }

    // Calculate accuracy
    results.byCategory[category].accuracy =
      (results.byCategory[category].passed / results.byCategory[category].total * 100).toFixed(1);

    console.log(`\n${category}: ${results.byCategory[category].passed}/${results.byCategory[category].total} passed (${results.byCategory[category].accuracy}%)`);
    console.log(`  → Pattern: ${results.byCategory[category].patternCount}, 1-pass: ${results.byCategory[category].onePassCount}, 2-pass: ${results.byCategory[category].twoPassCount}`);
  }

  // Test cache effectiveness
  if (CONFIG.testCache) {
    console.log('\n\nTesting cache effectiveness (5 repeated prompts)...');
    const cacheTests = [
      testSuite.tests.legacy[0],
      testSuite.tests.falsePositive[0],
      testSuite.tests.advanced[0],
      testSuite.tests.legacy[1],
      testSuite.tests.falsePositive[1]
    ];

    for (const test of cacheTests) {
      await testPrompt(test, 'cache', true);
      process.stdout.write('C');
    }
    console.log(' Done');
  }

  // Calculate overall accuracy
  results.summary.accuracy = (results.summary.passed / results.summary.total * 100).toFixed(1);

  // Calculate performance averages
  const avgPattern = results.byPasses.pattern.times.length > 0 ?
    results.byPasses.pattern.times.reduce((a, b) => a + b, 0) /
    results.byPasses.pattern.times.length : 0;

  const avgOnePass = results.byPasses.onePass.times.length > 0 ?
    results.byPasses.onePass.times.reduce((a, b) => a + b, 0) /
    results.byPasses.onePass.times.length : 0;

  const avgTwoPass = results.byPasses.twoPasses.times.length > 0 ?
    results.byPasses.twoPasses.times.reduce((a, b) => a + b, 0) /
    results.byPasses.twoPasses.times.length : 0;

  const avgCached = results.byPasses.cached.times.length > 0 ?
    results.byPasses.cached.times.reduce((a, b) => a + b, 0) /
    results.byPasses.cached.times.length : 0;

  const avgOverall = results.performance.allTimes.reduce((a, b) => a + b, 0) /
                     results.performance.allTimes.length;

  // Print report
  console.log('\n========================================');
  console.log('OPTIMIZED 2-PASS RESULTS SUMMARY');
  console.log('========================================\n');

  console.log('Overall Performance:');
  console.log(`  Total Tests: ${results.summary.total}`);
  console.log(`  Passed: ${results.summary.passed}`);
  console.log(`  Failed: ${results.summary.failed}`);
  console.log(`  Accuracy: ${results.summary.accuracy}%\n`);

  console.log('Performance by Category:');
  for (const [category, stats] of Object.entries(results.byCategory)) {
    const baselineAcc = baseline?.byCategory[category]?.accuracy || 'N/A';
    const v2Acc = v2Results?.byCategory[category]?.accuracy || 'N/A';
    const twoPassAcc = twoPassResults?.byCategory[category]?.accuracy || 'N/A';

    console.log(`  ${category}: ${stats.accuracy}% (baseline: ${baselineAcc}%, v2: ${v2Acc}%, 2-pass: ${twoPassAcc}%)`);
  }

  console.log('\nDetection Method Distribution:');
  console.log(`  Pattern/Regex: ${results.byPasses.pattern.count} (${(results.byPasses.pattern.count / results.summary.total * 100).toFixed(1)}%)`);
  console.log(`  AI Pre-filter: ${results.byPasses.onePass.count} (${(results.byPasses.onePass.count / results.summary.total * 100).toFixed(1)}%)`);
  console.log(`  Full Validation: ${results.byPasses.twoPasses.count} (${(results.byPasses.twoPasses.count / results.summary.total * 100).toFixed(1)}%)`);
  console.log(`  Cache Hits: ${results.byPasses.cached.count}`);

  console.log('\nTiming Performance:');
  console.log(`  Pattern Match: ${avgPattern.toFixed(2)}ms`);
  console.log(`  AI Pre-filter: ${avgOnePass.toFixed(2)}ms`);
  console.log(`  Full Validation: ${avgTwoPass.toFixed(2)}ms`);
  console.log(`  Cache Hit: ${avgCached.toFixed(2)}ms`);
  console.log(`  Overall Average: ${avgOverall.toFixed(2)}ms`);

  // Compare with previous versions
  const v2AvgTime = 1360;
  const twoPassAvgTime = 846;
  const timeSavingsVsV2 = ((v2AvgTime - avgOverall) / v2AvgTime * 100).toFixed(1);
  const timeSavingsVs2Pass = ((twoPassAvgTime - avgOverall) / twoPassAvgTime * 100).toFixed(1);

  console.log(`\nSpeed Improvements:`);
  console.log(`  vs V2: ${timeSavingsVsV2}% faster (${v2AvgTime}ms → ${avgOverall.toFixed(0)}ms)`);
  console.log(`  vs 2-Pass: ${timeSavingsVs2Pass}% faster (${twoPassAvgTime}ms → ${avgOverall.toFixed(0)}ms)`);

  // Save results
  fs.writeFileSync(
    '/home/projects/safeprompt/test-suite/2pass-optimized-results.json',
    JSON.stringify(results, null, 2)
  );

  // Final comparison
  console.log('\n========================================');
  console.log('FINAL COMPARISON');
  console.log('========================================\n');

  const twoPassAccuracy = twoPassResults ? parseFloat(twoPassResults.summary.accuracy) : 0;
  const optimizedAccuracy = parseFloat(results.summary.accuracy);

  console.log('| System | Accuracy | Avg Latency | Cost |');
  console.log('|--------|----------|-------------|------|');
  console.log(`| Baseline | 43.2% | 1360ms | $$ |`);
  console.log(`| V2 | 63.6% | 1360ms | FREE |`);
  console.log(`| 2-Pass | ${twoPassAccuracy}% | 846ms | $ |`);
  console.log(`| Optimized | ${optimizedAccuracy}% | ${avgOverall.toFixed(0)}ms | FREE |`);

  console.log('\n========================================');
  console.log('VERDICT');
  console.log('========================================\n');

  if (optimizedAccuracy >= twoPassAccuracy && avgOverall < twoPassAvgTime) {
    console.log('🚀 EXCELLENT - Optimized system improves on all metrics');
  } else if (optimizedAccuracy >= twoPassAccuracy - 2) {
    console.log('✅ SUCCESS - Optimized system maintains accuracy with better speed/cost');
  } else if (optimizedAccuracy >= 85) {
    console.log('🔶 GOOD - Optimized system performs well');
  } else {
    console.log('⚠️ NEEDS WORK - Accuracy below target');
  }

  console.log(`\nResults saved to: 2pass-optimized-results.json`);
}

// Run optimized test
runOptimizedTest().catch(console.error);