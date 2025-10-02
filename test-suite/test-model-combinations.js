/**
 * Model Combination Comparison Test
 *
 * Tests all 4 combinations of Pass 1 and Pass 2 models:
 * 1. Llama 8B + Gemini 2.5 Flash (CURRENT PRODUCTION)
 * 2. Llama 8B + Llama 70B
 * 3. Gemini 2.0 + Gemini 2.5
 * 4. Gemini 2.0 + Llama 70B
 *
 * Measures: Accuracy, Speed, Cost
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODEL_COMBINATIONS = [
  {
    name: 'Llama 8B + Gemini 2.5 (CURRENT)',
    pass1: { name: 'meta-llama/llama-3.1-8b-instruct', cost: 0.02 },
    pass2: { name: 'google/gemini-2.5-flash-preview-09-2025', cost: 0.30 }
  },
  {
    name: 'Llama 8B + Llama 70B',
    pass1: { name: 'meta-llama/llama-3.1-8b-instruct', cost: 0.02 },
    pass2: { name: 'meta-llama/llama-3.1-70b-instruct', cost: 0.05 }
  },
  {
    name: 'Gemini 2.0 + Gemini 2.5',
    pass1: { name: 'google/gemini-2.0-flash-exp:free', cost: 0 },
    pass2: { name: 'google/gemini-2.5-flash-preview-09-2025', cost: 0.30 }
  },
  {
    name: 'Gemini 2.0 + Llama 70B',
    pass1: { name: 'google/gemini-2.0-flash-exp:free', cost: 0 },
    pass2: { name: 'meta-llama/llama-3.1-70b-instruct', cost: 0.05 }
  }
];

async function runTestWithConfiguration(combination) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${combination.name}`);
  console.log(`Pass 1: ${combination.pass1.name} ($${combination.pass1.cost}/M)`);
  console.log(`Pass 2: ${combination.pass2.name} ($${combination.pass2.cost}/M)`);
  console.log(`${'='.repeat(70)}\n`);

  // Modify ai-validator-hardened.js to use this combination
  const validatorPath = join(__dirname, '../api/lib/ai-validator-hardened.js');
  const originalContent = await fs.readFile(validatorPath, 'utf-8');

  // Create modified content with new model configuration
  const modifiedContent = originalContent.replace(
    /const MODELS = \{[\s\S]*?\};/,
    `const MODELS = {
  pass1: [
    {
      name: '${combination.pass1.name}',
      costPerMillion: ${combination.pass1.cost},
      priority: 1
    }
  ],
  pass2: [
    {
      name: '${combination.pass2.name}',
      costPerMillion: ${combination.pass2.cost},
      priority: 1
    }
  ]
};`
  );

  // Write modified configuration
  await fs.writeFile(validatorPath, modifiedContent, 'utf-8');

  try {
    // Import fresh version
    const validatorModule = await import(`${validatorPath}?${Date.now()}`);

    // Run the comprehensive test suite
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const testStart = Date.now();
    const { stdout, stderr } = await execAsync('node run-realistic-tests.js', {
      cwd: __dirname,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    const testDuration = Date.now() - testStart;

    // Parse results from test output
    const output = stdout + stderr;

    // Extract metrics using CORRECT regex patterns
    const passedMatch = output.match(/Passed:\s+(\d+)\s+\(([\d.]+)%\)/);
    const totalMatch = output.match(/Total Tests:\s+(\d+)/);
    const totalCostMatch = output.match(/Total cost:\s+\$([\d.]+)/);
    const avgCostMatch = output.match(/Average cost per test:\s+\$([\d.]+)/);

    return {
      combination: combination.name,
      pass1Model: combination.pass1.name,
      pass2Model: combination.pass2.name,
      accuracy: passedMatch ? parseFloat(passedMatch[2]) : null,
      passed: passedMatch ? parseInt(passedMatch[1]) : null,
      total: totalMatch ? parseInt(totalMatch[1]) : null,
      avgResponseTime: testDuration, // Use actual test duration as proxy for speed
      totalCost: totalCostMatch ? parseFloat(totalCostMatch[1]) : null,
      avgCostPerTest: avgCostMatch ? parseFloat(avgCostMatch[1]) : null,
      testDuration: testDuration,
      pass1Cost: combination.pass1.cost,
      pass2Cost: combination.pass2.cost,
      rawOutput: output
    };

  } finally {
    // Restore original configuration
    await fs.writeFile(validatorPath, originalContent, 'utf-8');
  }
}

async function main() {
  console.log('🧪 SafePrompt Model Combination Comparison Test\n');
  console.log('Testing all 4 combinations of Pass 1 and Pass 2 models');
  console.log('This will take approximately 15-20 minutes...\n');

  const results = [];

  for (const combination of MODEL_COMBINATIONS) {
    try {
      const result = await runTestWithConfiguration(combination);
      results.push(result);

      console.log('\n📊 Results Summary:');
      console.log(`   Accuracy: ${result.accuracy}% (${result.passed}/${result.total} tests)`);
      console.log(`   Test Duration: ${(result.testDuration / 1000).toFixed(1)}s`);
      console.log(`   Total Cost: $${result.totalCost ? result.totalCost.toFixed(6) : 'N/A'}`);
      console.log(`   Avg Cost/Test: $${result.avgCostPerTest ? result.avgCostPerTest.toFixed(6) : 'N/A'}`);

    } catch (error) {
      console.error(`\n❌ Error testing ${combination.name}:`, error.message);
      results.push({
        combination: combination.name,
        error: error.message
      });
    }

    // Wait 30 seconds between tests to avoid rate limiting
    if (MODEL_COMBINATIONS.indexOf(combination) < MODEL_COMBINATIONS.length - 1) {
      console.log('\n⏳ Waiting 30 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  // Print comparison table
  console.log('\n\n' + '='.repeat(100));
  console.log('FINAL COMPARISON RESULTS');
  console.log('='.repeat(100) + '\n');

  console.log('| Configuration | Accuracy | Test Duration | Total Cost | Avg Cost/Test | Pass1 | Pass2 |');
  console.log('|---------------|----------|---------------|------------|---------------|-------|-------|');

  results.forEach(r => {
    if (!r.error && r.accuracy !== null) {
      const durationSec = (r.testDuration / 1000).toFixed(0);
      const durationRating = r.testDuration < 180000 ? '⚡ Fast' :
                            r.testDuration < 240000 ? '🔄 Medium' : '🐌 Slow';
      const costRating = r.totalCost < 0.005 ? '💰 Cheap' :
                        r.totalCost < 0.015 ? '💵 Medium' : '💸 Expensive';

      console.log(`| ${r.combination.padEnd(30)} | ${r.accuracy.toFixed(1)}%   | ${durationRating} ${durationSec}s | ${costRating} $${r.totalCost.toFixed(5)} | $${r.avgCostPerTest.toFixed(6)} | $${r.pass1Cost}/M | $${r.pass2Cost}/M |`);
    } else {
      console.log(`| ${r.combination.padEnd(30)} | ERROR    | -             | -          | -             | -     | -     |`);
    }
  });

  console.log('\n');

  // Recommendation
  console.log('💡 RECOMMENDATIONS:\n');

  const sorted = results.filter(r => !r.error).sort((a, b) => b.accuracy - a.accuracy);
  if (sorted.length > 0) {
    console.log(`🏆 Best Accuracy: ${sorted[0].combination} (${sorted[0].accuracy}%)`);
  }

  const sortedSpeed = results.filter(r => !r.error && r.testDuration).sort((a, b) => a.testDuration - b.testDuration);
  if (sortedSpeed.length > 0) {
    console.log(`⚡ Fastest: ${sortedSpeed[0].combination} (${(sortedSpeed[0].testDuration / 1000).toFixed(0)}s)`);
  }

  const sortedCost = results.filter(r => !r.error && r.totalCost).sort((a, b) => a.totalCost - b.totalCost);
  if (sortedCost.length > 0) {
    console.log(`💰 Cheapest: ${sortedCost[0].combination} ($${sortedCost[0].totalCost.toFixed(6)})`);
  }

  // Save detailed results
  const resultPath = join(__dirname, 'model-combination-results.json');
  await fs.writeFile(resultPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n📄 Detailed results saved to: ${resultPath}\n`);
}

main().catch(console.error);
