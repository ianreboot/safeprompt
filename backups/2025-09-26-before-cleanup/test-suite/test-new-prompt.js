/**
 * Test the NEW AI Prompt (V2) against the same test suite
 * This will show the improvement over the baseline
 */

import fs from 'fs';
import { validatePrompt } from '/home/projects/safeprompt/api/lib/prompt-validator.js';
import { validateWithAI } from '/home/projects/safeprompt/api/lib/ai-validator-v2.js'; // NEW V2 PROMPT

// Test configuration
const CONFIG = {
  testRegex: true,
  testAI: true,
  testCombined: true,
  verbose: false,
  aiDelay: 1500  // Delay between AI calls
};

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  system: "NEW PROMPT - V2.0 Context-Aware AI",

  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    accuracy: 0
  },

  byCategory: {},

  performance: {
    regexTimes: [],
    aiTimes: []
  },

  failures: [],
  improvements: []  // Track improvements over baseline
};

// Load baseline for comparison
let baseline = null;
if (fs.existsSync('/home/projects/safeprompt/test-suite/baseline-results.json')) {
  baseline = JSON.parse(fs.readFileSync('/home/projects/safeprompt/test-suite/baseline-results.json', 'utf8'));
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
    // Test regex validation (same as before)
    if (CONFIG.testRegex) {
      const start = Date.now();
      const regexResult = validatePrompt(test.text);
      results.performance.regexTimes.push(Date.now() - start);

      result.actual.regex = {
        safe: regexResult.safe,
        confidence: regexResult.confidence,
        threats: regexResult.threats
      };
    }

    // Test NEW AI validation
    if (CONFIG.testAI) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.aiDelay));

      const start = Date.now();
      const aiResult = await validateWithAI(test.text, {
        model: 'google/gemini-2.0-flash-exp:free',
        timeout: 10000
      });
      results.performance.aiTimes.push(Date.now() - start);

      result.actual.ai = {
        safe: aiResult.safe,
        confidence: aiResult.confidence,
        threats: aiResult.threats,
        reasoning: aiResult.reasoning
      };
    }

    // Combined result
    if (CONFIG.testCombined && result.actual.regex && result.actual.ai) {
      result.actual.combined = {
        safe: result.actual.regex.safe && result.actual.ai.safe,
        confidence: Math.min(result.actual.regex.confidence, result.actual.ai.confidence)
      };
    }

    // Evaluate pass/fail
    const finalResult = result.actual.combined || result.actual.ai || result.actual.regex;
    result.passed = (finalResult.safe === test.expected.safe);

    if (!result.passed) {
      results.failures.push({
        category: category,
        text: test.text.substring(0, 60) + '...',
        expected: test.expected.safe,
        got: finalResult.safe,
        reasoning: test.reasoning
      });
    }

    // Track improvements over baseline
    const baselineFailure = baseline?.failures.find(f =>
      f.text.startsWith(test.text.substring(0, 30))
    );
    if (baselineFailure && result.passed) {
      results.improvements.push({
        category: category,
        text: test.text.substring(0, 60) + '...',
        fixed: true
      });
    }

  } catch (error) {
    result.error = error.message;
    result.passed = false;
  }

  return result;
}

async function runNewPromptTest() {
  console.log('========================================');
  console.log('NEW AI PROMPT (V2) PERFORMANCE TEST');
  console.log('Context-Aware Validation System');
  console.log('========================================\n');

  // Load test suite
  const testSuite = JSON.parse(
    fs.readFileSync('/home/projects/safeprompt/test-suite/real-tests.json', 'utf8')
  );

  console.log('Testing with NEW prompt that understands:');
  console.log('- Business vs AI context distinction');
  console.log('- Meta-validation attacks');
  console.log('- False context claims');
  console.log('- Legitimate code debugging\n');

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
  const avgRegex = results.performance.regexTimes.reduce((a, b) => a + b, 0) /
                   results.performance.regexTimes.length;
  const avgAI = results.performance.aiTimes.reduce((a, b) => a + b, 0) /
                results.performance.aiTimes.length;

  // Print detailed report
  console.log('\n========================================');
  console.log('NEW PROMPT (V2) RESULTS SUMMARY');
  console.log('========================================\n');

  console.log('Overall Performance:');
  console.log(`  Total Tests: ${results.summary.total}`);
  console.log(`  Passed: ${results.summary.passed}`);
  console.log(`  Failed: ${results.summary.failed}`);
  console.log(`  Accuracy: ${results.summary.accuracy}%\n`);

  console.log('Performance by Category:');
  for (const [category, stats] of Object.entries(results.byCategory)) {
    const baselineAccuracy = baseline?.byCategory[category]?.accuracy || 'N/A';
    const improvement = baselineAccuracy !== 'N/A' ?
      (parseFloat(stats.accuracy) - parseFloat(baselineAccuracy)).toFixed(1) : '';
    const arrow = improvement && parseFloat(improvement) > 0 ? '↑' :
                  improvement && parseFloat(improvement) < 0 ? '↓' : '';

    console.log(`  ${category}: ${stats.accuracy}% (was ${baselineAccuracy}%) ${arrow}${improvement ? improvement + '%' : ''}`);
  }

  console.log('\nTiming Performance:');
  console.log(`  Avg Regex Time: ${avgRegex.toFixed(2)}ms`);
  console.log(`  Avg AI Time: ${avgAI.toFixed(2)}ms`);
  console.log(`  Total Time per Request: ~${(avgRegex + avgAI).toFixed(2)}ms`);

  // Show improvements
  if (results.improvements.length > 0) {
    console.log('\n✅ FIXED FROM BASELINE:');
    results.improvements.slice(0, 5).forEach(imp => {
      console.log(`  - [${imp.category}] "${imp.text}"`);
    });
    if (results.improvements.length > 5) {
      console.log(`  ... and ${results.improvements.length - 5} more`);
    }
  }

  // Show remaining failures
  if (results.failures.length > 0) {
    console.log('\n⚠️  STILL FAILING:');
    results.failures.slice(0, 5).forEach(f => {
      console.log(`  - [${f.category}] "${f.text}"`);
    });
    if (results.failures.length > 5) {
      console.log(`  ... and ${results.failures.length - 5} more`);
    }
  }

  // Save results
  fs.writeFileSync(
    '/home/projects/safeprompt/test-suite/new-prompt-results.json',
    JSON.stringify(results, null, 2)
  );

  // Comparison with baseline
  if (baseline) {
    console.log('\n========================================');
    console.log('IMPROVEMENT OVER BASELINE');
    console.log('========================================\n');

    const baselineAccuracy = parseFloat(baseline.summary.accuracy);
    const newAccuracy = parseFloat(results.summary.accuracy);
    const improvement = (newAccuracy - baselineAccuracy).toFixed(1);

    console.log(`Baseline Accuracy: ${baselineAccuracy}%`);
    console.log(`New Prompt Accuracy: ${newAccuracy}%`);
    console.log(`Improvement: ${improvement > 0 ? '+' : ''}${improvement}%`);

    if (improvement > 20) {
      console.log('\n🚀 SIGNIFICANT IMPROVEMENT!');
    } else if (improvement > 10) {
      console.log('\n✅ Good improvement');
    } else if (improvement > 0) {
      console.log('\n📈 Modest improvement');
    } else {
      console.log('\n⚠️  No improvement or regression');
    }
  }

  console.log('\n========================================');
  console.log('VERDICT');
  console.log('========================================\n');

  if (results.summary.accuracy >= 90) {
    console.log('✅ EXCELLENT - New prompt is highly effective');
  } else if (results.summary.accuracy >= 70) {
    console.log('🔶 GOOD - New prompt shows significant improvement');
  } else if (results.summary.accuracy >= 50) {
    console.log('⚠️  MODERATE - New prompt needs refinement');
  } else {
    console.log('❌ POOR - New prompt is not working as expected');
  }

  console.log(`\nResults saved to: new-prompt-results.json`);
}

// Run test with new prompt
runNewPromptTest().catch(console.error);