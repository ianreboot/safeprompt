#!/usr/bin/env node
/**
 * SafePrompt Cost-Neutral Model Testing
 *
 * Find models that are same-or-lower cost but potentially faster
 * Current: Pass 1 = $0.02/M, Pass 2 = $0.05/M
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '/home/projects/.env' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Current system costs
const CURRENT_COSTS = {
  pass1: 0.02,  // $0.02 per million tokens (Llama 8B)
  pass2: 0.05   // $0.05 per million tokens (Llama 70B)
};

/**
 * Fetch all models and filter by price
 */
async function findCostNeutralModels() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Searching for Cost-Neutral Faster Models                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Current Costs:`);
  console.log(`  Pass 1: $${CURRENT_COSTS.pass1}/M tokens (Llama 8B)`);
  console.log(`  Pass 2: $${CURRENT_COSTS.pass2}/M tokens (Llama 70B)\n`);

  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`
    }
  });

  const data = await response.json();

  // Filter models by price
  const pass1Candidates = [];
  const pass2Candidates = [];

  for (const model of data.data) {
    const promptPrice = parseFloat(model.pricing?.prompt || '999');

    // Skip if no pricing info
    if (promptPrice === 999) continue;

    // Pass 1 candidates: ≤ $0.02/M
    if (promptPrice <= CURRENT_COSTS.pass1) {
      pass1Candidates.push({
        id: model.id,
        name: model.name,
        price: promptPrice,
        context: model.context_length
      });
    }

    // Pass 2 candidates: ≤ $0.05/M
    if (promptPrice <= CURRENT_COSTS.pass2 && promptPrice > CURRENT_COSTS.pass1) {
      pass2Candidates.push({
        id: model.id,
        name: model.name,
        price: promptPrice,
        context: model.context_length
      });
    }
  }

  // Sort by price (cheapest first)
  pass1Candidates.sort((a, b) => a.price - b.price);
  pass2Candidates.sort((a, b) => a.price - b.price);

  console.log(`\n📊 Found ${pass1Candidates.length} Pass 1 candidates (≤ $${CURRENT_COSTS.pass1}/M)`);
  console.log(`📊 Found ${pass2Candidates.length} Pass 2 candidates ($${CURRENT_COSTS.pass1} < price ≤ $${CURRENT_COSTS.pass2}/M)\n`);

  // Show top candidates
  console.log('═'.repeat(80));
  console.log('🎯 Pass 1 Candidates (Fast Models ≤ $0.02/M)');
  console.log('═'.repeat(80));

  const pass1Top = pass1Candidates.slice(0, 20);
  pass1Top.forEach((model, i) => {
    const priceStr = model.price === 0 ? 'FREE' : `$${model.price}/M`;
    console.log(`${i + 1}. ${model.id}`);
    console.log(`   ${model.name}`);
    console.log(`   Price: ${priceStr} | Context: ${model.context.toLocaleString()}`);
    console.log('');
  });

  console.log('\n' + '═'.repeat(80));
  console.log('🎯 Pass 2 Candidates (Powerful Models $0.02-$0.05/M)');
  console.log('═'.repeat(80));

  const pass2Top = pass2Candidates.slice(0, 20);
  pass2Top.forEach((model, i) => {
    console.log(`${i + 1}. ${model.id}`);
    console.log(`   ${model.name}`);
    console.log(`   Price: $${model.price}/M | Context: ${model.context.toLocaleString()}`);
    console.log('');
  });

  // Save results
  const resultsPath = path.join(__dirname, 'cost-neutral-models.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    currentCosts: CURRENT_COSTS,
    pass1Candidates: pass1Top,
    pass2Candidates: pass2Top,
    allPass1: pass1Candidates,
    allPass2: pass2Candidates
  }, null, 2));

  console.log(`\n💾 Full results saved to: ${resultsPath}`);

  return { pass1Top, pass2Top };
}

findCostNeutralModels().catch(console.error);
