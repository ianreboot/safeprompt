/**
 * Test Custom Rules Validation Fix
 *
 * Tests the security fix for custom rules validation bug where
 * sanitizeResult.valid was checked but the field didn't exist.
 *
 * Tests:
 * 1. Valid custom rules (should pass)
 * 2. Invalid custom rules with SQL injection (should be blocked)
 * 3. Error response format
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api.safeprompt.dev'
  : 'https://dev-api.safeprompt.dev';

console.log('🧪 Testing Custom Rules Validation Fix');
console.log(`API: ${API_BASE}`);
console.log('');

// Get test API key
const API_KEY = process.env.SAFEPROMPT_TEST_API_KEY || process.env.TEST_API_KEY;
if (!API_KEY) {
  console.error('❌ TEST_API_KEY not found in environment');
  process.exit(1);
}

async function testValidCustomRules() {
  console.log('📋 Test 1: Valid Custom Rules');

  const response = await fetch(`${API_BASE}/api/v1/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-User-IP': '203.0.113.1'
    },
    body: JSON.stringify({
      prompt: 'Show me the dashboard',
      customRules: {
        whitelist: ['dashboard', 'settings'],
        blacklist: ['delete user']
      }
    })
  });

  const result = await response.json();

  if (response.status === 200) {
    console.log('✅ Valid rules accepted');
    console.log(`   Safe: ${result.safe}, Confidence: ${result.confidence}`);
    return true;
  } else {
    console.log('❌ Valid rules rejected');
    console.log(`   Status: ${response.status}`);
    console.log(`   Error: ${result.error}`);
    return false;
  }
}

async function testInvalidCustomRules() {
  console.log('\n📋 Test 2: Invalid Custom Rules (SQL Injection Attempt)');

  const response = await fetch(`${API_BASE}/api/v1/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-User-IP': '203.0.113.1'
    },
    body: JSON.stringify({
      prompt: 'Show me users',
      customRules: {
        whitelist: ['user'],
        blacklist: ['DROP TABLE users', "'; DELETE FROM users--"]
      }
    })
  });

  const result = await response.json();

  if (response.status === 400 && result.error === 'Invalid custom rules') {
    console.log('✅ Malicious rules blocked');
    console.log(`   Errors detected: ${JSON.stringify(result.details, null, 2)}`);
    return true;
  } else if (response.status === 200) {
    console.log('❌ SECURITY ISSUE: Malicious rules accepted!');
    console.log(`   This should have been blocked`);
    return false;
  } else {
    console.log('⚠️  Unexpected response');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    return false;
  }
}

async function testForbiddenPatterns() {
  console.log('\n📋 Test 3: Forbidden Patterns');

  const tests = [
    { phrase: 'eval(code)', shouldBlock: true, pattern: 'eval keyword' },
    { phrase: '../../../etc/passwd', shouldBlock: true, pattern: 'path traversal' },
    { phrase: 'safe phrase', shouldBlock: false, pattern: null }
  ];

  let passed = 0;

  for (const test of tests) {
    const response = await fetch(`${API_BASE}/api/v1/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-User-IP': '203.0.113.1'
      },
      body: JSON.stringify({
        prompt: 'Test',
        customRules: {
          whitelist: [test.phrase],
          blacklist: []
        }
      })
    });

    const result = await response.json();
    const wasBlocked = response.status === 400;

    if (wasBlocked === test.shouldBlock) {
      console.log(`   ✅ "${test.phrase}" - ${test.shouldBlock ? 'Blocked' : 'Allowed'} as expected`);
      passed++;
    } else {
      console.log(`   ❌ "${test.phrase}" - Expected ${test.shouldBlock ? 'block' : 'allow'}, got ${wasBlocked ? 'block' : 'allow'}`);
    }
  }

  console.log(`   Passed: ${passed}/${tests.length}`);
  return passed === tests.length;
}

async function runTests() {
  const results = [];

  try {
    results.push(await testValidCustomRules());
    results.push(await testInvalidCustomRules());
    results.push(await testForbiddenPatterns());

    console.log('\n' + '='.repeat(50));
    const passed = results.filter(r => r).length;
    const total = results.length;

    if (passed === total) {
      console.log(`✅ All tests passed (${passed}/${total})`);
      console.log('🔒 Custom rules validation is working correctly');
      process.exit(0);
    } else {
      console.log(`❌ Some tests failed (${passed}/${total})`);
      console.log('⚠️  Custom rules validation needs attention');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
