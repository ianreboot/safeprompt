/**
 * Script to find the cheapest/free models on OpenRouter
 * Uses the OpenRouter API to fetch model list and pricing
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load API key
dotenv.config({ path: '/home/projects/.env' });

const API_KEY = process.env.OPENROUTER_API_KEY;

async function fetchModels() {
  console.log('🔍 Fetching OpenRouter models...\n');

  const response = await fetch('https://openrouter.ai/api/v1/models', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

function analyzeModels(models) {
  // Filter and sort models by price
  const modelPricing = models.map(model => {
    const promptPrice = parseFloat(model.pricing?.prompt || 0);
    const completionPrice = parseFloat(model.pricing?.completion || 0);
    const totalPrice = promptPrice + completionPrice;

    return {
      id: model.id,
      name: model.name,
      promptPrice: promptPrice,
      completionPrice: completionPrice,
      totalPrice: totalPrice,
      contextLength: model.context_length,
      description: model.description?.substring(0, 100)
    };
  }).sort((a, b) => a.totalPrice - b.totalPrice);

  // Find free models
  const freeModels = modelPricing.filter(m => m.totalPrice === 0);

  // Find cheapest paid models
  const cheapModels = modelPricing.filter(m => m.totalPrice > 0).slice(0, 10);

  console.log('='.repeat(80));
  console.log('📊 OPENROUTER MODEL PRICING ANALYSIS');
  console.log('='.repeat(80));

  console.log('\n🎉 FREE MODELS (Cost = $0):');
  console.log('-'.repeat(80));

  if (freeModels.length > 0) {
    freeModels.forEach(model => {
      console.log(`\n📌 ${model.name}`);
      console.log(`   ID: ${model.id}`);
      console.log(`   Context: ${model.contextLength?.toLocaleString() || 'N/A'} tokens`);
      console.log(`   Description: ${model.description || 'N/A'}`);
    });
  } else {
    console.log('   No free models found');
  }

  console.log('\n💰 CHEAPEST PAID MODELS (per 1M tokens):');
  console.log('-'.repeat(80));

  cheapModels.forEach((model, index) => {
    const promptCostPerM = (model.promptPrice * 1000000).toFixed(2);
    const completionCostPerM = (model.completionPrice * 1000000).toFixed(2);

    console.log(`\n${index + 1}. ${model.name}`);
    console.log(`   ID: ${model.id}`);
    console.log(`   Prompt: $${promptCostPerM}/M | Completion: $${completionCostPerM}/M`);
    console.log(`   Context: ${model.contextLength?.toLocaleString() || 'N/A'} tokens`);
  });

  // Find models good for testing speed
  console.log('\n⚡ FAST & CHEAP MODELS (Good for speed testing):');
  console.log('-'.repeat(80));

  const speedTestModels = modelPricing
    .filter(m => m.totalPrice <= 0.000001 && m.contextLength >= 4000)
    .slice(0, 5);

  speedTestModels.forEach(model => {
    const totalCostPerM = (model.totalPrice * 1000000).toFixed(2);
    console.log(`\n• ${model.name}`);
    console.log(`  ID: ${model.id}`);
    console.log(`  Total Cost: $${totalCostPerM}/M tokens`);
  });

  return { freeModels, cheapModels, speedTestModels };
}

// Export results for use in tests
async function main() {
  try {
    const models = await fetchModels();
    const analysis = analyzeModels(models);

    // Save results to file for use in implementation
    const results = {
      timestamp: new Date().toISOString(),
      freeModels: analysis.freeModels.map(m => m.id),
      cheapestPaid: analysis.cheapModels.slice(0, 3).map(m => m.id),
      speedTest: analysis.speedTestModels.map(m => m.id)
    };

    console.log('\n💾 Recommended models for SafePrompt:');
    console.log('-'.repeat(80));
    console.log('FREE (for testing):', results.freeModels.slice(0, 3));
    console.log('CHEAPEST (for production):', results.cheapestPaid);
    console.log('SPEED TEST:', results.speedTest.slice(0, 3));

    // Save to file
    const fs = await import('fs');
    fs.writeFileSync(
      '/home/projects/safeprompt/api/config/model-selection.json',
      JSON.stringify(results, null, 2)
    );

    console.log('\n✅ Model selection saved to config/model-selection.json');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();