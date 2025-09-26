/**
 * Test the HYBRID Two-Layer Validation System
 * Layer 1: Mechanical regex filters (5ms) for SQL/XSS/etc
 * Layer 2: Simplified AI validation (1.3s) for semantic attacks
 *
 * Expected: 78% accuracy, 900ms average latency
 */

import fs from 'fs';
import { validateHybrid } from '/home/projects/safeprompt/api/lib/ai-validator-hybrid.js';

// Test configuration
const CONFIG = {
  verbose: false,
  aiDelay: 1500,  // Delay between AI calls to avoid rate limits
  showLayerStats: true  // Show which layer caught what
};

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  system: "HYBRID - Mechanical Filters + Context-Aware AI",

  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    accuracy: 0
  },

  byCategory: {},

  byLayer: {
    mechanical: { caught: 0, patterns: {} },
    regex: { caught: 0 },
    ai: { caught: 0 },
    combined: { caught: 0 }
  },

  performance: {
    mechanicalTimes: [],  // Should be <5ms
    aiTimes: [],          // Should be ~1300ms
    totalTimes: []
  },

  failures: [],
  improvements: []
};

// Load baseline for comparison
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
    const hybridResult = await validateHybrid(test.text, {
      model: 'google/gemini-2.0-flash-exp:free',
      timeout: 10000
    });
    const totalTime = Date.now() - start;

    result.actual = {
      safe: hybridResult.safe,
      confidence: hybridResult.confidence,
      threats: hybridResult.threats,
      layer: hybridResult.layer,
      processor: hybridResult.processor,
      reasoning: hybridResult.reasoning
    };

    // Track performance by layer
    results.performance.totalTimes.push(totalTime);

    if (hybridResult.layer === 1) {
      results.performance.mechanicalTimes.push(totalTime);
      results.byLayer.mechanical.caught++;

      // Track which patterns are working
      if (hybridResult.patterns_matched) {
        hybridResult.patterns_matched.forEach(pattern => {
          results.byLayer.mechanical.patterns[pattern] =
            (results.byLayer.mechanical.patterns[pattern] || 0) + 1;
        });
      }
    } else if (hybridResult.layer === 1.5) {
      results.byLayer.regex.caught++;
    } else if (hybridResult.layer === 2) {
      results.performance.aiTimes.push(totalTime);
      results.byLayer.ai.caught++;
    } else if (hybridResult.layer === 'combined') {
      results.byLayer.combined.caught++;
    }

    // Evaluate pass/fail
    result.passed = (hybridResult.safe === test.expected.safe);

    if (!result.passed) {
      results.failures.push({
        category: category,
        text: test.text.substring(0, 60) + '...',
        expected: test.expected.safe,
        got: hybridResult.safe,
        layer: hybridResult.layer,
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
        fixedFrom: baselineFailure ? 'baseline' : 'v2',
        layer: hybridResult.layer
      });
    }

  } catch (error) {
    result.error = error.message;
    result.passed = false;
  }

  return result;
}

async function runHybridTest() {
  console.log('========================================');
  console.log('HYBRID VALIDATION SYSTEM TEST');
  console.log('Two-Layer Architecture:');
  console.log('- Layer 1: Mechanical filters (SQL/XSS/CMD)');
  console.log('- Layer 2: AI for semantic attacks');
  console.log('========================================\n');

  // Load test suite
  const testSuite = JSON.parse(
    fs.readFileSync('/home/projects/safeprompt/test-suite/real-tests.json', 'utf8')
  );

  console.log('Expected improvements:');
  console.log('- SQL/XSS detection: 99%+ (mechanical)');
  console.log('- False positives: <20% (context-aware AI)');
  console.log('- Average latency: ~900ms');
  console.log('- Overall accuracy: 75-80%\n');

  // Test each category
  for (const [category, tests] of Object.entries(testSuite.tests)) {
    console.log(`\nTesting ${category}: ${tests.length} tests`);
    console.log('Progress: ', { end: '' });

    results.byCategory[category] = {
      total: tests.length,
      passed: 0,
      failed: 0,
      accuracy: 0
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
    }

    // Calculate accuracy for category
    results.byCategory[category].accuracy =
      (results.byCategory[category].passed / results.byCategory[category].total * 100).toFixed(1);

    console.log(`\n${category}: ${results.byCategory[category].passed}/${results.byCategory[category].total} passed (${results.byCategory[category].accuracy}%)`);
  }

  // Calculate overall accuracy
  results.summary.accuracy = (results.summary.passed / results.summary.total * 100).toFixed(1);

  // Calculate performance averages
  const avgMechanical = results.performance.mechanicalTimes.length > 0 ?
    results.performance.mechanicalTimes.reduce((a, b) => a + b, 0) /
    results.performance.mechanicalTimes.length : 0;

  const avgAI = results.performance.aiTimes.length > 0 ?
    results.performance.aiTimes.reduce((a, b) => a + b, 0) /
    results.performance.aiTimes.length : 0;

  const avgTotal = results.performance.totalTimes.reduce((a, b) => a + b, 0) /
                   results.performance.totalTimes.length;

  // Print detailed report
  console.log('\n========================================');
  console.log('HYBRID SYSTEM RESULTS SUMMARY');
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
    const improvement = baselineAccuracy !== 'N/A' ?
      (parseFloat(stats.accuracy) - parseFloat(baselineAccuracy)).toFixed(1) : '';

    console.log(`  ${category}: ${stats.accuracy}% (baseline: ${baselineAccuracy}%, v2: ${v2Accuracy}%)`);
  }

  console.log('\nLayer Distribution:');
  console.log(`  Mechanical Filter: ${results.byLayer.mechanical.caught} caught`);
  console.log(`  Regex Validator: ${results.byLayer.regex.caught} caught`);
  console.log(`  AI Validation: ${results.byLayer.ai.caught} caught`);
  console.log(`  Combined: ${results.byLayer.combined.caught} caught`);

  if (Object.keys(results.byLayer.mechanical.patterns).length > 0) {
    console.log('\nMechanical Pattern Effectiveness:');
    for (const [pattern, count] of Object.entries(results.byLayer.mechanical.patterns)) {
      console.log(`    ${pattern}: ${count} detections`);
    }
  }

  console.log('\nTiming Performance:');
  console.log(`  Avg Mechanical Filter: ${avgMechanical.toFixed(2)}ms`);
  console.log(`  Avg AI Validation: ${avgAI.toFixed(2)}ms`);
  console.log(`  Avg Total Time: ${avgTotal.toFixed(2)}ms`);

  // Show improvements
  if (results.improvements.length > 0) {
    console.log('\n✅ FIXED FROM PREVIOUS VERSIONS:');
    results.improvements.slice(0, 5).forEach(imp => {
      console.log(`  - [${imp.category}] "${imp.text}" (fixed by layer ${imp.layer})`);
    });
    if (results.improvements.length > 5) {
      console.log(`  ... and ${results.improvements.length - 5} more`);
    }
  }

  // Show remaining failures
  if (results.failures.length > 0) {
    console.log('\n⚠️  STILL FAILING:');
    results.failures.slice(0, 5).forEach(f => {
      console.log(`  - [${f.category}] "${f.text}" (layer ${f.layer})`);
    });
    if (results.failures.length > 5) {
      console.log(`  ... and ${results.failures.length - 5} more`);
    }
  }

  // Save results
  fs.writeFileSync(
    '/home/projects/safeprompt/test-suite/hybrid-results.json',
    JSON.stringify(results, null, 2)
  );

  // Comparison with baseline and V2
  console.log('\n========================================');
  console.log('COMPARISON WITH PREVIOUS VERSIONS');
  console.log('========================================\n');

  const baselineAccuracy = baseline ? parseFloat(baseline.summary.accuracy) : 0;
  const v2Accuracy = v2Results ? parseFloat(v2Results.summary.accuracy) : 0;
  const hybridAccuracy = parseFloat(results.summary.accuracy);

  console.log(`Baseline (regex + old AI): ${baselineAccuracy}%`);
  console.log(`V2 (regex + context AI): ${v2Accuracy}%`);
  console.log(`Hybrid (mechanical + AI): ${hybridAccuracy}%`);
  console.log(`Improvement over baseline: ${(hybridAccuracy - baselineAccuracy).toFixed(1)}%`);
  console.log(`Improvement over V2: ${(hybridAccuracy - v2Accuracy).toFixed(1)}%`);

  console.log('\n========================================');
  console.log('VERDICT');
  console.log('========================================\n');

  if (results.summary.accuracy >= 85) {
    console.log('✅ EXCELLENT - Hybrid system highly effective');
  } else if (results.summary.accuracy >= 75) {
    console.log('🔶 GOOD - Hybrid system shows strong improvement');
  } else if (results.summary.accuracy >= 65) {
    console.log('⚠️  MODERATE - Hybrid system needs refinement');
  } else {
    console.log('❌ POOR - Hybrid system not meeting expectations');
  }

  console.log(`\nResults saved to: hybrid-results.json`);
}

// Run hybrid test
runHybridTest().catch(console.error);