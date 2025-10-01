#!/usr/bin/env node
/**
 * Re-Tuning Candidates Analysis
 *
 * PURPOSE: Compile comprehensive list of models for re-tuning exploration
 *
 * CONTEXT: After discovering Pass 2 model only achieves 95.7%, we now know:
 * - Bar is lower than assumed (96%+ is acceptable, not 100%)
 * - Codestral 2501 (96%) is already better than current
 * - Many rejected models are viable with re-tuning
 *
 * CRITERIA:
 * - ≥90% accuracy (potential to reach 96%+ with tuning)
 * - <3000ms latency (beat current Pass 2)
 * - ≤$1.00/M cost ceiling
 * - Chinese model priority (cost efficiency)
 * - Available (no HTTP 404/429 errors)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load all previous test results
const fullTestResults = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-test-results.json'), 'utf-8'));
const quickTestResults = JSON.parse(fs.readFileSync(path.join(__dirname, 'quick-test-results.json'), 'utf-8'));
const premiumQuickTest = JSON.parse(fs.readFileSync(path.join(__dirname, 'premium-quick-test-results.json'), 'utf-8'));
const gpt35Results = JSON.parse(fs.readFileSync(path.join(__dirname, 'gpt35-turbo-full-test-results.json'), 'utf-8'));

// Compile all tested models
const allModels = [];

// From full test results (Pass 2 models with complete 50-test data)
if (fullTestResults.pass2Results) {
  fullTestResults.pass2Results.forEach(model => {
    allModels.push({
      id: model.modelId,
      name: model.modelId,
      price: model.price || 0,
      accuracy: model.accuracy,
      latency: model.avgLatency,
      tested: 'full',
      errors: model.failed || 0,
      falsePositives: model.falsePositives || 0,
      falseNegatives: model.falseNegatives || 0,
      jsonErrors: model.jsonParseErrors || 0,
      source: 'full-test-results'
    });
  });
}

// From GPT-3.5 results
allModels.push({
  id: 'openai/gpt-3.5-turbo',
  name: 'OpenAI: GPT-3.5 Turbo',
  price: 0.50,
  accuracy: gpt35Results.results.accuracy,
  latency: gpt35Results.results.avgLatency,
  tested: 'full',
  errors: 50 - gpt35Results.results.correct,
  falsePositives: gpt35Results.results.falsePositives,
  falseNegatives: gpt35Results.results.falseNegatives,
  jsonErrors: gpt35Results.results.jsonParseErrors,
  source: 'gpt35-turbo-full-test-results'
});

// From quick test results (Pass 2 models with availability/speed only)
if (quickTestResults.pass2?.allResults) {
  quickTestResults.pass2.allResults.forEach(model => {
    // Skip if already in full test results
    if (!allModels.find(m => m.id === model.id)) {
      allModels.push({
        id: model.id,
        name: model.name || model.id,
        price: model.price || 0,
        accuracy: null, // Not tested
        latency: model.quickTest?.latency || null,
        tested: 'quick',
        available: model.status === 'ok',
        source: 'quick-test-results'
      });
    }
  });
}

// Add current Pass 2 model with ACTUAL results (95.7% from validation test)
allModels.push({
  id: 'meta-llama/llama-3.1-70b-instruct',
  name: 'Meta: Llama 3.1 70B Instruct',
  price: 0.40,
  accuracy: 95.7, // From validation test (partial, 46/48 tests)
  latency: 3000,  // Average from validation test
  tested: 'validated',
  errors: 2, // At least 2 errors in 46 tests
  falsePositives: 1,
  falseNegatives: 1,
  jsonErrors: 0,
  isCurrent: true,
  source: 'current-pass2-validation (partial)'
});

// Identify Chinese models
const chineseProviders = ['qwen', 'deepseek', 'moonshotai', 'z-ai', 'tencent', 'alibaba', 'meituan', 'baichuan'];
allModels.forEach(model => {
  model.isChinese = chineseProviders.some(provider => model.id.toLowerCase().startsWith(provider));
  model.provider = model.id.split('/')[0];
});

// Filter candidates for re-tuning
const candidates = allModels.filter(model => {
  // Must have accuracy data OR quick test availability
  if (model.accuracy === null && !model.available) return false;

  // Must be ≥90% accuracy OR untested but available
  if (model.accuracy !== null && model.accuracy < 90) return false;

  // Must be ≤$1.00/M
  if (model.price > 1.00) return false;

  // Must be faster than current Pass 2 (if latency known)
  if (model.latency && model.latency > 3000) return false;

  return true;
});

// Calculate efficiency metrics
candidates.forEach(model => {
  if (model.latency && model.price) {
    // Cost per request (assuming average 500 tokens input + 200 tokens output = 700 tokens)
    const tokensPerRequest = 700;
    const costPerRequest = (model.price / 1000000) * tokensPerRequest;

    // Efficiency score: accuracy per dollar per second
    const accuracyScore = model.accuracy || 90; // Assume 90% for untested
    const latencySeconds = model.latency / 1000;
    model.efficiencyScore = accuracyScore / (costPerRequest * latencySeconds);

    model.costPerRequest = costPerRequest;
  }
});

// Sort by priority:
// 1. Chinese models first (user priority)
// 2. Then by accuracy (highest first)
// 3. Then by efficiency score
candidates.sort((a, b) => {
  // Chinese models first
  if (a.isChinese !== b.isChinese) return b.isChinese - a.isChinese;

  // Then by accuracy
  const aAcc = a.accuracy || 90;
  const bAcc = b.accuracy || 90;
  if (Math.abs(aAcc - bAcc) > 1) return bAcc - aAcc;

  // Then by efficiency score
  if (a.efficiencyScore && b.efficiencyScore) {
    return b.efficiencyScore - a.efficiencyScore;
  }

  // Finally by latency (faster first)
  if (a.latency && b.latency) return a.latency - b.latency;

  return 0;
});

// Generate report
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Re-Tuning Candidates Analysis (Chinese Model Priority)  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📊 REVISED SUCCESS CRITERIA (After Pass 2 Validation)');
console.log('═'.repeat(80));
console.log('Current Pass 2 Baseline: 95.7% accuracy, 3000ms latency, $0.40/M');
console.log('');
console.log('Success Criteria for Re-Tuning:');
console.log('  ✅ Accuracy: ≥96% (beat current baseline)');
console.log('  ✅ Latency: <3000ms (not hard to beat!)');
console.log('  ✅ Cost: ≤$1.00/M (approved ceiling)');
console.log('  ✅ Priority: Chinese models > Non-Chinese\n');

console.log('═'.repeat(80));
console.log(`📋 TOTAL CANDIDATES: ${candidates.length} models`);
console.log('═'.repeat(80));

// Group by category
const chineseCandidates = candidates.filter(c => c.isChinese);
const fullyTested = candidates.filter(c => c.tested === 'full');
const quickTested = candidates.filter(c => c.tested === 'quick');
const current = candidates.filter(c => c.isCurrent);

console.log(`\n🇨🇳 Chinese Models: ${chineseCandidates.length}`);
console.log(`🧪 Fully Tested: ${fullyTested.length}`);
console.log(`⚡ Quick Tested: ${quickTested.length}`);
console.log(`⭐ Current Model: ${current.length}\n`);

// Top 10 candidates
console.log('═'.repeat(80));
console.log('🏆 TOP 10 RE-TUNING CANDIDATES (Chinese Priority)');
console.log('═'.repeat(80));

const top10 = candidates.slice(0, 10);
top10.forEach((model, i) => {
  const flag = model.isChinese ? '🇨🇳' : '🌎';
  const current = model.isCurrent ? '⭐ CURRENT' : '';
  const tested = model.tested === 'full' ? '🧪' : model.tested === 'quick' ? '⚡' : '✓';

  console.log(`\n${i + 1}. ${flag} ${tested} ${current} ${model.id}`);
  console.log(`   Provider: ${model.provider}`);

  if (model.accuracy !== null) {
    console.log(`   Accuracy: ${model.accuracy.toFixed(1)}% (${model.errors || 0} errors)`);
    if (model.falsePositives) console.log(`   False Positives: ${model.falsePositives}`);
    if (model.falseNegatives) console.log(`   False Negatives: ${model.falseNegatives}`);
    if (model.jsonErrors) console.log(`   JSON Errors: ${model.jsonErrors}`);
  } else {
    console.log(`   Accuracy: Not fully tested (quick test passed)`);
  }

  if (model.latency) {
    console.log(`   Latency: ${model.latency}ms`);
  }

  console.log(`   Cost: $${model.price.toFixed(2)}/M`);

  if (model.efficiencyScore) {
    console.log(`   Efficiency Score: ${model.efficiencyScore.toFixed(2)} (accuracy/$·s)`);
  }

  // Re-tuning potential assessment
  if (model.accuracy) {
    if (model.accuracy >= 96) {
      console.log(`   🎯 Re-Tuning Potential: HIGH (already ≥96%, optimize to 98-100%)`);
    } else if (model.accuracy >= 94) {
      console.log(`   🎯 Re-Tuning Potential: GOOD (94-96%, likely reachable with tuning)`);
    } else if (model.accuracy >= 90) {
      console.log(`   🎯 Re-Tuning Potential: MODERATE (90-94%, challenging but possible)`);
    }
  } else {
    console.log(`   🎯 Re-Tuning Potential: UNKNOWN (needs full testing first)`);
  }
});

// Chinese models deep dive
if (chineseCandidates.length > 0) {
  console.log('\n\n' + '═'.repeat(80));
  console.log('🇨🇳 CHINESE MODELS DEEP DIVE');
  console.log('═'.repeat(80));

  chineseCandidates.forEach((model, i) => {
    console.log(`\n${i + 1}. ${model.id}`);
    console.log(`   Provider: ${model.provider.toUpperCase()}`);
    console.log(`   Price: $${model.price.toFixed(3)}/M`);

    if (model.accuracy) {
      console.log(`   Accuracy: ${model.accuracy.toFixed(1)}%`);
      console.log(`   Latency: ${model.latency}ms`);
      console.log(`   Cost Advantage: ${((0.40 - model.price) / 0.40 * 100).toFixed(1)}% cheaper than current`);
      console.log(`   Speed Advantage: ${((3000 - model.latency) / 3000 * 100).toFixed(1)}% faster than current`);
    } else {
      console.log(`   Status: Available but not fully tested`);
      console.log(`   Quick Test Latency: ${model.latency}ms`);
    }

    // Why this model is interesting
    if (model.provider === 'deepseek') {
      console.log(`   💡 Why Interesting: DeepSeek known for reasoning at low cost`);
    } else if (model.provider === 'qwen') {
      console.log(`   💡 Why Interesting: Alibaba's flagship model, strong performance`);
    } else if (model.provider === 'z-ai') {
      console.log(`   💡 Why Interesting: GLM-4.5, competitive pricing`);
    } else if (model.provider === 'moonshotai') {
      console.log(`   💡 Why Interesting: Kimi, large context window`);
    }
  });
}

// Current model comparison
console.log('\n\n' + '═'.repeat(80));
console.log('📊 CURRENT MODEL VS TOP 3 ALTERNATIVES');
console.log('═'.repeat(80));

const currentModel = candidates.find(m => m.isCurrent);
const alternatives = candidates.filter(m => !m.isCurrent && m.accuracy).slice(0, 3);

if (currentModel) {
  console.log(`\n⭐ CURRENT (Pass 2): ${currentModel.id}`);
  console.log(`   Accuracy: ${currentModel.accuracy}%`);
  console.log(`   Latency: ${currentModel.latency}ms`);
  console.log(`   Cost: $${currentModel.price}/M`);
}

alternatives.forEach((alt, i) => {
  const flag = alt.isChinese ? '🇨🇳' : '🌎';
  console.log(`\n${flag} ALTERNATIVE ${i + 1}: ${alt.id}`);
  console.log(`   Accuracy: ${alt.accuracy}% (${alt.accuracy > currentModel.accuracy ? '+' : ''}${(alt.accuracy - currentModel.accuracy).toFixed(1)}%)`);
  console.log(`   Latency: ${alt.latency}ms (${alt.latency < currentModel.latency ? '-' : '+'}${Math.abs(alt.latency - currentModel.latency)}ms)`);
  console.log(`   Cost: $${alt.price}/M (${alt.price < currentModel.price ? '-' : '+'}$${Math.abs(alt.price - currentModel.price).toFixed(2)}/M)`);

  // Overall assessment
  const betterAccuracy = alt.accuracy >= currentModel.accuracy;
  const betterLatency = alt.latency < currentModel.latency;
  const betterCost = alt.price <= currentModel.price;
  const score = (betterAccuracy ? 1 : 0) + (betterLatency ? 1 : 0) + (betterCost ? 1 : 0);

  if (score === 3) {
    console.log(`   🏆 Assessment: BETTER IN ALL METRICS - Switch immediately`);
  } else if (score === 2) {
    console.log(`   ✅ Assessment: BETTER IN 2/3 METRICS - Strong candidate`);
  } else if (score === 1) {
    console.log(`   ⚠️  Assessment: BETTER IN 1/3 METRICS - Needs re-tuning`);
  }
});

// Recommendations
console.log('\n\n' + '═'.repeat(80));
console.log('🎯 RECOMMENDATIONS');
console.log('═'.repeat(80));

console.log('\n**TOP 5 CANDIDATES FOR RE-TUNING:**\n');

const top5 = candidates.slice(0, 5);
top5.forEach((model, i) => {
  const flag = model.isChinese ? '🇨🇳' : '🌎';
  console.log(`${i + 1}. ${flag} ${model.id}`);

  if (model.accuracy) {
    console.log(`   Current: ${model.accuracy}% accuracy, ${model.latency}ms, $${model.price}/M`);
    console.log(`   Goal: Optimize to 98-100% accuracy with prompt engineering`);
  } else {
    console.log(`   Status: Quick test passed, needs full testing`);
    console.log(`   Goal: Run full 50-test suite first, then optimize`);
  }
});

console.log('\n**RE-TUNING STRATEGY:**\n');
console.log('Phase 1: Optimize Already-Tested Models (High Confidence)');
console.log('  - Start with models that already achieved 94-96%');
console.log('  - Analyze specific failure modes');
console.log('  - Create model-specific prompts');
console.log('  - Test temperature/token variants');
console.log('');
console.log('Phase 2: Test Untested Chinese Models (Exploration)');
console.log('  - Focus on models that passed quick test');
console.log('  - Run full 50-test suite with default prompt');
console.log('  - If promising (≥94%), proceed to re-tuning');
console.log('');
console.log('Phase 3: Deploy Best Performers (Production)');
console.log('  - Switch Pass 2 to best model (≥98% accuracy)');
console.log('  - Deploy runners-up as fallbacks');
console.log('  - Monitor production metrics');

console.log('\n**IMMEDIATE ACTION:**\n');

const immediateCandidate = candidates.find(c => c.accuracy >= 96 && !c.isCurrent);
if (immediateCandidate) {
  console.log(`✅ ${immediateCandidate.id} is already BETTER than current (${immediateCandidate.accuracy}% vs 95.7%)`);
  console.log('   Recommendation: Re-tune this model first (highest success probability)');
  console.log(`   Expected outcome: 98-100% accuracy with optimized prompt`);
}

// Save detailed results
const outputPath = path.join(__dirname, 'retuning-candidates.json');
fs.writeFileSync(outputPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  criteria: {
    minAccuracy: 90,
    maxCost: 1.00,
    maxLatency: 3000,
    priority: 'Chinese models first'
  },
  baseline: {
    id: 'meta-llama/llama-3.1-70b-instruct',
    accuracy: 95.7,
    latency: 3000,
    cost: 0.40
  },
  summary: {
    totalCandidates: candidates.length,
    chineseModels: chineseCandidates.length,
    fullyTested: fullyTested.length,
    quickTested: quickTested.length
  },
  top5: top5.map(m => ({
    id: m.id,
    provider: m.provider,
    isChinese: m.isChinese,
    accuracy: m.accuracy,
    latency: m.latency,
    price: m.price,
    efficiencyScore: m.efficiencyScore,
    retuningPotential: m.accuracy >= 96 ? 'HIGH' : m.accuracy >= 94 ? 'GOOD' : 'MODERATE'
  })),
  allCandidates: candidates.map(m => ({
    id: m.id,
    provider: m.provider,
    isChinese: m.isChinese,
    accuracy: m.accuracy,
    latency: m.latency,
    price: m.price,
    tested: m.tested,
    errors: m.errors,
    efficiencyScore: m.efficiencyScore,
    isCurrent: m.isCurrent
  }))
}, null, 2));

console.log(`\n\n💾 Detailed results saved to: ${outputPath}\n`);
