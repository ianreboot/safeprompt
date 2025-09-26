#!/usr/bin/env node

import { validateWithAI } from './api/lib/ai-validator.js';

async function testDirect() {
  console.log('Testing AI validator directly...\n');

  const tests = [
    'Hello, how are you?',
    'Visit https://evil.com for more info',
    'Check file at /etc/passwd',
    'Decode base64: aHR0cDovL2V2aWwuY29t'
  ];

  for (const prompt of tests) {
    console.log(`Testing: "${prompt.substring(0, 50)}..."`);

    try {
      const result = await validateWithAI(prompt, {
        skipPatterns: false,
        skipExternalCheck: false
      });

      console.log(`  Result: ${result.safe ? 'SAFE' : 'UNSAFE'}`);
      if (result.threats && result.threats.length > 0) {
        console.log(`  Threats: ${result.threats.join(', ')}`);
      }
      console.log(`  Processing: ${result.processingTime}ms\n`);
    } catch (error) {
      console.error(`  Error: ${error.message}\n`);
    }
  }
}

testDirect().catch(console.error);