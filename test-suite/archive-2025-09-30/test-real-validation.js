/**
 * Test SafePrompt with REAL attack patterns
 * Based on AI_MANIPULATION_TECHNIQUES.md research
 *
 * Handles:
 * - Boolean safe/unsafe classification
 * - Confidence scores (0.0-1.0)
 * - Gray zone detection
 * - Context-dependent interpretations
 */

import fs from 'fs';
import { validatePrompt } from '/home/projects/safeprompt/api/lib/prompt-validator.js';
import { validateWithAI } from '/home/projects/safeprompt/api/lib/ai-validator.js';

// Load real test suite
const TEST_FILE = '/home/projects/safeprompt/test-suite/real-tests.json';

// Test configuration
const CONFIG = {
  testRegexOnly: true,      // Test regex validation
  testAI: true,             // Test AI validation
  testCombined: true,       // Test combined approach
  verbose: false,           // Show detailed results
  stopOnFailure: false,     // Stop at first failure
  delayBetweenAI: 1000,    // Delay between AI calls (ms)

  // Confidence thresholds
  confidenceThresholds: {
    veryHigh: 0.8,
    high: 0.6,
    medium: 0.4,
    low: 0.2
  }
};

// Result tracking
const results = {
  legacy: { passed: 0, failed: 0, errors: [] },
  falsePositive: { passed: 0, failed: 0, errors: [] },
  advanced: { passed: 0, failed: 0, errors: [] },
  grayZone: { passed: 0, failed: 0, errors: [] },

  performance: {
    regexTimes: [],
    aiTimes: [],
    combinedTimes: []
  },

  confidenceAnalysis: {
    correct: [],
    incorrect: [],
    uncertain: []
  }
};

/**
 * Test a single prompt
 */
async function testPrompt(test, category) {
  const result = {
    text: test.text,
    category: category,
    expected: test.expected,
    actual: {},
    passed: false,
    reasoning: test.reasoning,
    grayZone: test.grayZone || false
  };

  try {
    // Test 1: Regex validation
    if (CONFIG.testRegexOnly) {
      const start = Date.now();
      const regexResult = validatePrompt(test.text);
      const elapsed = Date.now() - start;

      result.actual.regex = {
        safe: regexResult.safe,
        confidence: regexResult.confidence,
        time: elapsed,
        threats: regexResult.threats
      };

      results.performance.regexTimes.push(elapsed);
    }

    // Test 2: AI validation (with delay to avoid rate limits)
    if (CONFIG.testAI) {
      if (CONFIG.delayBetweenAI > 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenAI));
      }

      const start = Date.now();
      const aiResult = await validateWithAI(test.text, {
        model: 'google/gemini-2.0-flash-exp:free',
        timeout: 10000
      });
      const elapsed = Date.now() - start;

      result.actual.ai = {
        safe: aiResult.safe,
        confidence: aiResult.confidence,
        time: elapsed,
        threats: aiResult.threats
      };

      results.performance.aiTimes.push(elapsed);
    }

    // Test 3: Combined validation (regex + AI)
    if (CONFIG.testCombined && CONFIG.testRegexOnly && CONFIG.testAI) {
      // Combine results: unsafe if either says unsafe, confidence = minimum
      result.actual.combined = {
        safe: result.actual.regex.safe && result.actual.ai.safe,
        confidence: Math.min(result.actual.regex.confidence, result.actual.ai.confidence),
        reasoning: 'Combined regex + AI validation'
      };
    }

    // Evaluate success
    result.passed = evaluateResult(test, result);

    // Track confidence analysis
    if (result.passed) {
      results.confidenceAnalysis.correct.push(result.actual.combined?.confidence ||
                                             result.actual.ai?.confidence ||
                                             result.actual.regex?.confidence);
    } else {
      results.confidenceAnalysis.incorrect.push(result.actual.combined?.confidence ||
                                               result.actual.ai?.confidence ||
                                               result.actual.regex?.confidence);
    }

    // Handle gray zones specially
    if (test.grayZone) {
      const confidence = result.actual.combined?.confidence ||
                        result.actual.ai?.confidence ||
                        result.actual.regex?.confidence;

      if (confidence >= 0.3 && confidence <= 0.7) {
        results.confidenceAnalysis.uncertain.push(confidence);
      }
    }

  } catch (error) {
    result.error = error.message;
    result.passed = false;
  }

  return result;
}

/**
 * Evaluate if result matches expectations
 */
function evaluateResult(test, result) {
  const actual = result.actual.combined || result.actual.ai || result.actual.regex;

  if (!actual) return false;

  // Check safe/unsafe classification
  if (actual.safe !== test.expected.safe) {
    return false;
  }

  // Check minimum confidence (if specified)
  if (test.expected.minConfidence && actual.confidence < test.expected.minConfidence) {
    return false;
  }

  // For gray zones, accept low confidence as correct
  if (test.grayZone) {
    // Gray zones should have confidence between 0.2-0.7
    if (actual.confidence >= 0.2 && actual.confidence <= 0.7) {
      return true;
    }
  }

  return true;
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('========================================');
  console.log('SafePrompt REAL Validation Tests');
  console.log('========================================\n');

  // Check if test file exists
  if (!fs.existsSync(TEST_FILE)) {
    console.log('Generating test suite...');
    await import('./generate-real-tests.js');
  }

  // Load tests
  const testSuite = JSON.parse(fs.readFileSync(TEST_FILE, 'utf8'));

  console.log(`Loaded ${testSuite.statistics.total} tests\n`);

  // Test each category
  for (const [category, tests] of Object.entries(testSuite.tests)) {
    console.log(`\nTesting ${category} (${tests.length} tests)`);
    console.log('----------------------------------------');

    for (const test of tests) {
      const result = await testPrompt(test, category);

      // Update results
      if (result.passed) {
        results[category].passed++;
        process.stdout.write('.');
      } else {
        results[category].failed++;
        results[category].errors.push(result);
        process.stdout.write('F');

        if (CONFIG.verbose) {
          console.log(`\n  FAILED: ${test.text.substring(0, 50)}...`);
          console.log(`  Expected: safe=${test.expected.safe}`);
          console.log(`  Got: safe=${result.actual.combined?.safe || result.actual.ai?.safe || result.actual.regex?.safe}`);
        }

        if (CONFIG.stopOnFailure) {
          console.log('\nStopping on first failure');
          break;
        }
      }
    }

    console.log(`\n${category}: ${results[category].passed}/${tests.length} passed`);
  }

  // Print summary
  printSummary(testSuite);
}

/**
 * Print test summary
 */
function printSummary(testSuite) {
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');

  // Results by category
  console.log('\nResults by Category:');
  for (const [category, result] of Object.entries(results)) {
    if (category === 'performance' || category === 'confidenceAnalysis') continue;

    const total = result.passed + result.failed;
    const percentage = total > 0 ? (result.passed / total * 100).toFixed(1) : 0;
    console.log(`  ${category}: ${result.passed}/${total} passed (${percentage}%)`);
  }

  // Performance metrics
  if (results.performance.regexTimes.length > 0) {
    const avgRegex = results.performance.regexTimes.reduce((a, b) => a + b, 0) /
                     results.performance.regexTimes.length;
    console.log(`\nPerformance:`);
    console.log(`  Avg regex time: ${avgRegex.toFixed(2)}ms`);
  }

  if (results.performance.aiTimes.length > 0) {
    const avgAI = results.performance.aiTimes.reduce((a, b) => a + b, 0) /
                  results.performance.aiTimes.length;
    console.log(`  Avg AI time: ${avgAI.toFixed(2)}ms`);
  }

  // Confidence analysis
  console.log('\nConfidence Analysis:');
  if (results.confidenceAnalysis.correct.length > 0) {
    const avgCorrect = results.confidenceAnalysis.correct.reduce((a, b) => a + b, 0) /
                       results.confidenceAnalysis.correct.length;
    console.log(`  Avg confidence when correct: ${avgCorrect.toFixed(3)}`);
  }

  if (results.confidenceAnalysis.incorrect.length > 0) {
    const avgIncorrect = results.confidenceAnalysis.incorrect.reduce((a, b) => a + b, 0) /
                         results.confidenceAnalysis.incorrect.length;
    console.log(`  Avg confidence when incorrect: ${avgIncorrect.toFixed(3)}`);
  }

  if (results.confidenceAnalysis.uncertain.length > 0) {
    console.log(`  Gray zone detections: ${results.confidenceAnalysis.uncertain.length}`);
  }

  // Critical failures
  const criticalFailures = [];

  // Check legacy tests (embarrassing to miss)
  if (results.legacy.failed > 0) {
    criticalFailures.push(`Failed ${results.legacy.failed} legacy tests (DAN, basic injections)`);
  }

  // Check false positives (breaking legitimate use)
  if (results.falsePositive.failed > 0) {
    criticalFailures.push(`Failed ${results.falsePositive.failed} false positive tests (blocked legitimate use)`);
  }

  if (criticalFailures.length > 0) {
    console.log('\n⚠️  CRITICAL ISSUES:');
    criticalFailures.forEach(issue => console.log(`  - ${issue}`));
  }

  // Overall pass/fail
  const totalTests = Object.values(results)
    .filter(r => r.passed !== undefined)
    .reduce((sum, r) => sum + r.passed + r.failed, 0);

  const totalPassed = Object.values(results)
    .filter(r => r.passed !== undefined)
    .reduce((sum, r) => sum + r.passed, 0);

  const overallPercentage = (totalPassed / totalTests * 100).toFixed(1);

  console.log('\n========================================');
  console.log(`OVERALL: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);

  if (overallPercentage >= 90) {
    console.log('✅ EXCELLENT - Ready for production');
  } else if (overallPercentage >= 70) {
    console.log('⚠️  GOOD - Some improvements needed');
  } else {
    console.log('❌ NEEDS WORK - Significant issues detected');
  }
  console.log('========================================');
}

// Run tests
runTests().catch(console.error);