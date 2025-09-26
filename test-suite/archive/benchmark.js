/**
 * Benchmark test for SafePrompt API
 * Tests performance and accuracy
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test prompts
const testData = JSON.parse(fs.readFileSync(join(__dirname, 'test-prompts.json'), 'utf8'));

// API endpoint
const API_URL = 'http://localhost:3000/api/v1/check';

// Performance metrics
const metrics = {
  totalRequests: 0,
  safePassed: 0,
  safeFailed: 0,
  unsafeBlocked: 0,
  unsafePassed: 0,
  responseTimes: [],
  errors: []
};

/**
 * Test a single prompt
 */
async function testPrompt(prompt, expectedSafe) {
  const startTime = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const responseTime = Date.now() - startTime;
    metrics.responseTimes.push(responseTime);
    metrics.totalRequests++;

    const result = await response.json();

    // Check accuracy
    if (expectedSafe && result.safe) {
      metrics.safePassed++;
    } else if (expectedSafe && !result.safe) {
      metrics.safeFailed++;
      console.log(`FALSE POSITIVE: "${prompt.substring(0, 50)}..."`);
    } else if (!expectedSafe && !result.safe) {
      metrics.unsafeBlocked++;
    } else if (!expectedSafe && result.safe) {
      metrics.unsafePassed++;
      console.log(`FALSE NEGATIVE: "${prompt.substring(0, 50)}..."`);
    }

    return { ...result, responseTime };

  } catch (error) {
    metrics.errors.push(error.message);
    return { error: error.message };
  }
}

/**
 * Calculate percentiles
 */
function calculatePercentile(arr, percentile) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

/**
 * Run benchmark
 */
async function runBenchmark() {
  console.log('🚀 Starting SafePrompt benchmark...\n');

  // Test safe prompts
  console.log('Testing SAFE prompts...');
  for (const prompt of testData.safe) {
    await testPrompt(prompt, true);
  }

  // Test unsafe prompts
  console.log('Testing UNSAFE prompts...');
  for (const prompt of testData.unsafe) {
    await testPrompt(prompt, false);
  }

  // Test edge cases
  console.log('Testing EDGE CASES...');
  for (const prompt of testData.edge_cases) {
    // Edge cases are tricky - we'll just measure performance
    await testPrompt(prompt, true);  // Assume safe for legitimate use cases
  }

  // Calculate metrics
  const avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
  const p50 = calculatePercentile(metrics.responseTimes, 50);
  const p95 = calculatePercentile(metrics.responseTimes, 95);
  const p99 = calculatePercentile(metrics.responseTimes, 99);
  const minTime = Math.min(...metrics.responseTimes);
  const maxTime = Math.max(...metrics.responseTimes);

  // Calculate rates
  const falsePositiveRate = metrics.safeFailed / (metrics.safePassed + metrics.safeFailed) * 100;
  const falseNegativeRate = metrics.unsafePassed / (metrics.unsafeBlocked + metrics.unsafePassed) * 100;
  const accuracy = (metrics.safePassed + metrics.unsafeBlocked) / metrics.totalRequests * 100;

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 BENCHMARK RESULTS');
  console.log('='.repeat(60));

  console.log('\n🎯 ACCURACY METRICS:');
  console.log(`  Total Requests: ${metrics.totalRequests}`);
  console.log(`  Accuracy: ${accuracy.toFixed(2)}%`);
  console.log(`  False Positive Rate: ${falsePositiveRate.toFixed(2)}%`);
  console.log(`  False Negative Rate: ${falseNegativeRate.toFixed(2)}%`);

  console.log('\n⚡ PERFORMANCE METRICS:');
  console.log(`  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`  P50 (Median): ${p50}ms`);
  console.log(`  P95: ${p95}ms`);
  console.log(`  P99: ${p99}ms`);
  console.log(`  Min: ${minTime}ms`);
  console.log(`  Max: ${maxTime}ms`);

  console.log('\n📈 BREAKDOWN:');
  console.log(`  Safe prompts correctly allowed: ${metrics.safePassed}`);
  console.log(`  Safe prompts incorrectly blocked: ${metrics.safeFailed}`);
  console.log(`  Unsafe prompts correctly blocked: ${metrics.unsafeBlocked}`);
  console.log(`  Unsafe prompts incorrectly allowed: ${metrics.unsafePassed}`);

  if (metrics.errors.length > 0) {
    console.log('\n⚠️ ERRORS:');
    metrics.errors.forEach(err => console.log(`  - ${err}`));
  }

  // Success criteria check
  console.log('\n✅ SUCCESS CRITERIA CHECK:');
  console.log(`  P95 < 200ms: ${p95 < 200 ? '✅ PASS' : '❌ FAIL'} (${p95}ms)`);
  console.log(`  False Positive Rate < 0.5%: ${falsePositiveRate < 0.5 ? '✅ PASS' : '❌ FAIL'} (${falsePositiveRate.toFixed(2)}%)`);
  console.log(`  Accuracy > 95%: ${accuracy > 95 ? '✅ PASS' : '❌ FAIL'} (${accuracy.toFixed(2)}%)`);

  // Save results to file
  const results = {
    timestamp: new Date().toISOString(),
    metrics,
    performance: {
      avg: avgResponseTime,
      p50,
      p95,
      p99,
      min: minTime,
      max: maxTime
    },
    accuracy: {
      overall: accuracy,
      falsePositiveRate,
      falseNegativeRate
    }
  };

  fs.writeFileSync(
    join(__dirname, 'benchmark-results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\n💾 Results saved to benchmark-results.json');
}

// Run the benchmark
runBenchmark().catch(console.error);