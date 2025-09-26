/**
 * Test ONLY the legacy tests to verify everything is connected
 * These are basic attacks we MUST catch (DAN, ignore instructions, XSS, SQL)
 */

import fs from 'fs';
import { validatePrompt } from '/home/projects/safeprompt/api/lib/prompt-validator.js';

// Test configuration
const CONFIG = {
  verbose: true,  // Show all details for debugging
};

async function runLegacyTests() {
  console.log('========================================');
  console.log('Testing Legacy Attacks (Basic Validation)');
  console.log('========================================\n');

  // Check if test file exists
  if (!fs.existsSync('/home/projects/safeprompt/test-suite/real-tests.json')) {
    console.log('Test file not found. Generating...');
    await import('./generate-real-tests.js');
  }

  // Load tests
  const testSuite = JSON.parse(
    fs.readFileSync('/home/projects/safeprompt/test-suite/real-tests.json', 'utf8')
  );

  const legacyTests = testSuite.tests.legacy;
  console.log(`Testing ${legacyTests.length} legacy attacks\n`);

  let passed = 0;
  let failed = 0;

  for (const test of legacyTests) {
    console.log('----------------------------------------');
    console.log(`Test: "${test.text.substring(0, 60)}..."`);
    console.log(`Category: ${test.category}`);
    console.log(`Expected: safe=${test.expected.safe}`);

    try {
      // Run regex validation
      const result = validatePrompt(test.text);

      console.log(`Result: safe=${result.safe}, confidence=${result.confidence.toFixed(3)}`);
      console.log(`Threats detected: ${result.threats.join(', ') || 'none'}`);

      // Check if it matches expectation
      if (result.safe === test.expected.safe) {
        console.log('✅ PASSED');
        passed++;
      } else {
        console.log('❌ FAILED - Classification mismatch');
        failed++;
      }

      // Check confidence if specified
      if (test.expected.minConfidence && result.confidence < test.expected.minConfidence) {
        console.log(`⚠️  WARNING - Low confidence: ${result.confidence} < ${test.expected.minConfidence}`);
      }

    } catch (error) {
      console.log('❌ ERROR:', error.message);
      failed++;
    }
  }

  console.log('\n========================================');
  console.log('LEGACY TEST RESULTS');
  console.log('========================================');
  console.log(`Passed: ${passed}/${legacyTests.length}`);
  console.log(`Failed: ${failed}/${legacyTests.length}`);

  if (failed === 0) {
    console.log('\n✅ All legacy tests passed! Connection verified.');
  } else {
    console.log('\n❌ Some legacy tests failed. Check the results above.');
  }
}

// Run the tests
runLegacyTests().catch(console.error);