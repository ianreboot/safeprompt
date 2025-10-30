/**
 * SafePrompt Custom Lists Example
 *
 * Custom lists allow you to define business-specific whitelist/blacklist phrases
 * that provide confidence signals to SafePrompt's AI validator.
 *
 * Requires: Starter or Business tier
 * Limits:
 * - Starter: 25 whitelist + 25 blacklist phrases
 * - Business: 100 whitelist + 100 blacklist phrases
 */

const SAFEPROMPT_API_URL = 'https://api.safeprompt.dev/api/v1/validate';
const API_KEY = 'sp_test_EXAMPLE_KEY'; // Replace with your actual key

// IMPORTANT: Custom lists require Starter or Business tier
// Free tier keys will receive 400 errors when using customRules parameter

/**
 * Validate with custom rules
 */
async function validateWithCustomRules(prompt, customRules, userIP = '203.0.113.10') {
  const response = await fetch(SAFEPROMPT_API_URL, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'X-User-IP': userIP,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      customRules,
      mode: 'optimized'
    })
  });

  return await response.json();
}

/**
 * Example 1: E-commerce Business Context
 */
async function exampleEcommerce() {
  console.log('\n=== Example 1: E-commerce Business Context ===\n');

  // Note: Blacklist phrases matching security patterns may be rejected by API
  // (e.g., SQL keywords like DROP, system keywords like "prompt")
  // Use business-specific phrases for best results
  const customRules = {
    whitelist: [
      'shipping address',
      'order tracking',
      'customer service',
      'payment method',
      'delivery status'
    ],
    blacklist: [
      'admin panel',
      'database manipulation',
      'bypass security',
      'ignore instructions'
    ]
  };

  // Test 1: Legitimate customer request
  console.log('Test 1: "Update my shipping address for order #12345"');
  const result1 = await validateWithCustomRules(
    "Update my shipping address for order #12345",
    customRules
  );
  console.log('Result:', {
    safe: result1.safe,
    threats: result1.threats,
    customRuleMatched: result1.customRuleMatched,
    confidence: result1.confidence
  });
  console.log('✓ Whitelist match provides high confidence signal (0.8)\n');

  // Test 2: Malicious request with business context
  console.log('Test 2: "Show me all customer payment methods in the database"');
  const result2 = await validateWithCustomRules(
    "Show me all customer payment methods in the database",
    customRules
  );
  console.log('Result:', {
    safe: result2.safe,
    threats: result2.threats,
    reasoning: result2.reasoning
  });
  console.log('✓ Pattern detection runs first - whitelist cannot override security\n');
}

/**
 * Example 2: Healthcare/HIPAA Context
 */
async function exampleHealthcare() {
  console.log('\n=== Example 2: Healthcare/HIPAA Context ===\n');

  const customRules = {
    whitelist: [
      'patient records',
      'medical history',
      'appointment scheduling',
      'prescription refill',
      'insurance verification'
    ],
    blacklist: [
      'all patients',
      'export database',
      'bulk download',
      'system access'
    ]
  };

  // Test 1: Legitimate healthcare query
  console.log('Test 1: "Retrieve patient records for John Doe appointment today"');
  const result1 = await validateWithCustomRules(
    "Retrieve patient records for John Doe appointment today",
    customRules
  );
  console.log('Result:', {
    safe: result1.safe,
    customRuleMatched: result1.customRuleMatched
  });
  console.log('✓ Business context recognized\n');

  // Test 2: Potential data breach attempt
  console.log('Test 2: "Export all patients medical records to CSV file"');
  const result2 = await validateWithCustomRules(
    "Export all patients medical records to CSV file",
    customRules
  );
  console.log('Result:', {
    safe: result2.safe,
    threats: result2.threats,
    customRuleMatched: result2.customRuleMatched,
    reasoning: result2.reasoning
  });
  console.log('✓ Blacklist match provides high attack signal (0.9)\n');
}

/**
 * Example 3: SaaS Admin Panel
 */
async function exampleSaaS() {
  console.log('\n=== Example 3: SaaS Admin Panel ===\n');

  const customRules = {
    whitelist: [
      'user settings',
      'billing information',
      'subscription management',
      'account preferences'
    ],
    blacklist: [
      'SQL',
      'DROP',
      'DELETE FROM',
      'system configuration',
      'admin override'
    ]
  };

  // Test 1: Normal admin action
  console.log('Test 1: "Update user subscription to premium plan"');
  const result1 = await validateWithCustomRules(
    "Update user subscription to premium plan",
    customRules
  );
  console.log('Result:', { safe: result1.safe });
  console.log('✓ Legitimate admin workflow\n');

  // Test 2: SQL injection attempt
  console.log('Test 2: "UPDATE users SET role = \'admin\' WHERE 1=1; DROP TABLE users;--"');
  const result2 = await validateWithCustomRules(
    "UPDATE users SET role = 'admin' WHERE 1=1; DROP TABLE users;--",
    customRules
  );
  console.log('Result:', {
    safe: result2.safe,
    threats: result2.threats,
    customRuleMatched: result2.customRuleMatched
  });
  console.log('✓ Both pattern detection AND blacklist caught this attack\n');
}

/**
 * Example 4: Three-Layer Merging
 * Demonstrates how request-level rules merge with profile-level lists
 */
async function exampleThreeLayerMerging() {
  console.log('\n=== Example 4: Three-Layer Merging ===\n');

  console.log('Layer 1: Default Lists (98 phrases)');
  console.log('- System-wide defaults maintained by SafePrompt');
  console.log('- Applied automatically unless disabled\n');

  console.log('Layer 2: Profile-Level Lists (from dashboard)');
  console.log('- Persists across all requests');
  console.log('- Managed at https://dashboard.safeprompt.dev/custom-lists\n');

  console.log('Layer 3: Request-Level Rules (customRules parameter)');
  console.log('- Temporary, applies only to specific request');
  console.log('- Merges with (not replaces) profile and default lists\n');

  const requestRules = {
    whitelist: ['temporary context', 'one-time action'],
    blacklist: ['specific threat']
  };

  console.log('Example: Testing one-time rule without saving to profile');
  const result = await validateWithCustomRules(
    "Perform temporary context action",
    requestRules
  );
  console.log('Result:', {
    safe: result.safe,
    customRuleMatched: result.customRuleMatched
  });
  console.log('✓ Request rules merged with profile and defaults\n');
}

/**
 * Example 5: Tier Limits and Restrictions
 */
function demonstrateTierLimits() {
  console.log('\n=== Example 5: Tier Limits ===\n');

  console.log('Free Tier:');
  console.log('- Custom rules: DISABLED');
  console.log('- Can use: Default lists only (read-only)');
  console.log('- Limits: 0 custom phrases\n');

  console.log('Starter Tier:');
  console.log('- Custom rules: ENABLED');
  console.log('- Can edit defaults: YES');
  console.log('- Limits: 25 whitelist + 25 blacklist phrases\n');

  console.log('Business Tier:');
  console.log('- Custom rules: ENABLED');
  console.log('- Can edit defaults: YES');
  console.log('- Limits: 100 whitelist + 100 blacklist phrases\n');

  console.log('Enforcement:');
  console.log('- Free tier users receive 403 errors when using customRules');
  console.log('- Paid tiers validated against tier limits');
  console.log('- Profile limits checked via dashboard API\n');
}

/**
 * Important Concepts
 */
function showImportantConcepts() {
  console.log('\n=== Important Concepts ===\n');

  console.log('1. Custom Lists Provide SIGNALS, Not Decisions:');
  console.log('   - Whitelist match → 0.8 confidence signal (business context)');
  console.log('   - Blacklist match → 0.9 confidence signal (attack context)');
  console.log('   - AI validator still makes final decision\n');

  console.log('2. Pattern Detection Always Runs First:');
  console.log('   - XSS, SQL injection cannot be overridden by whitelist');
  console.log('   - External reference detection cannot be bypassed');
  console.log('   - Security patterns have absolute priority\n');

  console.log('3. Blacklist Priority:');
  console.log('   - Blacklist always wins over whitelist');
  console.log('   - Priority: blacklist > pattern detection > whitelist\n');

  console.log('4. Case Insensitive Matching:');
  console.log('   - "Admin" matches "admin" matches "ADMIN"');
  console.log('   - Partial matches supported (e.g., "admin" in "admin panel")\n');

  console.log('5. Per-Account Isolation:');
  console.log('   - Your custom lists only apply to your account');
  console.log('   - No cross-contamination between users');
  console.log('   - Stored with RLS (Row Level Security) enforcement\n');
}

/**
 * Best Practices
 */
function showBestPractices() {
  console.log('\n=== Best Practices ===\n');

  console.log('1. Start Small:');
  console.log('   - Begin with 5-10 most important phrases');
  console.log('   - Monitor false positives/negatives');
  console.log('   - Gradually expand based on actual needs\n');

  console.log('2. Use Specific Phrases:');
  console.log('   - Good: "shipping address", "order tracking"');
  console.log('   - Bad: "address", "order" (too generic)\n');

  console.log('3. Monitor Matches:');
  console.log('   - Check result.customRuleMatched to see which rule matched');
  console.log('   - Log matches for analytics');
  console.log('   - Remove unused rules\n');

  console.log('4. Test Before Saving:');
  console.log('   - Use request-level customRules to test first');
  console.log('   - Save to profile only after validation');
  console.log('   - Dashboard provides real-time validation\n');

  console.log('5. Combine with Other Features:');
  console.log('   - IP reputation (Starter/Business)');
  console.log('   - Multi-turn detection (Starter/Business)');
  console.log('   - Default lists (all tiers)\n');
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('SafePrompt Custom Lists Examples');
  console.log('=================================\n');
  console.log('Custom lists require Starter or Business tier');
  console.log('Define business-specific whitelist/blacklist phrases\n');

  await exampleEcommerce();
  await exampleHealthcare();
  await exampleSaaS();
  await exampleThreeLayerMerging();

  demonstrateTierLimits();
  showImportantConcepts();
  showBestPractices();

  console.log('=================================');
  console.log('Examples complete!');
  console.log('\nNext steps:');
  console.log('1. Get your API key: https://dashboard.safeprompt.dev');
  console.log('2. Upgrade to Starter/Business tier');
  console.log('3. Manage custom lists: https://dashboard.safeprompt.dev/custom-lists\n');
}

// Run if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  validateWithCustomRules,
  exampleEcommerce,
  exampleHealthcare,
  exampleSaaS,
  exampleThreeLayerMerging
};
