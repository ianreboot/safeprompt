#!/usr/bin/env node
/**
 * Build comprehensive candidate list for fallback models
 *
 * Criteria:
 * - Pass 1: $0.016-$0.025/M (within 20% of $0.02)
 * - Pass 2: $0.32-$0.50/M (within 20% of $0.40)
 * - Include: Western + Chinese models (Qwen, DeepSeek, Kimi, Z.AI, etc.)
 * - Prioritize: Recent models, well-known providers
 * - Target: 10-30 candidates per pass
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

// Price ranges (within 20% range, extended slightly for more options)
const PASS1_MIN = 0.016; // 20% cheaper
const PASS1_MAX = 0.025; // 25% more expensive (to get more candidates)
const PASS2_MIN = 0.30;  // 25% cheaper
const PASS2_MAX = 0.50;  // 25% more expensive

// Preferred providers (Western + Chinese)
const PREFERRED_PROVIDERS = [
  // Western
  'meta-llama', 'google', 'anthropic', 'openai', 'mistralai',
  // Chinese
  'qwen', 'deepseek', 'moonshotai', 'z-ai', 'tencent', 'alibaba', 'meituan',
  // Others
  'nvidia', 'cognitivecomputations'
];

// Keywords for newer models
const NEWER_MODEL_KEYWORDS = [
  '2024', '2025', 'v3', 'v4', 'v5', '3.1', '3.2', '3.3', '4.0',
  'flash', 'turbo', 'next', 'pro', 'ultra', 'plus'
];

/**
 * Fetch and categorize candidates
 */
async function buildCandidateList() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Building Comprehensive Fallback Candidate List           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('Current Baseline:');
  console.log(`  Pass 1: ${BASELINE.pass1.model} ($${BASELINE.pass1.cost}/M)`);
  console.log(`  Pass 2: ${BASELINE.pass2.model} ($${BASELINE.pass2.cost}/M)\n`);

  console.log('Target Ranges:');
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
    if (price === 999 || price === 0) continue; // Skip free and unknown pricing

    const pricePerM = price * 1000000;
    const contextLength = model.context_length || 0;

    // Skip if context too small
    if (contextLength < 4000) continue;

    // Check if preferred provider
    const isPreferred = PREFERRED_PROVIDERS.some(p => model.id.startsWith(p));
    if (!isPreferred) continue;

    // Check if newer model
    const isNewer = NEWER_MODEL_KEYWORDS.some(kw =>
      model.id.toLowerCase().includes(kw) ||
      (model.name || '').toLowerCase().includes(kw)
    );

    // Pass 1 candidates
    if (pricePerM >= PASS1_MIN && pricePerM <= PASS1_MAX) {
      pass1Candidates.push({
        id: model.id,
        name: model.name,
        price: pricePerM,
        context: contextLength,
        isNewer,
        provider: model.id.split('/')[0]
      });
    }

    // Pass 2 candidates
    if (pricePerM >= PASS2_MIN && pricePerM <= PASS2_MAX) {
      pass2Candidates.push({
        id: model.id,
        name: model.name,
        price: pricePerM,
        context: contextLength,
        isNewer,
        provider: model.id.split('/')[0]
      });
    }
  }

  // Sort by: newer first, then by price (cheaper first)
  const sortCandidates = (a, b) => {
    if (a.isNewer !== b.isNewer) return b.isNewer - a.isNewer;
    return a.price - b.price;
  };

  pass1Candidates.sort(sortCandidates);
  pass2Candidates.sort(sortCandidates);

  // Display results
  console.log('═'.repeat(80));
  console.log(`Pass 1 Candidates: ${pass1Candidates.length} models found`);
  console.log('═'.repeat(80));

  pass1Candidates.forEach((m, i) => {
    const newer = m.isNewer ? '🆕' : '  ';
    console.log(`${i + 1}. ${newer} ${m.id}`);
    console.log(`   ${m.name}`);
    console.log(`   Price: $${m.price.toFixed(2)}/M | Context: ${m.context.toLocaleString()} | Provider: ${m.provider}`);
    console.log('');
  });

  console.log('\n' + '═'.repeat(80));
  console.log(`Pass 2 Candidates: ${pass2Candidates.length} models found`);
  console.log('═'.repeat(80));

  pass2Candidates.forEach((m, i) => {
    const newer = m.isNewer ? '🆕' : '  ';
    console.log(`${i + 1}. ${newer} ${m.id}`);
    console.log(`   ${m.name}`);
    console.log(`   Price: $${m.price.toFixed(2)}/M | Context: ${m.context.toLocaleString()} | Provider: ${m.provider}`);
    console.log('');
  });

  // Save to file
  const resultsPath = path.join(__dirname, 'fallback-candidates.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseline: BASELINE,
    criteria: {
      pass1: { min: PASS1_MIN, max: PASS1_MAX },
      pass2: { min: PASS2_MIN, max: PASS2_MAX }
    },
    pass1Candidates,
    pass2Candidates
  }, null, 2));

  console.log(`\n💾 Candidates saved to: ${resultsPath}`);
  console.log(`\nSummary:`);
  console.log(`  Pass 1: ${pass1Candidates.length} candidates (target: 10-30)`);
  console.log(`  Pass 2: ${pass2Candidates.length} candidates (target: 10-30)`);

  if (pass1Candidates.length < 10) {
    console.log(`\n⚠️  Warning: Only ${pass1Candidates.length} Pass 1 candidates found (target: 10-30)`);
  }
  if (pass2Candidates.length < 10) {
    console.log(`⚠️  Warning: Only ${pass2Candidates.length} Pass 2 candidates found (target: 10-30)`);
  }

  return { pass1Candidates, pass2Candidates };
}

buildCandidateList().catch(console.error);
