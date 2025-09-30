/**
 * SafePrompt Realistic Test Suite Runner
 *
 * Executes the professional test suite and generates detailed reports
 */

import { validateHardened } from '../api/lib/ai-validator-hardened.js';
import { getAllTests, getTestStats, REALISTIC_TEST_SUITE } from './realistic-test-suite.js';
import fs from 'fs';

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
      referenceTypes: result.referenceTypes,
      reasoning: result.reasoning,
      stage: result.stage,
      latency,
      cost: result.cost || 0,
      testReasoning: test.reasoning
    };

  } catch (error) {
    return {
      id: test.id,
      text: test.text.substring(0, 80),
      fullText: test.text,
      category: test.category,
      categoryGroup: test.categoryGroup,
      expected: test.expected,
      error: error.message,
      passed: false
    };
  }
}

/**
 * Run all tests with detailed reporting
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  SafePrompt Realistic Test Suite - Phase 1                ║');
  console.log('║  Professional, Diverse, Real-World Test Coverage          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get test statistics
  const stats = getTestStats();
  console.log(`📊 Test Suite Statistics:`);
  console.log(`   Total Tests: ${stats.total}`);
  console.log(`   Safe (expected true): ${stats.byExpected.safe}`);
  console.log(`   Unsafe (expected false): ${stats.byExpected.unsafe}`);
  console.log(`\n   Tests by Category Group:`);
  for (const [group, count] of Object.entries(stats.byCategoryGroup)) {
    console.log(`   - ${group}: ${count} tests`);
  }
  console.log('\n' + '='.repeat(60) + '\n');

  const results = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 1',
    description: 'XSS, Business Context, False Positives',
    testStats: stats,
    categoryResults: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      byStage: {
        external_reference: 0,
        pattern: 0,
        pass1: 0,
        pass2: 0
      },
      byExpected: {
        safe: { total: 0, passed: 0, failed: 0 },
        unsafe: { total: 0, passed: 0, failed: 0 }
      }
    },
    allResults: []
  };

  // Group tests by category group
  const allTests = getAllTests();
  const testsByGroup = {};
  for (const test of allTests) {
    if (!testsByGroup[test.categoryGroup]) {
      testsByGroup[test.categoryGroup] = [];
    }
    testsByGroup[test.categoryGroup].push(test);
  }

  // Run tests by category group
  for (const [groupName, tests] of Object.entries(testsByGroup)) {
    console.log(`\n🔍 Testing: ${groupName} (${tests.length} tests)`);
    console.log('─'.repeat(60));

    results.categoryResults[groupName] = {
      total: tests.length,
      passed: 0,
      failed: 0,
      tests: []
    };

    for (const test of tests) {
      process.stdout.write(`  [${test.id}] ${test.category}: `);

      // Add delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1500));

      const result = await testPrompt(test);
      results.categoryResults[groupName].tests.push(result);
      results.allResults.push(result);

      if (result.passed) {
        results.categoryResults[groupName].passed++;
        results.summary.passed++;
        process.stdout.write('✅');
      } else {
        results.categoryResults[groupName].failed++;
        results.summary.failed++;
        process.stdout.write('❌');
      }

      // Track stage
      if (result.stage) {
        results.summary.byStage[result.stage] = (results.summary.byStage[result.stage] || 0) + 1;
      }

      // Track by expected value
      const expectedKey = test.expected ? 'safe' : 'unsafe';
      results.summary.byExpected[expectedKey].total++;
      if (result.passed) {
        results.summary.byExpected[expectedKey].passed++;
      } else {
        results.summary.byExpected[expectedKey].failed++;
      }

      results.summary.total++;

      console.log(` (${result.stage || 'unknown'}, ${result.latency}ms)`);
    }

    // Category summary
    const cat = results.categoryResults[groupName];
    const accuracy = cat.total > 0 ? (cat.passed/cat.total*100).toFixed(1) : 0;
    console.log(`\n   ✓ ${groupName}: ${accuracy}% accuracy (${cat.passed}/${cat.total} passed)`);
  }

  // Overall summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 OVERALL RESULTS');
  console.log('='.repeat(60) + '\n');

  const overallAccuracy = (results.summary.passed / results.summary.total * 100).toFixed(1);
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed} (${overallAccuracy}%)`);
  console.log(`Failed: ${results.summary.failed}\n`);

  // Accuracy by expected value
  console.log('Accuracy by Type:');
  const safeAccuracy = (results.summary.byExpected.safe.passed / results.summary.byExpected.safe.total * 100).toFixed(1);
  const unsafeAccuracy = (results.summary.byExpected.unsafe.passed / results.summary.byExpected.unsafe.total * 100).toFixed(1);
  console.log(`  Safe prompts (should pass): ${safeAccuracy}% (${results.summary.byExpected.safe.passed}/${results.summary.byExpected.safe.total})`);
  console.log(`  Unsafe prompts (should block): ${unsafeAccuracy}% (${results.summary.byExpected.unsafe.passed}/${results.summary.byExpected.unsafe.total})\n`);

  // Stage distribution
  console.log('Tests by Stage:');
  for (const [stage, count] of Object.entries(results.summary.byStage)) {
    const percent = (count / results.summary.total * 100).toFixed(1);
    console.log(`  ${stage}: ${count} (${percent}%)`);
  }

  // Cost analysis
  let totalCost = 0;
  let zeroCostTests = 0;
  for (const result of results.allResults) {
    totalCost += result.cost || 0;
    if (!result.cost || result.cost === 0) {
      zeroCostTests++;
    }
  }

  console.log('\n💰 Cost Analysis:');
  console.log(`  Total cost: $${totalCost.toFixed(6)}`);
  console.log(`  Zero-cost tests: ${zeroCostTests}/${results.summary.total} (${(zeroCostTests/results.summary.total*100).toFixed(1)}%)`);
  console.log(`  Average cost per test: $${(totalCost/results.summary.total).toFixed(6)}`);
  console.log(`  Projected cost per 100K: $${(totalCost/results.summary.total * 100000).toFixed(2)}`);

  // Category performance
  console.log('\n📊 Performance by Category:');
  for (const [name, cat] of Object.entries(results.categoryResults)) {
    const accuracy = cat.total > 0 ? (cat.passed/cat.total*100).toFixed(1) : 0;
    console.log(`  ${name}: ${accuracy}% (${cat.passed}/${cat.total})`);
  }

  // Save results
  const outputFile = '/home/projects/safeprompt/test-suite/realistic-test-results.json';
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputFile}`);

  // Show failures
  if (results.summary.failed > 0) {
    console.log('\n\n' + '='.repeat(60));
    console.log('❌ FAILED TESTS');
    console.log('='.repeat(60));

    for (const [categoryName, category] of Object.entries(results.categoryResults)) {
      const failures = category.tests.filter(t => !t.passed);
      if (failures.length > 0) {
        console.log(`\n${categoryName}:`);
        for (const fail of failures) {
          console.log(`\n  [${fail.id}] ${fail.category}`);
          console.log(`     Text: "${fail.fullText.substring(0, 100)}${fail.fullText.length > 100 ? '...' : ''}"`);
          console.log(`     Expected: ${fail.expected ? 'SAFE' : 'UNSAFE'}`);
          console.log(`     Got: ${fail.got ? 'SAFE' : 'UNSAFE'}`);
          console.log(`     Test Reasoning: ${fail.testReasoning}`);
          if (fail.reasoning) {
            console.log(`     Validator Reasoning: ${fail.reasoning}`);
          }
          if (fail.error) {
            console.log(`     Error: ${fail.error}`);
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test run complete!');
  console.log('='.repeat(60) + '\n');

  return results;
}

// Run the tests
runAllTests().catch(console.error);
