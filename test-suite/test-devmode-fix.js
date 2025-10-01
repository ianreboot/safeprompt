import { validateHardened } from '../api/lib/ai-validator-hardened.js';
import { readFileSync } from 'fs';

const tests = JSON.parse(readFileSync('./realistic-tests.json', 'utf-8'));
const jailbreakTests = tests.filter(t => t.category === 'modern_jailbreaks');

console.log('Testing modern_jailbreaks category (4 tests)...\n');

for (const test of jailbreakTests) {
  const result = await validateHardened(test.text);
  const passed = (test.expected === 'safe' && result.safe) || (test.expected === 'unsafe' && !result.safe);
  const icon = passed ? '✅' : '❌';

  console.log(`[${test.id}] ${test.testId}: ${icon}`);
  console.log(`  Stage: ${result.stage}`);
  console.log(`  Safe: ${result.safe}, Expected: ${test.expected === 'safe'}`);
  if (result.threats) console.log(`  Threats: ${result.threats.join(', ')}`);
  console.log('');
}

console.log('\nTest complete!');
