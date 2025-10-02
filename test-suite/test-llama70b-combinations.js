/**
 * Llama 70B Pass 1 Model Combination Tests
 * Testing Llama 70B paired with different Pass 2 models
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LLAMA70B_COMBINATIONS = [
  {
    name: 'Llama 70B + Llama 70B',
    pass1: { name: 'meta-llama/llama-3.1-70b-instruct', cost: 0.05 },
    pass2: { name: 'meta-llama/llama-3.1-70b-instruct', cost: 0.05 }
  },
  {
    name: 'Llama 70B + Gemini 2.0',
    pass1: { name: 'meta-llama/llama-3.1-70b-instruct', cost: 0.05 },
    pass2: { name: 'google/gemini-2.0-flash-exp:free', cost: 0 }
  },
  {
    name: 'Llama 70B + Gemini 2.5',
    pass1: { name: 'meta-llama/llama-3.1-70b-instruct', cost: 0.05 },
    pass2: { name: 'google/gemini-2.5-flash-preview-09-2025', cost: 0.30 }
  }
];

async function runTestWithConfiguration(combination) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${combination.name}`);
  console.log(`Pass 1: ${combination.pass1.name} ($${combination.pass1.cost}/M)`);
  console.log(`Pass 2: ${combination.pass2.name} ($${combination.pass2.cost}/M)`);
  console.log(`${'='.repeat(70)}\n`);

  const validatorPath = join(__dirname, '../api/lib/ai-validator-hardened.js');
  const originalContent = await fs.readFile(validatorPath, 'utf-8');

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

  await fs.writeFile(validatorPath, modifiedContent, 'utf-8');

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const testStart = Date.now();
    const { stdout, stderr } = await execAsync('node run-realistic-tests.js', {
      cwd: __dirname,
      maxBuffer: 10 * 1024 * 1024
    });
    const testDuration = Date.now() - testStart;

    const output = stdout + stderr;

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
      avgResponseTime: testDuration,
      totalCost: totalCostMatch ? parseFloat(totalCostMatch[1]) : null,
      avgCostPerTest: avgCostMatch ? parseFloat(avgCostMatch[1]) : null,
      testDuration: testDuration,
      pass1Cost: combination.pass1.cost,
      pass2Cost: combination.pass2.cost,
      rawOutput: output
    };

  } finally {
    await fs.writeFile(validatorPath, originalContent, 'utf-8');
  }
}

async function main() {
  console.log('🧪 SafePrompt Llama 70B Pass 1 Model Tests\n');
  console.log('Testing Llama 70B as Pass 1 model with different Pass 2 options');
  console.log('This will take approximately 15 minutes...\n');

  const results = [];

  for (const combination of LLAMA70B_COMBINATIONS) {
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

    if (LLAMA70B_COMBINATIONS.indexOf(combination) < LLAMA70B_COMBINATIONS.length - 1) {
      console.log('\n⏳ Waiting 30 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  console.log('\n\n' + '='.repeat(100));
  console.log('LLAMA 70B PASS 1 MODEL COMBINATION RESULTS');
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

  const resultPath = join(__dirname, 'llama70b-combination-results.json');
  await fs.writeFile(resultPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n📄 Detailed results saved to: ${resultPath}\n`);
}

main().catch(console.error);
