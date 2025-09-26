/**
 * Test the Multi-Model 2-Pass Validation System
 * Testing different model combinations for cost optimization
 */

import fs from 'fs';
import { validate2PassMulti, getUsageStats } from '/home/projects/safeprompt/api/lib/ai-validator-2pass-multi.js';

// Test configuration
const CONFIG = {
  verbose: true,
  aiDelay: 1500,  // Delay between AI calls to avoid rate limiting
  showDetails: true,
  testSubset: false,  // Set to true to test only a few prompts for quick validation
  subsetSize: 1,      // Number of tests per category when using subset
  preFilterThreshold: {
    high: 0.8,
    low: 0.8
  }
};

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  system: "2-PASS MULTI-MODEL - All Free Models Strategy",
  models: {
    pass1: ["deepseek/deepseek-chat-v3.1:free", "google/gemini-2.0-flash-exp:free"],
    pass2: ["google/gemini-2.0-flash-exp:free", "deepseek/deepseek-r1:free", "deepseek/deepseek-chat-v3.1:free"]
  },

  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    accuracy: 0,
    avgCost: 0,
    totalCost: 0
  },

  byCategory: {},

  byPasses: {
    onePass: { count: 0, avgTime: 0, times: [] },
    twoPasses: { count: 0, avgTime: 0, times: [] }
  },

  modelUsage: {
    pass1: {},
    pass2: {}
  },

  performance: {
    allTimes: [],
    fastOnlyTimes: [],
    fullValidationTimes: []
  },

  failures: [],
  improvements: [],
  modelFailures: []  // Track which models failed during fallback
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
    const validationResult = await validate2PassMulti(test.text, {
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
      passes: validationResult.passes,
      modelUsed: validationResult.modelUsed,
      totalCost: validationResult.totalCost
    };

    // Track model usage
    if (validationResult.passes) {
      validationResult.passes.forEach(pass => {
        const passKey = `pass${pass.pass}`;
        const model = pass.model;

        if (!results.modelUsage[passKey][model]) {
          results.modelUsage[passKey][model] = {
            count: 0,
            totalCost: 0,
            avgTime: 0,
            times: []
          };
        }

        results.modelUsage[passKey][model].count++;
        results.modelUsage[passKey][model].totalCost += pass.cost || 0;
        results.modelUsage[passKey][model].times.push(pass.time);

        // Track fallback attempts
        if (pass.attemptedModels && pass.attemptedModels.length > 1) {
          const failedModels = pass.attemptedModels.slice(0, -1);
          results.modelFailures.push({
            category,
            pass: pass.pass,
            failedModels,
            successModel: model,
            text: test.text.substring(0, 50) + '...'
          });
        }
      });
    }

    // Track performance
    results.performance.allTimes.push(totalTime);
    results.summary.totalCost += validationResult.totalCost || 0;

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
        modelUsed: validationResult.modelUsed,
        reasoning: test.reasoning
      });
    }

    // Track improvements over previous versions
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
        fixedFrom: baselineFailure && twoPassFailure ? 'both' : (baselineFailure ? 'baseline' : '2-pass'),
        passesUsed: validationResult.passesExecuted
      });
    }

  } catch (error) {
    result.error = error.message;
    result.passed = false;

    results.failures.push({
      category: category,
      text: test.text.substring(0, 60) + '...',
      error: error.message
    });
  }

  return result;
}

async function runMultiModelTest() {
  console.log('========================================');
  console.log('2-PASS MULTI-MODEL VALIDATION TEST');
  console.log('Architecture (Using OpenRouter Credits):');
  console.log('- Pass 1: Llama 3.1 8B → Gemini 2.0 Free (fallback)');
  console.log('- Pass 2: Llama 3.1 70B → Gemini 2.0 Free (fallback)');
  console.log('- Testing with your OpenRouter credits');
  console.log('========================================\n');

  // Load test suite
  const testSuite = JSON.parse(
    fs.readFileSync('/home/projects/safeprompt/test-suite/real-tests.json', 'utf8')
  );

  console.log('Comparison targets:');
  console.log('- 2-Pass GPT+Gemini: 90.9% accuracy @ $1.60/1K requests');
  console.log('- Goal: >85% accuracy @ <$0.10/1K requests\n');

  if (CONFIG.testSubset) {
    console.log(`⚠️  SUBSET MODE: Testing only ${CONFIG.subsetSize} prompts per category\n`);
  }

  // Test each category
  for (const [category, tests] of Object.entries(testSuite.tests)) {
    const testsToRun = CONFIG.testSubset ? tests.slice(0, CONFIG.subsetSize) : tests;

    console.log(`\nTesting ${category}: ${testsToRun.length} tests`);
    console.log('Progress: ', { end: '' });

    results.byCategory[category] = {
      total: testsToRun.length,
      passed: 0,
      failed: 0,
      accuracy: 0,
      onePassCount: 0,
      twoPassCount: 0,
      avgCost: 0
    };

    for (const test of testsToRun) {
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

    console.log(`\n${category}: ${results.byCategory[category].passed}/${results.byCategory[category].total} passed (${results.byCategory[category].accuracy}%)`)
    console.log(`  → ${results.byCategory[category].onePassCount} resolved in 1 pass, ${results.byCategory[category].twoPassCount} needed 2 passes`);
  }

  // Calculate overall accuracy
  results.summary.accuracy = (results.summary.passed / results.summary.total * 100).toFixed(1);
  results.summary.avgCost = results.summary.total > 0 ? results.summary.totalCost / results.summary.total : 0;

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

  // Get usage stats from the library
  const usageStats = getUsageStats();

  // Print report
  console.log('\n========================================');
  console.log('MULTI-MODEL TEST RESULTS SUMMARY');
  console.log('========================================\n');

  console.log('Overall Performance:');
  console.log(`  Total Tests: ${results.summary.total}`);
  console.log(`  Passed: ${results.summary.passed}`);
  console.log(`  Failed: ${results.summary.failed}`);
  console.log(`  Accuracy: ${results.summary.accuracy}%\n`);

  console.log('Cost Analysis:');
  console.log(`  Total Cost: $${results.summary.totalCost.toFixed(6)}`);
  console.log(`  Avg Cost per Request: $${results.summary.avgCost.toFixed(6)}`);
  console.log(`  Cost per 1,000 Requests: $${(results.summary.avgCost * 1000).toFixed(4)}`);
  console.log(`  Cost per 100,000 Requests: $${(results.summary.avgCost * 100000).toFixed(2)}\n`);

  console.log('Model Usage Distribution:');
  console.log('\nPass 1 (Pre-filter):');
  for (const [model, stats] of Object.entries(results.modelUsage.pass1)) {
    const avgTime = stats.times.reduce((a, b) => a + b, 0) / stats.times.length;
    console.log(`  ${model}: ${stats.count} uses, $${stats.totalCost.toFixed(6)} total, ${avgTime.toFixed(0)}ms avg`);
  }
  console.log('\nPass 2 (Full validation):');
  for (const [model, stats] of Object.entries(results.modelUsage.pass2)) {
    if (stats.count > 0) {
      const avgTime = stats.times.reduce((a, b) => a + b, 0) / stats.times.length;
      console.log(`  ${model}: ${stats.count} uses, $${stats.totalCost.toFixed(6)} total, ${avgTime.toFixed(0)}ms avg`);
    }
  }

  console.log('\nPerformance by Category:');
  for (const [category, stats] of Object.entries(results.byCategory)) {
    const baselineAcc = baseline?.byCategory[category]?.accuracy || 'N/A';
    const v2Acc = v2Results?.byCategory[category]?.accuracy || 'N/A';
    const twoPassAcc = twoPassResults?.byCategory[category]?.accuracy || 'N/A';

    console.log(`  ${category}: ${stats.accuracy}% (baseline: ${baselineAcc}%, V2: ${v2Acc}%, 2-pass GPT: ${twoPassAcc}%)`);
  }

  console.log('\nPass Distribution:');
  console.log(`  Single Pass: ${results.byPasses.onePass.count} tests (${(results.byPasses.onePass.count / results.summary.total * 100).toFixed(1)}%)`);
  console.log(`  Two Passes: ${results.byPasses.twoPasses.count} tests (${(results.byPasses.twoPasses.count / results.summary.total * 100).toFixed(1)}%)`);

  console.log('\nTiming Performance:');
  console.log(`  Avg Single Pass: ${avgOnePass.toFixed(2)}ms`);
  console.log(`  Avg Two Passes: ${avgTwoPass.toFixed(2)}ms`);
  console.log(`  Overall Average: ${avgOverall.toFixed(2)}ms`);

  // Model Fallback Analysis
  if (results.modelFailures.length > 0) {
    console.log('\n⚠️  Model Fallback Events:');
    const fallbackSummary = {};
    results.modelFailures.forEach(failure => {
      failure.failedModels.forEach(model => {
        if (!fallbackSummary[model]) {
          fallbackSummary[model] = 0;
        }
        fallbackSummary[model]++;
      });
    });

    for (const [model, count] of Object.entries(fallbackSummary)) {
      console.log(`  ${model}: Failed ${count} times (fallback triggered)`);
    }
  }

  // Compare with GPT version
  const gptCostPer1K = 1.60;
  const gptAccuracy = 90.9;
  const ourCostPer1K = results.summary.avgCost * 1000;
  const costSavings = ((gptCostPer1K - ourCostPer1K) / gptCostPer1K * 100).toFixed(1);
  const accuracyDiff = parseFloat(results.summary.accuracy) - gptAccuracy;

  console.log('\n========================================');
  console.log('COMPARISON WITH 2-PASS GPT+GEMINI');
  console.log('========================================\n');

  console.log(`| Metric | GPT+Gemini | Multi-Model | Difference |`);
  console.log(`|--------|------------|-------------|------------|`);
  console.log(`| Accuracy | ${gptAccuracy}% | ${results.summary.accuracy}% | ${accuracyDiff > 0 ? '+' : ''}${accuracyDiff.toFixed(1)}% |`);
  console.log(`| Cost/1K | $${gptCostPer1K} | $${ourCostPer1K.toFixed(4)} | -${costSavings}% |`);
  console.log(`| Latency | 846ms | ${avgOverall.toFixed(0)}ms | ${avgOverall > 846 ? '+' : ''}${(avgOverall - 846).toFixed(0)}ms |`);

  // Save results
  fs.writeFileSync(
    '/home/projects/safeprompt/test-suite/2pass-multi-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n========================================');
  console.log('VERDICT');
  console.log('========================================\n');

  const costPer100K = results.summary.avgCost * 100000;

  if (costPer100K <= 5 && parseFloat(results.summary.accuracy) >= 85) {
    console.log('🚀 EXCELLENT - Meets cost target ($5/100K) with good accuracy!');
  } else if (costPer100K <= 5 && parseFloat(results.summary.accuracy) >= 80) {
    console.log('✅ GOOD - Meets cost target with acceptable accuracy');
  } else if (costPer100K > 5) {
    console.log(`❌ TOO EXPENSIVE - $${costPer100K.toFixed(2)}/100K exceeds $5 budget`);
  } else {
    console.log(`⚠️  LOW ACCURACY - ${results.summary.accuracy}% is below 80% threshold`);
  }

  console.log(`\nBudget Analysis:`);
  console.log(`  Target: $5 per 100K validations`);
  console.log(`  Actual: $${costPer100K.toFixed(2)} per 100K validations`);
  console.log(`  Margin: ${costPer100K <= 5 ? 'Within budget ✓' : `Over budget by $${(costPer100K - 5).toFixed(2)}`}`);

  console.log(`\nResults saved to: 2pass-multi-results.json`);
}

// Run test
runMultiModelTest().catch(console.error);