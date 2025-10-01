#!/usr/bin/env node
/**
 * Build Premium Candidate List (Up to 15% More Expensive)
 *
 * Objective:
 * 1. Find faster models that justify small cost increase (potential primary)
 * 2. Find high-quality fallbacks in case current models fail
 *
 * Current costs:
 * - Pass 1: $0.02/M → test up to $0.023/M (15% increase)
 * - Pass 2: $0.40/M → test up to $0.46/M (15% increase)
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '/home/projects/.env' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Current baseline
const BASELINE = {
  pass1: { model: 'meta-llama/llama-3.1-8b-instruct', cost: 0.02 },
  pass2: { model: 'meta-llama/llama-3.1-70b-instruct', cost: 0.40 }
};

// Price ranges (up to 15% more expensive, but flexible for actual market pricing)
const PASS1_MIN = 0.02;   // Current cost (include current model)
const PASS1_MAX = 0.023;  // 15% more expensive
const PASS2_MIN = 0.40;   // Current cost (include current model)
const PASS2_MAX = 0.50;   // Next available tier (25% increase due to pricing gap)

// All providers (Western + Chinese + others)
const ALL_PROVIDERS = [
  // Western
  'meta-llama', 'google', 'anthropic', 'openai', 'mistralai', 'nvidia', 'cohere',
  // Chinese
  'qwen', 'deepseek', 'moonshotai', 'z-ai', 'tencent', 'alibaba', 'meituan',
  // Others
  'cognitivecomputations', 'nousresearch', 'perplexity', 'groq'
];

/**
 * Fetch and categorize premium candidates
 */
async function buildPremiumList() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Building Premium Candidate List (Up to 15% More)        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('Current Baseline:');
  console.log(`  Pass 1: ${BASELINE.pass1.model} ($${BASELINE.pass1.cost}/M)`);
  console.log(`  Pass 2: ${BASELINE.pass2.model} ($${BASELINE.pass2.cost}/M)\n`);

  console.log('Premium Ranges (up to 15% more expensive):');
  console.log(`  Pass 1: $${PASS1_MIN}-$${PASS1_MAX}/M`);
  console.log(`  Pass 2: $${PASS2_MIN}-$${PASS2_MAX}/M\n`);

  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` }
  });

  const data = await response.json();

  const pass1Candidates = [];
  const pass2Candidates = [];

  for (const model of data.data) {
    const price = parseFloat(model.pricing?.prompt || '999');
    if (price === 999 || price === 0) continue; // Skip free and unknown

    const pricePerM = price * 1000000;
    const contextLength = model.context_length || 0;

    // Skip if context too small
    if (contextLength < 4000) continue;

    // Check if from known provider
    const isKnownProvider = ALL_PROVIDERS.some(p => model.id.startsWith(p));
    if (!isKnownProvider) continue;

    // Categorize by newer/better keywords
    const isNewer = ['2024', '2025', 'v3', 'v4', '3.1', '3.2', '3.3', '4.0',
                     'flash', 'turbo', 'pro', 'ultra', 'plus', 'thinking'].some(kw =>
      model.id.toLowerCase().includes(kw) || (model.name || '').toLowerCase().includes(kw)
    );

    const isPremium = ['pro', 'ultra', 'premium', 'plus', 'advanced', 'thinking'].some(kw =>
      model.id.toLowerCase().includes(kw) || (model.name || '').toLowerCase().includes(kw)
    );

    // Pass 1 candidates (including current)
    if (pricePerM >= PASS1_MIN && pricePerM <= PASS1_MAX) {
      pass1Candidates.push({
        id: model.id,
        name: model.name,
        price: pricePerM,
        context: contextLength,
        isNewer,
        isPremium,
        provider: model.id.split('/')[0],
        isCurrent: model.id === BASELINE.pass1.model
      });
    }

    // Pass 2 candidates (including current)
    if (pricePerM >= PASS2_MIN && pricePerM <= PASS2_MAX) {
      pass2Candidates.push({
        id: model.id,
        name: model.name,
        price: pricePerM,
        context: contextLength,
        isNewer,
        isPremium,
        provider: model.id.split('/')[0],
        isCurrent: model.id === BASELINE.pass2.model
      });
    }
  }

  // Sort by: current first, then premium, then newer, then by price
  const sortCandidates = (a, b) => {
    if (a.isCurrent !== b.isCurrent) return b.isCurrent - a.isCurrent;
    if (a.isPremium !== b.isPremium) return b.isPremium - a.isPremium;
    if (a.isNewer !== b.isNewer) return b.isNewer - a.isNewer;
    return a.price - b.price;
  };

  pass1Candidates.sort(sortCandidates);
  pass2Candidates.sort(sortCandidates);

  // Display results
  console.log('═'.repeat(80));
  console.log(`Pass 1 Premium Candidates: ${pass1Candidates.length} models found`);
  console.log('═'.repeat(80));

  pass1Candidates.forEach((m, i) => {
    const current = m.isCurrent ? '⭐ CURRENT' : '';
    const premium = m.isPremium ? '💎' : '';
    const newer = m.isNewer ? '🆕' : '';
    const costIncrease = ((m.price - BASELINE.pass1.cost) / BASELINE.pass1.cost * 100).toFixed(1);

    console.log(`${i + 1}. ${current} ${premium} ${newer} ${m.id}`);
    console.log(`   ${m.name}`);
    console.log(`   Price: $${m.price.toFixed(3)}/M (+${costIncrease}%) | Context: ${m.context.toLocaleString()} | Provider: ${m.provider}`);
    console.log('');
  });

  console.log('\n' + '═'.repeat(80));
  console.log(`Pass 2 Premium Candidates: ${pass2Candidates.length} models found`);
  console.log('═'.repeat(80));

  pass2Candidates.forEach((m, i) => {
    const current = m.isCurrent ? '⭐ CURRENT' : '';
    const premium = m.isPremium ? '💎' : '';
    const newer = m.isNewer ? '🆕' : '';
    const costIncrease = ((m.price - BASELINE.pass2.cost) / BASELINE.pass2.cost * 100).toFixed(1);

    console.log(`${i + 1}. ${current} ${premium} ${newer} ${m.id}`);
    console.log(`   ${m.name}`);
    console.log(`   Price: $${m.price.toFixed(3)}/M (+${costIncrease}%) | Context: ${m.context.toLocaleString()} | Provider: ${m.provider}`);
    console.log('');
  });

  // Save to file
  const resultsPath = path.join(__dirname, 'premium-candidates.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseline: BASELINE,
    criteria: {
      pass1: { min: PASS1_MIN, max: PASS1_MAX, maxIncrease: '15%' },
      pass2: { min: PASS2_MIN, max: PASS2_MAX, maxIncrease: '15%' }
    },
    pass1Candidates,
    pass2Candidates
  }, null, 2));

  console.log(`\n💾 Candidates saved to: ${resultsPath}`);
  console.log(`\nSummary:`);
  console.log(`  Pass 1: ${pass1Candidates.length} premium candidates`);
  console.log(`  Pass 2: ${pass2Candidates.length} premium candidates`);

  return { pass1Candidates, pass2Candidates };
}

buildPremiumList().catch(console.error);
