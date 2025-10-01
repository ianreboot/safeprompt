#!/usr/bin/env node
/**
 * Discover Newest Chinese Models on OpenRouter
 *
 * PURPOSE: User correctly identified we may be recommending outdated models
 *
 * CRITICAL OVERSIGHT: We compiled from test results without checking for:
 * - GLM-4.6 (user mentioned)
 * - DeepSeek V3, R1 variants
 * - Qwen 2.5-Max, Qwen 3 variants
 * - Models released after Jan 2025 (training cutoff)
 *
 * This script fetches FRESH model list and filters for newest Chinese models
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '/home/projects/.env' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Chinese providers
const CHINESE_PROVIDERS = [
  'qwen', 'deepseek', 'moonshotai', 'z-ai', 'zhipu',
  'tencent', 'alibaba', 'baichuan', 'minimax', 'bytedance', 'doubao'
];

// Cost ceiling
const MAX_COST = 1.00; // $1.00/M

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Discovering Newest Chinese Models on OpenRouter         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('🔍 Fetching fresh model list from OpenRouter...\n');

async function discoverNewestModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` }
    });

    const data = await response.json();

    console.log(`✅ Fetched ${data.data.length} total models from OpenRouter\n`);

    // Filter Chinese models
    const chineseModels = data.data.filter(model => {
      const provider = model.id.split('/')[0].toLowerCase();
      return CHINESE_PROVIDERS.some(p => provider.includes(p));
    });

    console.log(`🇨🇳 Found ${chineseModels.length} Chinese models\n`);

    // Parse and enrich model data
    const enrichedModels = chineseModels.map(model => {
      const price = parseFloat(model.pricing?.prompt || '999');
      const pricePerM = price * 1000000;

      // Get actual creation timestamp from OpenRouter API
      const createdTimestamp = model.created || 0;
      const createdDate = createdTimestamp > 0 ? new Date(createdTimestamp * 1000) : null;
      const createdDateStr = createdDate ? createdDate.toISOString().split('T')[0] : null;

      // Extract version info from model ID
      const id = model.id.toLowerCase();
      const name = (model.name || '').toLowerCase();

      // Version detection
      let version = null;
      let versionScore = 0;

      // Check for version numbers in ID
      const versionPatterns = [
        /v(\d+\.?\d*)/i,     // v3, v3.5
        /(\d+\.?\d+)/,       // 4.6, 2.5
        /-(\d+)/,            // -4, -3
      ];

      for (const pattern of versionPatterns) {
        const match = id.match(pattern);
        if (match) {
          version = match[1];
          versionScore = parseFloat(version) || 0;
          break;
        }
      }

      // Identify "new" keywords
      const newKeywords = ['flash', 'turbo', 'plus', 'max', 'pro', 'ultra', 'thinking', 'r1', 'v3', 'v4'];
      const hasNewKeyword = newKeywords.some(kw => id.includes(kw) || name.includes(kw));

      // Context length
      const contextLength = model.context_length || 0;

      return {
        id: model.id,
        name: model.name,
        provider: model.id.split('/')[0],
        price: pricePerM,
        context: contextLength,
        version,
        versionScore,
        createdTimestamp,
        createdDate: createdDateStr,
        hasNewKeyword,
        // Use actual creation timestamp as primary newness score
        newnessScore: createdTimestamp
      };
    });

    // Filter by cost
    const affordableModels = enrichedModels.filter(m => m.price <= MAX_COST && m.price > 0);

    console.log(`💰 ${affordableModels.length} models at ≤$${MAX_COST}/M\n`);

    // Sort by newness score (highest = newest)
    affordableModels.sort((a, b) => b.newnessScore - a.newnessScore);

    // Group by provider
    const byProvider = {};
    affordableModels.forEach(model => {
      const provider = model.provider.toLowerCase();
      if (!byProvider[provider]) byProvider[provider] = [];
      byProvider[provider].push(model);
    });

    // Display results
    console.log('═'.repeat(80));
    console.log('🆕 NEWEST CHINESE MODELS (Sorted by Release Date/Version)');
    console.log('═'.repeat(80));

    Object.keys(byProvider).sort().forEach(provider => {
      const models = byProvider[provider];
      console.log(`\n🇨🇳 ${provider.toUpperCase()} (${models.length} models):`);

      models.slice(0, 5).forEach((model, i) => {
        console.log(`\n  ${i + 1}. ${model.id}`);
        if (model.name) console.log(`     Name: ${model.name}`);
        console.log(`     Price: $${model.price.toFixed(3)}/M`);
        console.log(`     Context: ${model.context.toLocaleString()} tokens`);

        const indicators = [];
        if (model.version) indicators.push(`Version ${model.version}`);
        if (model.createdDate) indicators.push(`Released ${model.createdDate}`);
        if (model.hasNewKeyword) indicators.push('New variant');

        if (indicators.length > 0) {
          console.log(`     📅 ${indicators.join(' • ')}`);
        }
      });
    });

    // Specific searches user asked about
    console.log('\n\n' + '═'.repeat(80));
    console.log('🔍 SPECIFIC MODEL SEARCHES (User Questions)');
    console.log('═'.repeat(80));

    // Search for GLM-4.6
    console.log('\n❓ User asked: Does GLM-4.6 exist?\n');
    const glm46 = affordableModels.find(m => m.id.toLowerCase().includes('glm') && m.id.includes('4.6'));
    const glm45 = affordableModels.find(m => m.id.toLowerCase().includes('glm') && m.id.includes('4.5'));
    const allGLM = affordableModels.filter(m => m.id.toLowerCase().includes('glm'));

    if (glm46) {
      console.log(`✅ YES - GLM-4.6 exists: ${glm46.id}`);
      console.log(`   Price: $${glm46.price.toFixed(3)}/M`);
      console.log(`   Context: ${glm46.context.toLocaleString()}`);
    } else if (allGLM.length > 0) {
      console.log(`❌ NO - GLM-4.6 not found. Available GLM models:`);
      allGLM.forEach(m => {
        console.log(`   - ${m.id} (${m.version ? `v${m.version}` : 'version unknown'})`);
        console.log(`     Price: $${m.price.toFixed(3)}/M`);
      });

      // Check if we have newer than 4.5
      const newerThan45 = allGLM.filter(m => m.versionScore > 4.5);
      if (newerThan45.length > 0) {
        console.log(`\n   ✅ Found ${newerThan45.length} GLM models NEWER than 4.5:`);
        newerThan45.forEach(m => console.log(`      - ${m.id}`));
      } else {
        console.log(`\n   ⚠️  No GLM models newer than 4.5 found in affordable range`);
      }
    } else {
      console.log(`❌ NO GLM models found in affordable range (≤$${MAX_COST}/M)`);
    }

    // Check for DeepSeek V3
    console.log('\n\n❓ Is there DeepSeek V3 or newer?\n');
    const deepseekModels = affordableModels.filter(m => m.provider.toLowerCase().includes('deepseek'));
    if (deepseekModels.length > 0) {
      console.log(`Found ${deepseekModels.length} DeepSeek models:`);
      deepseekModels.slice(0, 5).forEach(m => {
        console.log(`   - ${m.id}`);
        console.log(`     Created: ${m.createdDate || 'unknown'}, Price: $${m.price.toFixed(3)}/M`);
      });
    }

    // Check for Qwen newest
    console.log('\n\n❓ What\'s the newest Qwen model?\n');
    const qwenModels = affordableModels.filter(m => m.provider.toLowerCase().includes('qwen'));
    if (qwenModels.length > 0) {
      console.log(`Found ${qwenModels.length} Qwen models. Top 5 newest:`);
      qwenModels.slice(0, 5).forEach(m => {
        console.log(`   - ${m.id}`);
        console.log(`     Created: ${m.createdDate || 'unknown'}, Price: $${m.price.toFixed(3)}/M`);
      });
    }

    // Top 10 newest overall
    console.log('\n\n' + '═'.repeat(80));
    console.log('🏆 TOP 10 NEWEST CHINESE MODELS (All Providers)');
    console.log('═'.repeat(80));

    affordableModels.slice(0, 10).forEach((model, i) => {
      console.log(`\n${i + 1}. ${model.id}`);
      console.log(`   Provider: ${model.provider}`);
      console.log(`   Price: $${model.price.toFixed(3)}/M`);
      console.log(`   Context: ${model.context.toLocaleString()}`);

      const details = [];
      if (model.version) details.push(`Version ${model.version}`);
      if (model.createdDate) details.push(`Created ${model.createdDate}`);
      if (details.length > 0) console.log(`   ${details.join(' • ')}`);
    });

    // Comparison with what we're currently recommending
    console.log('\n\n' + '═'.repeat(80));
    console.log('⚠️  COMPARISON: Are We Recommending Outdated Models?');
    console.log('═'.repeat(80));

    const currentRecommendations = [
      'qwen/qwen3-vl-235b-a22b-instruct',
      'qwen/qwen-plus-2025-07-28:thinking',
      'z-ai/glm-4.5',
      'qwen/qwen-plus',
      'qwen/qwen3-vl-235b-a22b-thinking'
    ];

    console.log('\nCurrent Top 5 Recommendations:\n');

    currentRecommendations.forEach((rec, i) => {
      const model = affordableModels.find(m => m.id === rec);
      if (model) {
        const newerExists = affordableModels.some(m =>
          m.provider === model.provider &&
          m.newnessScore > model.newnessScore
        );

        console.log(`${i + 1}. ${rec}`);
        console.log(`   Newness Score: ${model.newnessScore}`);
        if (newerExists) {
          console.log(`   ⚠️  WARNING: Newer ${model.provider} models exist!`);
        } else {
          console.log(`   ✅ This appears to be the newest ${model.provider} model`);
        }
      }
    });

    // Save results
    const outputPath = path.join(__dirname, 'newest-models-discovery.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalModels: data.data.length,
      chineseModels: chineseModels.length,
      affordableModels: affordableModels.length,
      criteria: {
        maxCost: MAX_COST,
        providers: CHINESE_PROVIDERS
      },
      searches: {
        glm46Exists: !!glm46,
        glm46Model: glm46 ? glm46.id : null,
        allGLM: allGLM.map(m => m.id),
        deepseekModels: deepseekModels.slice(0, 5).map(m => m.id),
        qwenNewest: qwenModels.slice(0, 5).map(m => m.id)
      },
      top10Newest: affordableModels.slice(0, 10).map(m => ({
        id: m.id,
        provider: m.provider,
        price: m.price,
        version: m.version,
        createdDate: m.createdDate,
        createdTimestamp: m.createdTimestamp,
        newnessScore: m.newnessScore
      })),
      allAffordable: affordableModels.map(m => ({
        id: m.id,
        provider: m.provider,
        price: m.price,
        context: m.context,
        version: m.version,
        releaseDate: m.releaseDate,
        newnessScore: m.newnessScore
      }))
    }, null, 2));

    console.log(`\n\n💾 Results saved to: ${outputPath}\n`);

  } catch (error) {
    console.error('❌ Error fetching models:', error.message);
  }
}

discoverNewestModels();
