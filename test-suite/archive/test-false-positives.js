/**
 * Test SafePrompt with large datasets for false positive/negative rates
 * Tests both regex-only and AI-enhanced validation
 */

import fs from 'fs';
import { validatePrompt } from '/home/projects/safeprompt/api/lib/prompt-validator.js';
import { validateWithAI } from '/home/projects/safeprompt/api/lib/ai-validator.js';

// Load test datasets
const datasets = JSON.parse(
  fs.readFileSync('/home/projects/safeprompt/test-suite/test-datasets.json', 'utf8')
);

// Test configuration
const TEST_CONFIG = {
  maxSamples: 10,   // Reduced to avoid rate limits on FREE model
  useAI: true,      // Enable AI validation
  aiModel: 'google/gemini-2.0-flash-exp:free',
  timeout: 10000,
  batchSize: 5,    // Smaller batches for FREE model
  delayBetween: 2000 // 2 second delay between requests
};

// Test with regex only
async function testRegexValidation(prompts, expectedLabel) {
  console.log(`\nTesting ${prompts.length} ${expectedLabel} prompts with REGEX...`);

  const results = {
    correct: 0,
    incorrect: 0,
    errors: 0,
    falsePositives: [],
    falseNegatives: [],
    times: [],
    confidences: []
  };

  for (let i = 0; i < Math.min(prompts.length, TEST_CONFIG.maxSamples); i++) {
    const prompt = prompts[i];

    try {
      const start = Date.now();
      const result = validatePrompt(prompt.text);
      const elapsed = Date.now() - start;

      results.times.push(elapsed);
      results.confidences.push(result.confidence);

      const expected = expectedLabel === 'safe';
      const correct = result.safe === expected;

      if (correct) {
        results.correct++;
      } else {
        results.incorrect++;

        if (expected && !result.safe) {
          // False positive: marked unsafe but should be safe
          results.falsePositives.push({
            text: prompt.text.substring(0, 100),
            category: prompt.category,
            confidence: result.confidence
          });
        } else if (!expected && result.safe) {
          // False negative: marked safe but should be unsafe
          results.falseNegatives.push({
            text: prompt.text.substring(0, 100),
            category: prompt.category,
            confidence: result.confidence
          });
        }
      }

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`  Processed ${i + 1}/${Math.min(prompts.length, TEST_CONFIG.maxSamples)}\r`);
      }
    } catch (error) {
      results.errors++;
      console.error(`  Error: ${error.message}`);
    }
  }

  console.log('');
  return results;
}

// Test with AI validation
async function testAIValidation(prompts, expectedLabel) {
  console.log(`\nTesting ${Math.min(prompts.length, TEST_CONFIG.maxSamples)} ${expectedLabel} prompts with AI...`);

  const results = {
    correct: 0,
    incorrect: 0,
    errors: 0,
    falsePositives: [],
    falseNegatives: [],
    times: [],
    confidences: [],
    costs: []
  };

  // Process in batches to avoid rate limits
  for (let batch = 0; batch < TEST_CONFIG.maxSamples; batch += TEST_CONFIG.batchSize) {
    const batchPrompts = prompts.slice(batch, batch + TEST_CONFIG.batchSize);

    for (const prompt of batchPrompts) {
      try {
        const start = Date.now();
        const result = await validateWithAI(prompt.text, {
          model: TEST_CONFIG.aiModel,
          timeout: TEST_CONFIG.timeout
        });
        const elapsed = Date.now() - start;

        results.times.push(elapsed);
        results.confidences.push(result.confidence);
        results.costs.push(result.cost || 0);

        const expected = expectedLabel === 'safe';
        const correct = result.safe === expected;

        if (correct) {
          results.correct++;
        } else {
          results.incorrect++;

          if (expected && !result.safe) {
            // False positive
            results.falsePositives.push({
              text: prompt.text.substring(0, 100),
              category: prompt.category,
              confidence: result.confidence,
              reasoning: result.reasoning
            });
          } else if (!expected && result.safe) {
            // False negative
            results.falseNegatives.push({
              text: prompt.text.substring(0, 100),
              category: prompt.category,
              confidence: result.confidence,
              reasoning: result.reasoning
            });
          }
        }

        // Progress indicator
        const processed = batch + batchPrompts.indexOf(prompt) + 1;
        process.stdout.write(`  Processed ${processed}/${TEST_CONFIG.maxSamples}\r`);
      } catch (error) {
        results.errors++;
        console.error(`  Error: ${error.message}`);
      }

      // Delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delayBetween));
    }

    // Batch processing is complete
  }

  console.log('');
  return results;
}

// Calculate and display statistics
function displayStatistics(results, label, method) {
  const total = results.correct + results.incorrect;
  const accuracy = (results.correct / total * 100).toFixed(2);
  const fpRate = (results.falsePositives.length / total * 100).toFixed(2);
  const fnRate = (results.falseNegatives.length / total * 100).toFixed(2);

  // Calculate timing statistics
  const times = results.times.sort((a, b) => a - b);
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)] || p95;

  console.log(`\n📊 ${method} Results for ${label} Prompts:`);
  console.log(`  Total Tested: ${total}`);
  console.log(`  Correct: ${results.correct} (${accuracy}%)`);
  console.log(`  False Positives: ${results.falsePositives.length} (${fpRate}%)`);
  console.log(`  False Negatives: ${results.falseNegatives.length} (${fnRate}%)`);
  console.log(`  Errors: ${results.errors}`);

  console.log(`\n  ⏱️ Response Times:`);
  console.log(`    Average: ${avgTime.toFixed(0)}ms`);
  console.log(`    P50: ${p50}ms`);
  console.log(`    P95: ${p95}ms`);
  console.log(`    P99: ${p99}ms`);

  // Show confidence distribution
  const avgConfidence = results.confidences.reduce((a, b) => a + b, 0) / results.confidences.length;
  console.log(`\n  📈 Confidence:`);
  console.log(`    Average: ${avgConfidence.toFixed(3)}`);

  // Cost for AI
  if (results.costs) {
    const totalCost = results.costs.reduce((a, b) => a + b, 0);
    console.log(`\n  💰 Cost: $${totalCost.toFixed(6)} (${(totalCost/total*1000).toFixed(4)}/1000 requests)`);
  }

  // Show examples of errors
  if (results.falsePositives.length > 0) {
    console.log(`\n  ❌ Sample False Positives (legitimate marked as unsafe):`);
    results.falsePositives.slice(0, 3).forEach(fp => {
      console.log(`    - "${fp.text}..." [${fp.category}]`);
    });
  }

  if (results.falseNegatives.length > 0) {
    console.log(`\n  ⚠️  Sample False Negatives (malicious marked as safe):`);
    results.falseNegatives.slice(0, 3).forEach(fn => {
      console.log(`    - "${fn.text}..." [${fn.category}]`);
    });
  }

  return {
    accuracy: parseFloat(accuracy),
    fpRate: parseFloat(fpRate),
    fnRate: parseFloat(fnRate),
    avgTime,
    p95
  };
}

// Main test function
async function runFalsePositiveTests() {
  console.log('🔬 SafePrompt False Positive/Negative Testing');
  console.log('=' .repeat(60));
  console.log(`Testing with ${TEST_CONFIG.maxSamples} samples per category`);
  console.log(`AI Model: ${TEST_CONFIG.aiModel}`);
  console.log('=' .repeat(60));

  const results = {
    regex: {},
    ai: {}
  };

  // Test REGEX validation
  console.log('\n📝 PHASE 1: REGEX-ONLY VALIDATION');
  console.log('-'.repeat(40));

  results.regex.legitimate = await testRegexValidation(
    datasets.legitimate, 'safe'
  );
  const regexLegitStats = displayStatistics(
    results.regex.legitimate, 'LEGITIMATE', 'REGEX'
  );

  results.regex.malicious = await testRegexValidation(
    datasets.malicious, 'unsafe'
  );
  const regexMaliciousStats = displayStatistics(
    results.regex.malicious, 'MALICIOUS', 'REGEX'
  );

  // Test AI validation if enabled
  if (TEST_CONFIG.useAI) {
    console.log('\n\n🤖 PHASE 2: AI-ENHANCED VALIDATION');
    console.log('-'.repeat(40));

    results.ai.legitimate = await testAIValidation(
      datasets.legitimate, 'safe'
    );
    const aiLegitStats = displayStatistics(
      results.ai.legitimate, 'LEGITIMATE', 'AI'
    );

    results.ai.malicious = await testAIValidation(
      datasets.malicious, 'unsafe'
    );
    const aiMaliciousStats = displayStatistics(
      results.ai.malicious, 'MALICIOUS', 'AI'
    );

    // Compare results
    console.log('\n\n📊 COMPARISON: REGEX vs AI');
    console.log('=' .repeat(60));
    console.log('                    | REGEX     | AI        | Improvement');
    console.log('-'.repeat(60));
    console.log(`Legit Accuracy      | ${regexLegitStats.accuracy.toFixed(1)}%    | ${aiLegitStats.accuracy.toFixed(1)}%    | ${(aiLegitStats.accuracy - regexLegitStats.accuracy).toFixed(1)}%`);
    console.log(`Malicious Accuracy  | ${regexMaliciousStats.accuracy.toFixed(1)}%    | ${aiMaliciousStats.accuracy.toFixed(1)}%    | ${(aiMaliciousStats.accuracy - regexMaliciousStats.accuracy).toFixed(1)}%`);
    console.log(`False Positive Rate | ${regexLegitStats.fpRate.toFixed(1)}%     | ${aiLegitStats.fpRate.toFixed(1)}%      | ${(regexLegitStats.fpRate - aiLegitStats.fpRate).toFixed(1)}%`);
    console.log(`False Negative Rate | ${regexMaliciousStats.fnRate.toFixed(1)}%     | ${aiMaliciousStats.fnRate.toFixed(1)}%      | ${(regexMaliciousStats.fnRate - aiMaliciousStats.fnRate).toFixed(1)}%`);
    console.log(`Avg Response Time   | ${regexLegitStats.avgTime.toFixed(0)}ms      | ${aiLegitStats.avgTime.toFixed(0)}ms   | +${(aiLegitStats.avgTime - regexLegitStats.avgTime).toFixed(0)}ms`);
  }

  // Final assessment
  console.log('\n\n✅ FINAL ASSESSMENT');
  console.log('=' .repeat(60));

  const finalFPRate = TEST_CONFIG.useAI && results.ai.legitimate ?
    (results.ai.legitimate.falsePositives.length / (results.ai.legitimate.correct + results.ai.legitimate.incorrect) * 100) :
    regexLegitStats.fpRate;
  const finalFNRate = TEST_CONFIG.useAI && results.ai.malicious ?
    (results.ai.malicious.falseNegatives.length / (results.ai.malicious.correct + results.ai.malicious.incorrect) * 100) :
    regexMaliciousStats.fnRate;
  const finalP95 = TEST_CONFIG.useAI && results.ai.legitimate ?
    results.ai.legitimate.times.sort((a,b) => a-b)[Math.floor(results.ai.legitimate.times.length * 0.95)] :
    regexLegitStats.p95;

  const meetsTargets = finalFPRate <= 0.5 && finalFNRate <= 1.0 && finalP95 <= 2000;

  console.log(`False Positive Rate: ${finalFPRate}% (target: <0.5%)`);
  console.log(`False Negative Rate: ${finalFNRate}% (target: <1.0%)`);
  console.log(`P95 Response Time: ${finalP95}ms (target: <2000ms)`);
  console.log(`\nStatus: ${meetsTargets ? '🎉 MEETS ALL TARGETS' : '⚠️ NEEDS OPTIMIZATION'}`);

  if (!meetsTargets) {
    console.log('\nRecommendations:');
    if (finalFPRate > 0.5) {
      console.log('  - Tune confidence thresholds to reduce false positives');
    }
    if (finalFNRate > 1.0) {
      console.log('  - Add more malicious patterns to reduce false negatives');
    }
    if (finalP95 > 2000) {
      console.log('  - Optimize AI model or use caching to improve response time');
    }
  }

  // Save results
  const resultsPath = '/home/projects/user-input/claude-safeprompt/false-positive-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Results saved to ${resultsPath}`);
}

// Run tests
runFalsePositiveTests().catch(console.error);