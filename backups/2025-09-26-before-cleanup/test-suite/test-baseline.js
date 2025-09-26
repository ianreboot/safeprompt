/**
 * BASELINE TEST - Document current system performance
 * Tests the OLD regex + OLD AI prompt against our new test suite
 * This establishes how well the current system performs
 */

import fs from 'fs';
import { validatePrompt } from '/home/projects/safeprompt/api/lib/prompt-validator.js';
import { validateWithAI } from '/home/projects/safeprompt/api/lib/ai-validator.js';

// Test configuration
const CONFIG = {
  testRegex: true,
  testAI: true,
  testCombined: true,
  verbose: false,
  aiDelay: 1500  // Delay between AI calls to avoid rate limits
};

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  system: "BASELINE - Old Regex + Old AI Prompt",

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

  failures: []
};

async function testPrompt(test, category) {
  const result = {
    text: test.text.substring(0, 100),
    category: category,
    expected: test.expected.safe,
    actual: {},
    passed: false
  };

  try {
    // Test regex validation
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

    // Test AI validation (with delay)
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
        threats: aiResult.threats
      };
    }

    // Combined result (both must agree it's unsafe to block)
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

  } catch (error) {
    result.error = error.message;
    result.passed = false;
  }

  return result;
}

async function runBaseline() {
  console.log('========================================');
  console.log('BASELINE PERFORMANCE TEST');
  console.log('Current System: Old Regex + Old AI Prompt');
  console.log('========================================\n');

  // Load test suite
  const testSuite = JSON.parse(
    fs.readFileSync('/home/projects/safeprompt/test-suite/real-tests.json', 'utf8')
  );

  console.log('Testing categories:');
  console.log('- Legacy (DAN, basic injections)');
  console.log('- False Positives (legitimate use)');
  console.log('- Advanced (sophisticated attacks)');
  console.log('- Gray Zone (ambiguous cases)\n');

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
  console.log('BASELINE RESULTS SUMMARY');
  console.log('========================================\n');

  console.log('Overall Performance:');
  console.log(`  Total Tests: ${results.summary.total}`);
  console.log(`  Passed: ${results.summary.passed}`);
  console.log(`  Failed: ${results.summary.failed}`);
  console.log(`  Accuracy: ${results.summary.accuracy}%\n`);

  console.log('Performance by Category:');
  for (const [category, stats] of Object.entries(results.byCategory)) {
    console.log(`  ${category}: ${stats.accuracy}% (${stats.passed}/${stats.total})`);
  }

  console.log('\nTiming Performance:');
  console.log(`  Avg Regex Time: ${avgRegex.toFixed(2)}ms`);
  console.log(`  Avg AI Time: ${avgAI.toFixed(2)}ms`);
  console.log(`  Total Time per Request: ~${(avgRegex + avgAI).toFixed(2)}ms`);

  // Show critical failures
  console.log('\n========================================');
  console.log('CRITICAL ANALYSIS');
  console.log('========================================\n');

  // Analyze legacy failures
  const legacyFailures = results.failures.filter(f => f.category === 'legacy');
  if (legacyFailures.length > 0) {
    console.log(`⚠️  Failed ${legacyFailures.length} LEGACY tests (basic attacks like DAN):`);
    legacyFailures.slice(0, 3).forEach(f => {
      console.log(`   - "${f.text}"`);
    });
  }

  // Analyze false positive failures
  const fpFailures = results.failures.filter(f => f.category === 'falsePositive');
  if (fpFailures.length > 0) {
    console.log(`\n⚠️  Failed ${fpFailures.length} FALSE POSITIVE tests (blocked legitimate use):`);
    fpFailures.slice(0, 3).forEach(f => {
      console.log(`   - "${f.text}"`);
    });
  }

  // Analyze advanced attack failures
  const advancedFailures = results.failures.filter(f => f.category === 'advanced');
  if (advancedFailures.length > 0) {
    console.log(`\n⚠️  Failed ${advancedFailures.length} ADVANCED tests (sophisticated attacks):`);
    advancedFailures.slice(0, 3).forEach(f => {
      console.log(`   - "${f.text}"`);
    });
  }

  // Save results to file
  fs.writeFileSync(
    '/home/projects/safeprompt/test-suite/baseline-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n========================================');
  console.log('VERDICT');
  console.log('========================================\n');

  if (results.summary.accuracy >= 90) {
    console.log('✅ EXCELLENT - Current system is highly effective');
  } else if (results.summary.accuracy >= 70) {
    console.log('🔶 MODERATE - Current system has significant gaps');
  } else if (results.summary.accuracy >= 50) {
    console.log('⚠️  WEAK - Current system needs major improvements');
  } else {
    console.log('❌ CRITICAL - Current system is inadequate');
  }

  console.log(`\nBaseline documented in: baseline-results.json`);
  console.log('This data will be used to measure improvement with the new system.\n');
}

// Run baseline test
runBaseline().catch(console.error);