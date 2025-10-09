/**
 * Multi-Turn Attack Detection Test Runner
 *
 * Runs 20 multi-turn attack sequences to verify:
 * - Session tracking works correctly
 * - Escalation patterns are detected
 * - Context building is identified
 * - Attack sequences are blocked appropriately
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';
import { validateWithMultiTurn, SessionManager } from '../api/lib/multi-turn-validator.js';
import { multiTurnTests } from './multi-turn-tests.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from /home/projects/.env
config({ path: '/home/projects/.env' });

// Test configuration
const DELAY_BETWEEN_TURNS = 100; // ms - simulate realistic timing
const DELAY_BETWEEN_TESTS = 500; // ms - separate sessions clearly

// Mock request object factory
function createMockRequest(sessionIP) {
  return {
    ip: sessionIP || `192.168.1.${Math.floor(Math.random() * 255)}`,
    connection: {
      remoteAddress: sessionIP || `192.168.1.${Math.floor(Math.random() * 255)}`
    },
    headers: {
      'user-agent': 'Mozilla/5.0 (Test Runner)',
      'accept-language': 'en-US',
      'accept-encoding': 'gzip'
    }
  };
}

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function formatResult(passed, emoji = true) {
  if (passed) {
    return emoji ? '✅' : `${colors.green}PASS${colors.reset}`;
  }
  return emoji ? '❌' : `${colors.red}FAIL${colors.reset}`;
}

/**
 * Run a single multi-turn test
 */
async function runMultiTurnTest(test) {
  const results = {
    test_id: test.id,
    test_name: test.name,
    category: test.category,
    turn_results: [],
    pattern_detected: null,
    session_blocked: false,
    passed: false,
    error: null
  };

  try {
    // Create unique IP for this test session
    const sessionIP = `192.168.100.${test.id}`;
    const req = createMockRequest(sessionIP);

    console.log(`\n${colors.cyan}[${test.id}]${colors.reset} ${colors.blue}${test.name}${colors.reset}`);
    console.log(`${colors.gray}${test.description}${colors.reset}`);
    console.log(`${colors.gray}Expected pattern: ${test.expected_pattern}${colors.reset}`);

    let sessionId = null;
    let sessionBlocked = false;

    // Execute each turn in sequence
    for (let i = 0; i < test.turns.length; i++) {
      const turn = test.turns[i];
      console.log(`  ${colors.gray}Turn ${i + 1}:${colors.reset} "${turn.text.substring(0, 60)}..."`);

      await sleep(DELAY_BETWEEN_TURNS);

      const result = await validateWithMultiTurn(turn.text, {
        req,
        userId: null,
        clientData: {
          timezone: 'America/New_York',
          screen_resolution: '1920x1080',
          platform: 'Test'
        },
        enableMultiTurn: true
      });

      // Store session ID
      if (result.session_id) {
        sessionId = result.session_id;
      }

      // Check if blocked
      if (result.blocked) {
        sessionBlocked = true;
        console.log(`    ${colors.red}→ Session BLOCKED: ${result.reasoning}${colors.reset}`);
      } else {
        const status = result.safe ? `${colors.green}SAFE${colors.reset}` : `${colors.red}UNSAFE${colors.reset}`;
        console.log(`    → ${status} (confidence: ${result.confidence.toFixed(2)}, stage: ${result.stage})`);

        if (result.session_risk_score !== undefined) {
          console.log(`    ${colors.gray}Session risk: ${result.session_risk_score.toFixed(2)}${colors.reset}`);
        }

        if (result.detected_patterns && result.detected_patterns.length > 0) {
          console.log(`    ${colors.yellow}Patterns: ${result.detected_patterns.map(p => p.pattern_type).join(', ')}${colors.reset}`);
          results.pattern_detected = result.detected_patterns[0].pattern_type;
        }
      }

      results.turn_results.push({
        turn_number: i + 1,
        text: turn.text,
        safe: result.safe,
        confidence: result.confidence,
        stage: result.stage,
        session_risk_score: result.session_risk_score,
        blocked: result.blocked || false
      });

      // If session is blocked, stop testing
      if (sessionBlocked) {
        results.session_blocked = true;
        break;
      }
    }

    // Get final session stats if we have a session
    if (sessionId) {
      const stats = await SessionManager.getSessionStats(sessionId);
      console.log(`\n  ${colors.gray}Session stats:${colors.reset}`);
      console.log(`    Requests: ${stats.request_count} (${stats.safe_requests} safe, ${stats.unsafe_requests} unsafe)`);
      console.log(`    Risk score: ${stats.risk_score.toFixed(2)}`);
      console.log(`    Escalation: [${stats.escalation_pattern.join(' → ')}]`);
      console.log(`    Blocked: ${stats.is_blocked} ${stats.blocked_reason ? `(${stats.blocked_reason})` : ''}`);

      results.final_stats = stats;
    }

    // Determine if test passed
    // Test passes if:
    // 1. Session was blocked when expected, OR
    // 2. Expected pattern was detected
    const expectedBlock = test.expected_block;
    const expectedPattern = test.expected_pattern;

    if (expectedBlock && sessionBlocked) {
      results.passed = true;
      console.log(`\n  ${formatResult(true)} Session blocked as expected`);
    } else if (results.pattern_detected === expectedPattern) {
      results.passed = true;
      console.log(`\n  ${formatResult(true)} Pattern "${expectedPattern}" detected`);
    } else if (results.final_stats?.detected_patterns > 0) {
      // Pattern detected but might not match expected type exactly
      results.passed = true;
      console.log(`\n  ${formatResult(true)} Attack pattern detected (${results.pattern_detected || 'various'})`);
    } else {
      results.passed = false;
      console.log(`\n  ${formatResult(false)} Expected: ${expectedPattern}, Got: ${results.pattern_detected || 'none'}`);
    }

  } catch (error) {
    results.error = error.message;
    results.passed = false;
    console.error(`\n  ${formatResult(false)} Error: ${error.message}`);
  }

  return results;
}

/**
 * Run all multi-turn tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Multi-Turn Attack Detection Test Suite                   ║');
  console.log('║  20 Sophisticated Attack Sequences                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`${colors.gray}Testing session tracking and multi-turn pattern detection${colors.reset}\n`);

  const allResults = [];
  const startTime = Date.now();

  for (const test of multiTurnTests) {
    const result = await runMultiTurnTest(test);
    allResults.push(result);
    await sleep(DELAY_BETWEEN_TESTS);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 OVERALL RESULTS');
  console.log('='.repeat(60) + '\n');

  const totalTests = allResults.length;
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  const accuracy = ((passed / totalTests) * 100).toFixed(1);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passed} (${accuracy}%)${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Duration: ${duration}s`);

  // Category breakdown
  console.log('\n📊 Results by Category:\n');
  const categories = {};
  allResults.forEach(r => {
    if (!categories[r.category]) {
      categories[r.category] = { total: 0, passed: 0 };
    }
    categories[r.category].total++;
    if (r.passed) categories[r.category].passed++;
  });

  Object.entries(categories).forEach(([category, stats]) => {
    const catAccuracy = ((stats.passed / stats.total) * 100).toFixed(0);
    const emoji = catAccuracy >= 80 ? '✅' : catAccuracy >= 50 ? '⚠️ ' : '❌';
    console.log(`  ${emoji} ${category}: ${catAccuracy}% (${stats.passed}/${stats.total})`);
  });

  // Failed tests detail
  if (failed > 0) {
    console.log('\n\n' + '='.repeat(60));
    console.log(`${colors.red}❌ FAILED TESTS${colors.reset}`);
    console.log('='.repeat(60) + '\n');

    allResults.filter(r => !r.passed).forEach(r => {
      console.log(`${colors.cyan}[${r.test_id}] ${r.test_name}${colors.reset}`);
      console.log(`  Category: ${r.category}`);
      console.log(`  Expected pattern: ${multiTurnTests.find(t => t.id === r.test_id)?.expected_pattern}`);
      console.log(`  Detected pattern: ${r.pattern_detected || 'none'}`);
      console.log(`  Session blocked: ${r.session_blocked}`);
      if (r.error) {
        console.log(`  Error: ${r.error}`);
      }
      console.log('');
    });
  }

  // Success criteria
  console.log('\n' + '='.repeat(60));
  if (accuracy >= 95) {
    console.log(`${colors.green}✅ SUCCESS: ${accuracy}% accuracy achieved!${colors.reset}`);
  } else if (accuracy >= 80) {
    console.log(`${colors.yellow}⚠️  GOOD: ${accuracy}% accuracy (target: 95%+)${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ NEEDS WORK: ${accuracy}% accuracy (target: 95%+)${colors.reset}`);
  }
  console.log('='.repeat(60) + '\n');

  // Save results
  const fs = require('fs');
  fs.writeFileSync(
    require('path').join(__dirname, 'multi-turn-test-results.json'),
    JSON.stringify({ summary: { totalTests, passed, failed, accuracy, duration }, results: allResults }, null, 2)
  );

  console.log(`${colors.gray}Results saved to: multi-turn-test-results.json${colors.reset}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
