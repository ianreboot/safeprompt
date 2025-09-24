/**
 * Benchmark optimized SafePrompt endpoint
 * Tests caching and confidence-based routing improvements
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Load test datasets
const datasets = JSON.parse(
  fs.readFileSync('/home/projects/user-input/claude-safeprompt/test-datasets.json', 'utf8')
);

// Test configurations
const ENDPOINTS = {
  baseline: 'http://localhost:3000/api/v1/check',
  withAI: 'http://localhost:3000/api/v1/check-with-ai',
  optimized: 'http://localhost:3000/api/v1/check-optimized'
};

const TEST_SCENARIOS = [
  {
    name: 'Cold Start (No Cache)',
    prompts: datasets.mixed.slice(0, 20),
    useCache: true,
    iterations: 1
  },
  {
    name: 'Warm Cache (Same Prompts)',
    prompts: datasets.mixed.slice(0, 20),
    useCache: true,
    iterations: 2  // Second iteration should hit cache
  },
  {
    name: 'High Confidence Safe',
    prompts: datasets.legitimate.filter(p =>
      p.text.startsWith('What is') || p.text.startsWith('How does')
    ).slice(0, 10),
    useCache: false,
    iterations: 1
  },
  {
    name: 'High Confidence Unsafe',
    prompts: datasets.malicious.filter(p =>
      p.text.includes('ignore') && p.text.includes('previous')
    ).slice(0, 10),
    useCache: false,
    iterations: 1
  }
];

async function testEndpoint(endpoint, prompts, options = {}) {
  const results = {
    times: [],
    correct: 0,
    incorrect: 0,
    errors: 0,
    optimizations: {},
    cacheHits: 0
  };

  for (const promptData of prompts) {
    try {
      const start = Date.now();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptData.text,
          useCache: options.useCache,
          useOptimizations: options.useOptimizations,
          debug: true
        })
      });

      const elapsed = Date.now() - start;
      results.times.push(elapsed);

      if (response.ok) {
        const data = await response.json();

        // Check accuracy
        const expected = promptData.label === 'safe';
        if (data.safe === expected) {
          results.correct++;
        } else {
          results.incorrect++;
        }

        // Track optimizations
        if (data.optimizations) {
          for (const opt of data.optimizations) {
            results.optimizations[opt] = (results.optimizations[opt] || 0) + 1;
          }
        }

        // Track cache hits
        if (data.cached || data.optimizations?.includes('cache_hit')) {
          results.cacheHits++;
        }
      } else {
        results.errors++;
      }
    } catch (error) {
      results.errors++;
      console.error(`Error: ${error.message}`);
    }
  }

  return results;
}

function calculateStats(times) {
  if (times.length === 0) return {};

  const sorted = times.sort((a, b) => a - b);
  return {
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1]
  };
}

async function runBenchmark() {
  console.log('🚀 SafePrompt Optimization Benchmark');
  console.log('=' .repeat(60));
  console.log('Testing caching and confidence-based routing improvements\n');

  const benchmarkResults = {};

  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n📊 Scenario: ${scenario.name}`);
    console.log('-'.repeat(40));

    benchmarkResults[scenario.name] = {};

    // Test each endpoint
    for (const [name, endpoint] of Object.entries(ENDPOINTS)) {
      if (name === 'baseline' && scenario.name.includes('Cache')) {
        continue; // Skip baseline for cache tests
      }

      console.log(`\nTesting ${name}...`);

      let allResults = {
        times: [],
        correct: 0,
        incorrect: 0,
        errors: 0,
        optimizations: {},
        cacheHits: 0
      };

      // Run iterations
      for (let i = 0; i < scenario.iterations; i++) {
        const results = await testEndpoint(endpoint, scenario.prompts, {
          useCache: scenario.useCache,
          useOptimizations: true
        });

        // Aggregate results
        allResults.times.push(...results.times);
        allResults.correct += results.correct;
        allResults.incorrect += results.incorrect;
        allResults.errors += results.errors;
        allResults.cacheHits += results.cacheHits;

        for (const [opt, count] of Object.entries(results.optimizations)) {
          allResults.optimizations[opt] = (allResults.optimizations[opt] || 0) + count;
        }

        // Small delay between iterations
        if (i < scenario.iterations - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Calculate statistics
      const stats = calculateStats(allResults.times);
      const accuracy = (allResults.correct / (allResults.correct + allResults.incorrect)) * 100;

      benchmarkResults[scenario.name][name] = {
        accuracy: accuracy.toFixed(1),
        stats,
        cacheHits: allResults.cacheHits,
        optimizations: allResults.optimizations,
        errors: allResults.errors
      };

      console.log(`  Accuracy: ${accuracy.toFixed(1)}%`);
      console.log(`  Avg Time: ${stats.avg?.toFixed(0)}ms`);
      console.log(`  P95 Time: ${stats.p95}ms`);

      if (allResults.cacheHits > 0) {
        console.log(`  Cache Hits: ${allResults.cacheHits}`);
      }

      if (Object.keys(allResults.optimizations).length > 0) {
        console.log(`  Optimizations:`, allResults.optimizations);
      }
    }
  }

  // Summary comparison
  console.log('\n\n📈 OPTIMIZATION IMPACT SUMMARY');
  console.log('=' .repeat(60));

  // Calculate improvements
  const coldStart = benchmarkResults['Cold Start (No Cache)'];
  const warmCache = benchmarkResults['Warm Cache (Same Prompts)'];

  if (coldStart?.optimized && warmCache?.optimized) {
    const coldP95 = coldStart.optimized.stats.p95;
    const warmP95 = warmCache.optimized.stats.p95;
    const cacheImprovement = ((coldP95 - warmP95) / coldP95 * 100).toFixed(1);

    console.log('\n🎯 Key Metrics:');
    console.log(`  Cold Start P95: ${coldP95}ms`);
    console.log(`  Warm Cache P95: ${warmP95}ms`);
    console.log(`  Cache Improvement: ${cacheImprovement}%`);
    console.log(`  Cache Hit Rate: ${warmCache.optimized.cacheHits}/${scenario.prompts.length * 2}`);
  }

  // Show optimization distribution
  console.log('\n🔧 Optimization Usage:');
  let totalOptimizations = {};
  for (const scenario of Object.values(benchmarkResults)) {
    if (scenario.optimized?.optimizations) {
      for (const [opt, count] of Object.entries(scenario.optimized.optimizations)) {
        totalOptimizations[opt] = (totalOptimizations[opt] || 0) + count;
      }
    }
  }

  for (const [opt, count] of Object.entries(totalOptimizations)) {
    console.log(`  ${opt}: ${count} times`);
  }

  // Final assessment
  console.log('\n\n✅ FINAL OPTIMIZATION ASSESSMENT');
  console.log('=' .repeat(60));

  const improvements = {
    caching: warmCache?.optimized?.cacheHits > 0,
    confidenceRouting: totalOptimizations['high_confidence_safe'] > 0 ||
                       totalOptimizations['high_confidence_unsafe'] > 0,
    performance: warmCache?.optimized?.stats?.p95 < coldStart?.optimized?.stats?.p95
  };

  console.log(`Caching Working: ${improvements.caching ? '✅ YES' : '❌ NO'}`);
  console.log(`Confidence Routing: ${improvements.confidenceRouting ? '✅ YES' : '❌ NO'}`);
  console.log(`Performance Improved: ${improvements.performance ? '✅ YES' : '❌ NO'}`);

  if (Object.values(improvements).every(v => v)) {
    console.log('\n🎉 All optimizations working successfully!');
  }

  // Save results
  const resultsPath = '/home/projects/user-input/claude-safeprompt/optimization-benchmark.json';
  fs.writeFileSync(resultsPath, JSON.stringify(benchmarkResults, null, 2));
  console.log(`\n📁 Results saved to ${resultsPath}`);
}

// Run benchmark
runBenchmark().catch(console.error);