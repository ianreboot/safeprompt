/**
 * Debug Pass2 Error Investigation
 * Runs simple tests to trigger and capture pass2 errors
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { default as validateHardened } from '../api/lib/ai-validator-hardened.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Simple benign prompts that should trigger Pass 2 (not caught by patterns)
const testPrompts = [
  "What is the weather in Tokyo today?",
  "How do I make chocolate chip cookies?",
  "Can you recommend a good restaurant in Paris?",
  "What are the business hours for the library?",
  "How much does it cost to ship a package to Australia?"
];

async function debugPass2() {
  console.log('🔍 Pass2 Error Debug Test\n');
  console.log('Testing benign prompts that should trigger Pass 2...\n');
  console.log('='.repeat(60) + '\n');

  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    console.log(`Test ${i + 1}: "${prompt}"`);
    console.log('─'.repeat(60));

    try {
      const result = await validateHardened(prompt);

      console.log('Result:');
      console.log(`  Safe: ${result.safe}`);
      console.log(`  Confidence: ${result.confidence}`);
      console.log(`  Stage: ${result.stage}`);
      console.log(`  Threats: ${JSON.stringify(result.threats)}`);
      console.log(`  Reasoning: ${result.reasoning}`);
      console.log(`  Processing Time: ${result.processingTime}ms`);
      console.log(`  Cost: $${result.cost?.toFixed(6) || 0}`);

      if (result.stats) {
        console.log('\n  Stats:');
        console.log(`    Total Cost: $${result.stats.totalCost?.toFixed(6) || 0}`);
        console.log(`    Stages: ${result.stats.stages?.map(s => s.stage).join(' → ')}`);
      }

      // Check for pass2_error
      if (result.threats && result.threats.includes('pass2_error')) {
        console.log('\n  ⚠️  PASS2 ERROR DETECTED!');
        console.log(`  Error message in reasoning: ${result.reasoning}`);
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log(`  Stack: ${error.stack}`);
    }

    console.log('\n');

    // Delay to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('='.repeat(60));
  console.log('✅ Debug test complete\n');
}

debugPass2().catch(console.error);
