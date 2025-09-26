/**
 * Test the 2-Pass Validation System - GEMINI ONLY VERSION
 * Pass 1: Gemini with minimal prompt (aiming for ~500ms)
 * Pass 2: Gemini with full V2 prompt (~1.3s)
 *
 * Goal: Zero cost while maintaining high accuracy
 */

import fs from 'fs';
import { validate2PassGemini } from '/home/projects/safeprompt/api/lib/ai-validator-2pass-gemini.js';

// Test configuration
const CONFIG = {
  verbose: false,
  aiDelay: 1500,  // Delay between AI calls
  showPassStats: true,
  preFilterThreshold: {
    high: 0.8,
    low: 0.8
  }
};

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  system: "2-PASS GEMINI - Free Gemini for both passes",

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
    fastOnlyTimes: [],
    fullValidationTimes: []
  },

  failures: [],
  improvements: []
};

// Load comparison data
let baseline = null;
let v2Results = null;
let twoPassGPTResults = null;
if (fs.existsSync('/home/projects/safeprompt/test-suite/baseline-results.json')) {
  baseline = JSON.parse(fs.readFileSync('/home/projects/safeprompt/test-suite/baseline-results.json', 'utf8'));
}
if (fs.existsSync('/home/projects/safeprompt/test-suite/new-prompt-results.json')) {
  v2Results = JSON.parse(fs.readFileSync('/home/projects/safeprompt/test-suite/new-prompt-results.json', 'utf8'));
}
if (fs.existsSync('/home/projects/safeprompt/test-suite/2pass-results.json')) {
  twoPassGPTResults = JSON.parse(fs.readFileSync('/home/projects/safeprompt/test-suite/2pass-results.json', 'utf8'));
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
    // Add delay for rate limiting
    if (results.summary.total > 0) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.aiDelay));
    }

    const start = Date.now();
    const validationResult = await validate2PassGemini(test.text, {
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

    // Track improvements
    const baselineFailure = baseline?.failures.find(f =>
      f.text.startsWith(test.text.substring(0, 30))
    );
    const gptFailure = twoPassGPTResults?.failures.find(f =>
      f.text.startsWith(test.text.substring(0, 30))
    );

    if ((baselineFailure || gptFailure) && result.passed) {
      results.improvements.push({
        category: category,
        text: test.text.substring(0, 60) + '...',
        fixedFrom: baselineFailure && gptFailure ? 'both' : (baselineFailure ? 'baseline' : 'gpt-version'),
        passesUsed: validationResult.passesExecuted
      });
    }

  } catch (error) {
    result.error = error.message;
    result.passed = false;
  }

  return result;
}

async function runGeminiTest() {
  console.log('========================================');
  console.log('2-PASS GEMINI VALIDATION TEST');
  console.log('Architecture:');
  console.log('- Pass 1: Gemini with minimal prompt');
  console.log('- Pass 2: Gemini with full V2 prompt');
  console.log('- Cost: COMPLETELY FREE');
  console.log('========================================\n');

  // Load test suite
  const testSuite = JSON.parse(
    fs.readFileSync('/home/projects/safeprompt/test-suite/real-tests.json', 'utf8')
  );

  console.log('Comparing with:');
  console.log('- 2-Pass GPT+Gemini: 90.9% accuracy @ 846ms (costs $)');
  console.log('- Goal: Match accuracy with zero cost\n');

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

    // Calculate accuracy
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

  // Print report
  console.log('\n========================================');
  console.log('2-PASS GEMINI RESULTS SUMMARY');
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
    const gptAcc = twoPassGPTResults?.byCategory[category]?.accuracy || 'N/A';

    console.log(`  ${category}: ${stats.accuracy}% (baseline: ${baselineAcc}%, V2: ${v2Acc}%, GPT-2Pass: ${gptAcc}%)`);
  }

  console.log('\nPass Distribution:');
  console.log(`  Single Pass: ${results.byPasses.onePass.count} tests (${(results.byPasses.onePass.count / results.summary.total * 100).toFixed(1)}%)`);
  console.log(`  Two Passes: ${results.byPasses.twoPasses.count} tests (${(results.byPasses.twoPasses.count / results.summary.total * 100).toFixed(1)}%)`);

  console.log('\nTiming Performance:');
  console.log(`  Avg Single Pass: ${avgOnePass.toFixed(2)}ms`);
  console.log(`  Avg Two Passes: ${avgTwoPass.toFixed(2)}ms`);
  console.log(`  Overall Average: ${avgOverall.toFixed(2)}ms`);

  // Compare with GPT version
  const gptAvgTime = 846;
  const gptAccuracy = 90.9;
  const timeDiff = avgOverall - gptAvgTime;
  const accuracyDiff = parseFloat(results.summary.accuracy) - gptAccuracy;

  console.log('\n========================================');
  console.log('COMPARISON: GEMINI vs GPT+GEMINI');
  console.log('========================================\n');

  console.log(`| Metric | GPT+Gemini | Gemini Only | Difference |`);
  console.log(`|--------|------------|-------------|------------|`);
  console.log(`| Accuracy | ${gptAccuracy}% | ${results.summary.accuracy}% | ${accuracyDiff > 0 ? '+' : ''}${accuracyDiff.toFixed(1)}% |`);
  console.log(`| Latency | ${gptAvgTime}ms | ${avgOverall.toFixed(0)}ms | ${timeDiff > 0 ? '+' : ''}${timeDiff.toFixed(0)}ms |`);
  console.log(`| Cost | ~$1.60/1K | $0.00 | -100% |`);

  // Show improvements
  if (results.improvements.length > 0) {
    console.log('\n✅ FIXED vs PREVIOUS VERSIONS:');
    results.improvements.slice(0, 5).forEach(imp => {
      console.log(`  - [${imp.category}] "${imp.text}" (${imp.passesUsed} pass${imp.passesUsed > 1 ? 'es' : ''})`);
    });
    if (results.improvements.length > 5) {
      console.log(`  ... and ${results.improvements.length - 5} more`);
    }
  }

  // Show failures
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
    '/home/projects/safeprompt/test-suite/2pass-gemini-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n========================================');
  console.log('VERDICT');
  console.log('========================================\n');

  if (accuracyDiff >= -5 && avgOverall <= gptAvgTime + 200) {
    console.log('🚀 EXCELLENT - Gemini-only achieves similar results at zero cost');
  } else if (accuracyDiff >= -10) {
    console.log('✅ GOOD - Acceptable accuracy loss for zero cost');
  } else if (results.summary.accuracy >= 80) {
    console.log('🔶 MODERATE - Lower accuracy but still usable');
  } else {
    console.log('❌ POOR - Accuracy too low for production use');
  }

  console.log(`\nResults saved to: 2pass-gemini-results.json`);
}

// Run test
runGeminiTest().catch(console.error);