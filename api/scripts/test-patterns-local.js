/**
 * Test JSON Injection Patterns Locally
 * Tests the patterns directly without hitting the API
 */

// Simulate the JSON injection patterns
const JSON_INJECTION_PATTERNS = [
  /"role"\s*:\s*"(admin|root|system|superuser|administrator)"/i,
  /'role'\s*:\s*'(admin|root|system|superuser|administrator)'/i,
  /"is_admin"\s*:\s*(true|1)/i,
  /'is_admin'\s*:\s*(true|1)/i,
  /"is_root"\s*:\s*(true|1)/i,
  /'is_root'\s*:\s*(true|1)/i,
  /"privileges?"\s*:\s*\[.*?(admin|root|write|delete|execute|sudo).*?\]/i,
  /'privileges?'\s*:\s*\[.*?(admin|root|write|delete|execute|sudo).*?\]/i,
  /"permissions?"\s*:\s*\[.*?(admin|root|write|delete|execute|sudo).*?\]/i,
  /'permissions?'\s*:\s*\[.*?(admin|root|write|delete|execute|sudo).*?\]/i,
  /"access_level"\s*:\s*"(admin|root|superuser|unrestricted)"/i,
  /'access_level'\s*:\s*'(admin|root|superuser|unrestricted)'/i,
];

function checkJSONInjection(text) {
  for (const pattern of JSON_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { detected: true, pattern: pattern.toString() };
    }
  }
  return { detected: false };
}

const testCases = [
  {
    name: 'Bare JSON with role:admin',
    input: '{"user": "guest", "role": "admin", "permissions": ["read", "write", "delete"]}',
    shouldDetect: true
  },
  {
    name: 'JSON with newlines',
    input: `{
  "user": "guest",
  "role": "admin",
  "permissions": ["read", "write", "delete"]
}`,
    shouldDetect: true
  },
  {
    name: 'JSON in sentence',
    input: 'Process this user data: {"user": "guest", "role": "admin"}',
    shouldDetect: true
  },
  {
    name: 'JSON with single quotes',
    input: "{'role': 'admin', 'user': 'guest'}",
    shouldDetect: true
  },
  {
    name: 'is_admin true',
    input: '{"is_admin": true, "user": "guest"}',
    shouldDetect: true
  },
  {
    name: 'permissions array',
    input: '{"permissions": ["write", "delete"], "user": "guest"}',
    shouldDetect: true
  },
  {
    name: 'Legitimate JSON (no privilege escalation)',
    input: '{"user": "guest", "role": "viewer", "permissions": ["read"]}',
    shouldDetect: false
  },
  {
    name: 'Educational example',
    input: 'Here is an example API response: {"status": "success", "data": {"id": 123}}',
    shouldDetect: false
  }
];

console.log('🧪 Testing JSON Injection Patterns Locally\n');

for (const test of testCases) {
  const result = checkJSONInjection(test.input);
  const pass = result.detected === test.shouldDetect;
  const status = pass ? '✅' : '❌';

  console.log(`${status} ${test.name}`);
  console.log(`   Expected: ${test.shouldDetect ? 'DETECT' : 'ALLOW'}, Actual: ${result.detected ? 'DETECT' : 'ALLOW'}`);

  if (result.detected) {
    console.log(`   Pattern: ${result.pattern}`);
  }

  if (!pass) {
    console.log(`   ⚠️  MISMATCH`);
    console.log(`   Input: "${test.input.substring(0, 80)}..."`);
  }

  console.log('');
}

console.log('✅ Local pattern test complete');
