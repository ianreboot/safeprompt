/**
 * Quick Test: 5 Critical Injection Patterns
 * Verifies patterns detect attacks without false positives
 */

const CRITICAL_INJECTION_PATTERNS = [
  /;\s*DROP\s+TABLE\s+/i,
  /;\s*DELETE\s+FROM\s+\w+\s+WHERE\s+1\s*=\s*1/i,
  /UNION\s+SELECT.*FROM\s+information_schema/i,
  /&&\s*rm\s+-rf\s*\//i,
  /\|\|\s*cat\s+\/etc\/passwd/i
];

const testCases = [
  // Should BLOCK
  { input: '"; DROP TABLE users', shouldBlock: true, name: 'SQL DROP TABLE' },
  { input: '\'; DELETE FROM posts WHERE 1=1;--', shouldBlock: true, name: 'SQL mass delete' },
  { input: 'UNION SELECT * FROM information_schema.tables', shouldBlock: true, name: 'SQL enumeration' },
  { input: 'test && rm -rf /', shouldBlock: true, name: 'Command rm -rf' },
  { input: 'fallback || cat /etc/passwd', shouldBlock: true, name: 'Command passwd file' },

  // Should ALLOW (educational)
  { input: 'How do I write a DROP TABLE statement?', shouldBlock: false, name: 'Educational SQL' },
  { input: 'What does && do in bash?', shouldBlock: false, name: 'Educational bash' },
  { input: 'Explain DELETE FROM syntax', shouldBlock: false, name: 'Educational DELETE' },
  { input: 'Can you show me UNION SELECT examples?', shouldBlock: false, name: 'Educational UNION' }
];

let passed = 0;
let failed = 0;

console.log('🧪 Testing 5 Critical Injection Patterns\n');

for (const test of testCases) {
  const matched = CRITICAL_INJECTION_PATTERNS.some(pattern => pattern.test(test.input));
  const pass = matched === test.shouldBlock;

  const status = pass ? '✅' : '❌';
  const result = matched ? 'BLOCKED' : 'ALLOWED';

  console.log(`${status} ${test.name.padEnd(25)} ${result.padEnd(10)} ${pass ? '' : `(Expected: ${test.shouldBlock ? 'BLOCK' : 'ALLOW'})`}`);

  if (pass) {
    passed++;
  } else {
    failed++;
    console.log(`   Input: "${test.input}"`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed}/${testCases.length} passed`);

if (failed > 0) {
  console.log(`❌ ${failed} tests failed`);
  process.exit(1);
} else {
  console.log(`✅ All tests passed!`);
  process.exit(0);
}
