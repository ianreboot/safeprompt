/**
 * SafePrompt Smoke Test Suite Runner
 *
 * Runs 5 critical tests covering all validation stages
 * Used for: Pre-production deployment validation
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateHardened } from '../api/lib/ai-validator-hardened.js';
import { getSmokeTests, getSmokeTestStats, EXPECTED_STAGES } from './smoke-test-suite.js';
import fs from 'fs';

// Load environment variables from /home/projects/.env (optional, falls back to process.env)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Running in CI/CD where env vars are set directly
  dotenv.config(); // Load from .env if it exists in current dir
}

/**
 * Test a single prompt
 */
async function testPrompt(test) {
  const startTime = Date.now();

  try {
    const result = await validateHardened(test.text);
    const latency = Date.now() - startTime;

    // Determine if test passed
    const passed = result.safe === test.expected;

    // Check if stage matches expected (optional validation)
    const expectedStage = EXPECTED_STAGES[test.id];
    const stageMatch = expectedStage ? result.stage === expectedStage : null;

    return {
      id: test.id,
      text: test.text.substring(0, 80),
      fullText: test.text,
      category: test.category,
      categoryGroup: test.categoryGroup,
      subcategory: test.subcategory,
      expected: test.expected,
      got: result.safe,
      passed,
      confidence: result.confidence,
      externalReferences: result.externalReferences,
      stage: result.stage,
      expectedStage,
      stageMatch,
      latency,
      cost: result.cost || 0,
      testReasoning: test.reasoning,
      validates: test.validates
    };

  } catch (error) {
    return {
      id: test.id,
      text: test.text.substring(0, 80),
      fullText: test.text,
      category: test.category,
      expected: test.expected,
      got: null,
      passed: false,
      error: error.message,
      latency: Date.now() - startTime
    };
  }
}

/**
 * Run all smoke tests
 */
async function runSmokeTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  SafePrompt Smoke Test Suite                              ║');
  console.log('║  Pre-Production Deployment Validation                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const stats = getSmokeTestStats();
  console.log('📊 Smoke Test Statistics:');
  console.log(`   Total Tests: ${stats.total}`);
  console.log(`   Safe (expected true): ${stats.safe}`);
  console.log(`   Unsafe (expected false): ${stats.unsafe}`);
  console.log(`   Coverage: All 3 validation stages\n`);
  console.log('═'.repeat(60) + '\n');

  const tests = getSmokeTests();
  const results = [];
  let totalLatency = 0;
  let totalCost = 0;

  // Run tests sequentially for clear output
  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.categoryGroup} (#${test.id})`);
    console.log('─'.repeat(60));
    console.log(`   Prompt: ${test.text.substring(0, 60)}...`);
    console.log(`   Expected: ${test.expected ? 'SAFE' : 'UNSAFE'}`);
    console.log(`   Validates: ${test.validates}`);

    const result = await testPrompt(test);
    results.push(result);
    totalLatency += result.latency;
    totalCost += result.cost || 0;

    if (result.error) {
      console.log(`   ❌ ERROR: ${result.error}`);
    } else {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} Result: ${result.got ? 'SAFE' : 'UNSAFE'} (${result.stage}, ${result.latency}ms)`);

      if (result.expectedStage) {
        const stageStatus = result.stageMatch ? '✅' : '⚠️';
        console.log(`   ${stageStatus} Stage: expected ${result.expectedStage}, got ${result.stage}`);
      }

      if (!result.passed) {
        console.log(`   ⚠️ MISMATCH: Expected ${result.expected ? 'SAFE' : 'UNSAFE'}, got ${result.got ? 'SAFE' : 'UNSAFE'}`);
      }
    }
  }

  // Summary
  console.log('\n\n' + '═'.repeat(60));
  console.log('📊 SMOKE TEST RESULTS');
  console.log('═'.repeat(60) + '\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const errors = results.filter(r => r.error).length;
  const accuracy = (passed / results.length * 100).toFixed(1);

  console.log(`Total Tests:     ${results.length}`);
  console.log(`Passed:          ${passed} ✅`);
  console.log(`Failed:          ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Errors:          ${errors} ${errors > 0 ? '❌' : ''}`);
  console.log(`Accuracy:        ${accuracy}%`);
  console.log(`Total Time:      ${totalLatency}ms`);
  console.log(`Estimated Cost:  $${totalCost.toFixed(4)}`);

  // Stage coverage verification
  console.log('\n📈 Stage Coverage:');
  const stagesCovered = new Set(results.map(r => r.stage).filter(Boolean));
  console.log(`   Pattern Stage:  ${stagesCovered.has('pattern') ? '✅' : '❌'}`);
  console.log(`   AI Pass 1:      ${stagesCovered.has('ai_pass1') ? '✅' : '❌'}`);
  console.log(`   AI Pass 2:      ${stagesCovered.has('ai_pass2') ? '✅' : '❌'}`);

  // Stage match validation
  const stageMatches = results.filter(r => r.stageMatch === true).length;
  const stageMismatches = results.filter(r => r.stageMatch === false).length;
  if (stageMismatches > 0) {
    console.log(`\n⚠️  Stage Mismatches: ${stageMismatches} tests didn't reach expected stage`);
  }

  // Detailed failures
  if (failed > 0 || errors > 0) {
    console.log('\n\n' + '═'.repeat(60));
    console.log('❌ FAILED TESTS');
    console.log('═'.repeat(60) + '\n');

    results.filter(r => !r.passed).forEach(r => {
      console.log(`[${r.id}] ${r.category}`);
      console.log(`   Prompt: ${r.fullText.substring(0, 100)}`);
      console.log(`   Expected: ${r.expected ? 'SAFE' : 'UNSAFE'}`);
      console.log(`   Got: ${r.got !== null ? (r.got ? 'SAFE' : 'UNSAFE') : 'ERROR'}`);
      if (r.error) {
        console.log(`   Error: ${r.error}`);
      }
      console.log();
    });
  }

  console.log('\n' + '═'.repeat(60));

  // Exit with appropriate code
  if (failed > 0 || errors > 0) {
    console.log('\n❌ SMOKE TESTS FAILED - DO NOT DEPLOY TO PRODUCTION');
    console.log('═'.repeat(60) + '\n');
    process.exit(1);
  } else {
    console.log('\n✅ ALL SMOKE TESTS PASSED - SAFE TO DEPLOY');
    console.log('═'.repeat(60) + '\n');
    process.exit(0);
  }
}

// Run tests
runSmokeTests().catch(error => {
  console.error('\n\n❌ SMOKE TEST SUITE CRASHED:', error);
  console.error(error.stack);
  process.exit(1);
});
