/**
 * Comprehensive test of all model combinations
 * Tests both paid (with credits) and free model configurations
 */

import fs from 'fs';
import { validate2PassMulti } from '/home/projects/safeprompt/api/lib/ai-validator-2pass-multi.js';

// Test configuration
const CONFIG = {
  verbose: true,
  aiDelay: 1500,  // Delay between AI calls to avoid rate limiting
  testSubset: true,   // Test smaller subset for quick evaluation
  subsetSize: 5,      // Tests per category
  preFilterThreshold: {
    high: 0.8,
    low: 0.85
  }
};

// All model configurations to test
const MODEL_CONFIGS = [
  // PAID CONFIGURATIONS (using credits)
  {
    name: "Llama 8B + 70B (Credits)",
    pass1: [
      { name: 'meta-llama/llama-3.1-8b-instruct', costPerMillion: 0.02 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ],
    pass2: [
      { name: 'meta-llama/llama-3.1-70b-instruct', costPerMillion: 0.05 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ]
  },

  // FREE CONFIGURATIONS
  {
    name: "Gemini Flash + Flash (Free)",
    pass1: [
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ],
    pass2: [
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ]
  },

  {
    name: "DeepSeek Chat + R1 (Free)",
    pass1: [
      { name: 'deepseek/deepseek-chat-v3.1:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ],
    pass2: [
      { name: 'deepseek/deepseek-r1:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ]
  },

  {
    name: "Grok 4 Fast + Gemini (Free)",
    pass1: [
      { name: 'x-ai/grok-4-fast:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ],
    pass2: [
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ]
  },

  {
    name: "Llama 3.3 70B + DeepSeek R1 (Free)",
    pass1: [
      { name: 'meta-llama/llama-3.3-70b-instruct:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ],
    pass2: [
      { name: 'deepseek/deepseek-r1:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ]
  },

  {
    name: "Mistral Nemo + DeepSeek R1 (Free)",
    pass1: [
      { name: 'mistralai/mistral-nemo:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ],
    pass2: [
      { name: 'deepseek/deepseek-r1:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ]
  },

  {
    name: "Qwen 72B + DeepSeek R1 (Free)",
    pass1: [
      { name: 'qwen/qwen-2.5-72b-instruct:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ],
    pass2: [
      { name: 'deepseek/deepseek-r1:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ]
  },

  {
    name: "DeepSeek R1 + R1 Llama 70B (Free)",
    pass1: [
      { name: 'deepseek/deepseek-r1:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ],
    pass2: [
      { name: 'deepseek/deepseek-r1-distill-llama-70b:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ]
  },

  {
    name: "Gemini + DeepSeek Chimera (Free)",
    pass1: [
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ],
    pass2: [
      { name: 'tngtech/deepseek-r1t-chimera:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ]
  },

  {
    name: "OpenAI GPT OSS 120B (Free)",
    pass1: [
      { name: 'openai/gpt-oss-20b:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ],
    pass2: [
      { name: 'openai/gpt-oss-120b:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ]
  },

  {
    name: "Mixed Small Models (Free)",
    pass1: [
      { name: 'meta-llama/llama-3.2-3b-instruct:free', costPerMillion: 0 },
      { name: 'mistralai/mistral-7b-instruct:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ],
    pass2: [
      { name: 'nvidia/nemotron-nano-9b-v2:free', costPerMillion: 0 },
      { name: 'google/gemma-2-9b-it:free', costPerMillion: 0 },
      { name: 'google/gemini-2.0-flash-exp:free', costPerMillion: 0 }
    ]
  }
];

// Load test suite
const testSuite = JSON.parse(
  fs.readFileSync('/home/projects/safeprompt/test-suite/real-tests.json', 'utf8')
);

// Results storage
const allResults = [];

async function testPrompt(test, category, modelConfig) {
  const result = {
    text: test.text.substring(0, 100),
    category: category,
    expected: test.expected.safe,
    actual: {},
    passed: false
  };

  try {
    const start = Date.now();

    // We'll create a modified validate function that uses the specific models
    // For this test, we'll dynamically import after modifying the file
    const modelUpdateCode = `// Model configurations - Testing FREE models
const MODELS = {
  pass1: ${JSON.stringify(modelConfig.pass1.map(m => ({
    name: m.name,
    costPerMillion: m.costPerMillion,
    priority: modelConfig.pass1.indexOf(m) + 1
  })), null, 2)},
  pass2: ${JSON.stringify(modelConfig.pass2.map(m => ({
    name: m.name,
    costPerMillion: m.costPerMillion,
    priority: modelConfig.pass2.indexOf(m) + 1
  })), null, 2)}
};`;

    const fileContent = fs.readFileSync('/home/projects/safeprompt/api/lib/ai-validator-2pass-multi.js', 'utf8');
    const updatedContent = fileContent.replace(/\/\/ Model configurations[\s\S]*?const MODELS = {[\s\S]*?};/, modelUpdateCode);
    fs.writeFileSync('/home/projects/safeprompt/api/lib/ai-validator-2pass-multi.js', updatedContent);

    // Clear module cache to force reimport
    delete require.cache[require.resolve('/home/projects/safeprompt/api/lib/ai-validator-2pass-multi.js')];
    const { validate2PassMulti: testValidate } = await import('/home/projects/safeprompt/api/lib/ai-validator-2pass-multi.js');

    const validationResult = await testValidate(test.text, {
      timeout: 10000,
      preFilterThreshold: CONFIG.preFilterThreshold
    });
    const totalTime = Date.now() - start;

    result.actual = {
      safe: validationResult.safe,
      confidence: validationResult.confidence,
      passesExecuted: validationResult.passesExecuted,
      modelUsed: validationResult.modelUsed,
      totalCost: validationResult.totalCost,
      time: totalTime
    };

    result.passed = (validationResult.safe === test.expected.safe);

  } catch (error) {
    result.error = error.message;
    result.passed = false;
  }

  return result;
}

async function testConfiguration(config) {
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`Testing: ${config.name}`);
  console.log(`${'='.repeat(60)}`);

  const configResult = {
    name: config.name,
    models: {
      pass1: config.pass1.map(m => m.name),
      pass2: config.pass2.map(m => m.name)
    },
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      accuracy: 0,
      avgCost: 0,
      avgTime: 0
    },
    byCategory: {},
    failures: []
  };

  let totalCost = 0;
  let totalTime = 0;

  // Test each category
  for (const [category, tests] of Object.entries(testSuite.tests)) {
    const testsToRun = CONFIG.testSubset ? tests.slice(0, CONFIG.subsetSize) : tests;

    configResult.byCategory[category] = {
      total: testsToRun.length,
      passed: 0,
      failed: 0,
      accuracy: 0
    };

    console.log(`Testing ${category}: `, { end: '' });

    for (const test of testsToRun) {
      // Add delay to avoid rate limiting
      if (configResult.summary.total > 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.aiDelay));
      }

      const result = await testPrompt(test, category, config);

      configResult.summary.total++;
      if (result.passed) {
        configResult.summary.passed++;
        configResult.byCategory[category].passed++;
        process.stdout.write('.');
      } else {
        configResult.summary.failed++;
        configResult.byCategory[category].failed++;
        process.stdout.write('F');

        configResult.failures.push({
          category,
          text: test.text.substring(0, 60) + '...',
          expected: test.expected.safe,
          got: result.actual.safe
        });
      }

      if (result.actual.totalCost) totalCost += result.actual.totalCost;
      if (result.actual.time) totalTime += result.actual.time;
    }

    configResult.byCategory[category].accuracy =
      (configResult.byCategory[category].passed / configResult.byCategory[category].total * 100).toFixed(1);

    console.log(` ${configResult.byCategory[category].accuracy}%`);
  }

  // Calculate summary
  configResult.summary.accuracy =
    (configResult.summary.passed / configResult.summary.total * 100).toFixed(1);
  configResult.summary.avgCost = totalCost / configResult.summary.total;
  configResult.summary.avgTime = Math.round(totalTime / configResult.summary.total);
  configResult.summary.costPer1K = configResult.summary.avgCost * 1000;
  configResult.summary.costPer100K = configResult.summary.avgCost * 100000;

  console.log(`\nResults: ${configResult.summary.accuracy}% accuracy`);
  console.log(`Cost: $${configResult.summary.costPer100K.toFixed(2)}/100K`);
  console.log(`Speed: ${configResult.summary.avgTime}ms average`);

  return configResult;
}

async function runAllTests() {
  console.log('========================================');
  console.log('COMPREHENSIVE MODEL COMBINATION TESTING');
  console.log('========================================\n');
  console.log(`Testing ${MODEL_CONFIGS.length} configurations`);
  console.log(`${CONFIG.subsetSize} tests per category (${CONFIG.subsetSize * 4} total per config)`);

  // Test all configurations
  for (const config of MODEL_CONFIGS) {
    const result = await testConfiguration(config);
    allResults.push(result);
  }

  // Print comparison table
  console.log('\n\n' + '='.repeat(100));
  console.log('FINAL COMPARISON');
  console.log('='.repeat(100) + '\n');

  // Sort by accuracy
  allResults.sort((a, b) => parseFloat(b.summary.accuracy) - parseFloat(a.summary.accuracy));

  console.log('| Rank | Configuration | Accuracy | Speed | Cost/100K | Grade |');
  console.log('|------|---------------|----------|-------|-----------|-------|');

  allResults.forEach((result, index) => {
    const grade =
      parseFloat(result.summary.accuracy) >= 85 ? '🚀' :
      parseFloat(result.summary.accuracy) >= 75 ? '✅' :
      parseFloat(result.summary.accuracy) >= 65 ? '🔶' : '❌';

    const name = result.name.padEnd(35).substring(0, 35);
    console.log(
      `| ${(index + 1).toString().padStart(4)} | ${name} | ${result.summary.accuracy.padStart(7)}% | ${
        result.summary.avgTime.toString().padStart(5)
      }ms | $${result.summary.costPer100K.toFixed(2).padStart(7)} | ${grade.padStart(5)} |`
    );
  });

  // Detailed category breakdown for top 3
  console.log('\n\nTOP 3 DETAILED BREAKDOWN:');
  console.log('='.repeat(60));

  for (let i = 0; i < Math.min(3, allResults.length); i++) {
    const result = allResults[i];
    console.log(`\n${i + 1}. ${result.name}`);
    console.log('   Categories: ', Object.entries(result.byCategory)
      .map(([cat, stats]) => `${cat}: ${stats.accuracy}%`)
      .join(', '));
  }

  // Save results
  fs.writeFileSync(
    '/home/projects/safeprompt/test-suite/all-combinations-results.json',
    JSON.stringify(allResults, null, 2)
  );

  console.log('\n\nResults saved to: all-combinations-results.json');
}

// Run tests
runAllTests().catch(console.error);