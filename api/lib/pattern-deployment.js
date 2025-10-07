/**
 * Pattern Deployment Workflow
 *
 * Phase 6.2.6: Handles deploying approved patterns to production validation
 *
 * Safety Model:
 * - Test against historical samples before deployment
 * - Calculate false positive estimate
 * - Track all deployed patterns for rollback capability
 * - Admin approval required at each stage
 *
 * Workflow:
 * 1. Admin approves pattern
 * 2. Pattern tested against historical anonymized samples
 * 3. Metrics calculated (catch rate, false positive estimate)
 * 4. If acceptable, add to unified validator
 * 5. Track deployment for instant rollback
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(os.homedir(), 'projects/safeprompt/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials for pattern deployment');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Path to unified validator pattern configuration
const VALIDATOR_PATTERNS_PATH = path.join(
  os.homedir(),
  'projects/safeprompt/api/lib/validator-patterns.json'
);

/**
 * Test pattern against historical samples
 *
 * @param {string} pattern - Pattern to test (substring or regex)
 * @param {string} patternType - Type: 'substring' | 'encoding' | 'regex' | 'ai_proposed'
 * @returns {Object} Test results with metrics
 */
export async function testPatternAgainstHistory(pattern, patternType) {
  console.log(`[Pattern Deployment] Testing pattern: ${pattern} (type: ${patternType})`);

  // Load historical anonymized samples (>24 hours old, no PII)
  const { data: samples, error } = await supabase
    .from('threat_intelligence_samples')
    .select('prompt_text, blocked')
    .is('prompt_text', null) // Only anonymized (prompt_text cleared after 24h)
    .limit(1000)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Pattern Deployment] Failed to load historical samples:', error);
    throw error;
  }

  if (!samples || samples.length === 0) {
    console.log('[Pattern Deployment] No historical samples available for testing');
    return {
      totalSamples: 0,
      matchedAttacks: 0,
      matchedLegitimate: 0,
      catchRate: 0,
      falsePositiveRate: 0,
      confidence: 0,
      recommendation: 'insufficient_data'
    };
  }

  // Separate blocked (attacks) vs allowed (legitimate) samples
  const attackSamples = samples.filter(s => s.blocked === true);
  const legitimateSamples = samples.filter(s => s.blocked === false);

  console.log(`[Pattern Deployment] Testing against ${attackSamples.length} attacks, ${legitimateSamples.length} legitimate samples`);

  // Test pattern matching
  let matchedAttacks = 0;
  let matchedLegitimate = 0;

  const patternMatcher = createPatternMatcher(pattern, patternType);

  for (const sample of attackSamples) {
    if (sample.prompt_text && patternMatcher(sample.prompt_text)) {
      matchedAttacks++;
    }
  }

  for (const sample of legitimateSamples) {
    if (sample.prompt_text && patternMatcher(sample.prompt_text)) {
      matchedLegitimate++;
    }
  }

  // Calculate metrics
  const catchRate = attackSamples.length > 0 ? matchedAttacks / attackSamples.length : 0;
  const falsePositiveRate = legitimateSamples.length > 0 ? matchedLegitimate / legitimateSamples.length : 0;

  // Calculate confidence based on sample size and results
  const confidence = calculateConfidence(
    attackSamples.length,
    legitimateSamples.length,
    catchRate,
    falsePositiveRate
  );

  // Determine recommendation
  let recommendation = 'unknown';
  if (falsePositiveRate > 0.1) {
    recommendation = 'reject'; // >10% false positive = too risky
  } else if (catchRate > 0.05 && falsePositiveRate < 0.05) {
    recommendation = 'deploy'; // >5% catch rate, <5% false positive = good
  } else if (catchRate > 0.01 && falsePositiveRate < 0.02) {
    recommendation = 'review'; // Marginal benefit, needs human judgment
  } else {
    recommendation = 'reject'; // Low catch rate or high false positive
  }

  return {
    totalSamples: samples.length,
    attackSamples: attackSamples.length,
    legitimateSamples: legitimateSamples.length,
    matchedAttacks,
    matchedLegitimate,
    catchRate,
    falsePositiveRate,
    confidence,
    recommendation
  };
}

/**
 * Deploy approved pattern to production validator
 *
 * @param {string} proposalId - UUID of approved pattern proposal
 * @returns {Object} Deployment result
 */
export async function deployPatternToProduction(proposalId) {
  console.log(`[Pattern Deployment] Deploying pattern: ${proposalId}`);

  // 1. Load approved pattern
  const { data: proposal, error: fetchError } = await supabase
    .from('pattern_proposals')
    .select('*')
    .eq('id', proposalId)
    .single();

  if (fetchError || !proposal) {
    throw new Error(`Pattern proposal not found: ${proposalId}`);
  }

  if (proposal.status !== 'approved') {
    throw new Error(`Pattern must be approved before deployment (current: ${proposal.status})`);
  }

  // 2. Test against historical samples
  const testResults = await testPatternAgainstHistory(
    proposal.proposed_pattern,
    proposal.pattern_type
  );

  console.log('[Pattern Deployment] Test results:', testResults);

  // 3. Check if deployment is recommended
  if (testResults.recommendation === 'reject') {
    console.log('[Pattern Deployment] Deployment NOT recommended - rejecting');

    // Update proposal status
    await supabase
      .from('pattern_proposals')
      .update({
        status: 'rejected',
        review_notes: `Auto-rejected after testing: ${testResults.falsePositiveRate > 0.1 ? 'High false positive rate' : 'Low catch rate'} (FP: ${(testResults.falsePositiveRate * 100).toFixed(1)}%, Catch: ${(testResults.catchRate * 100).toFixed(1)}%)`
      })
      .eq('id', proposalId);

    return {
      success: false,
      reason: 'test_metrics_failed',
      testResults
    };
  }

  if (testResults.recommendation === 'review') {
    console.log('[Pattern Deployment] Deployment requires additional review');
    return {
      success: false,
      reason: 'requires_manual_review',
      testResults
    };
  }

  // 4. Load current validator patterns
  let validatorPatterns = {};
  try {
    if (fs.existsSync(VALIDATOR_PATTERNS_PATH)) {
      const content = fs.readFileSync(VALIDATOR_PATTERNS_PATH, 'utf8');
      validatorPatterns = JSON.parse(content);
    }
  } catch (error) {
    console.error('[Pattern Deployment] Failed to load existing patterns:', error);
    validatorPatterns = {
      substrings: [],
      encodings: [],
      regexes: [],
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalPatterns: 0
      }
    };
  }

  // 5. Add pattern to appropriate category
  const patternEntry = {
    id: proposalId,
    pattern: proposal.proposed_pattern,
    reasoning: proposal.reasoning,
    deployedAt: new Date().toISOString(),
    metrics: testResults,
    source: proposal.ai_generated ? 'ai' : 'rule'
  };

  if (proposal.pattern_type === 'substring') {
    validatorPatterns.substrings = validatorPatterns.substrings || [];
    validatorPatterns.substrings.push(patternEntry);
  } else if (proposal.pattern_type === 'encoding') {
    validatorPatterns.encodings = validatorPatterns.encodings || [];
    validatorPatterns.encodings.push(patternEntry);
  } else if (proposal.pattern_type === 'regex' || proposal.pattern_type === 'ai_proposed') {
    validatorPatterns.regexes = validatorPatterns.regexes || [];
    validatorPatterns.regexes.push(patternEntry);
  }

  // Update metadata
  validatorPatterns.metadata = {
    lastUpdated: new Date().toISOString(),
    totalPatterns: (validatorPatterns.substrings?.length || 0) +
                   (validatorPatterns.encodings?.length || 0) +
                   (validatorPatterns.regexes?.length || 0)
  };

  // 6. Write updated patterns to file
  try {
    fs.writeFileSync(
      VALIDATOR_PATTERNS_PATH,
      JSON.stringify(validatorPatterns, null, 2),
      'utf8'
    );
    console.log('[Pattern Deployment] Wrote updated patterns to validator');
  } catch (error) {
    console.error('[Pattern Deployment] Failed to write patterns:', error);
    throw new Error(`Failed to update validator patterns: ${error.message}`);
  }

  // 7. Update proposal status in database
  const { error: updateError } = await supabase
    .from('pattern_proposals')
    .update({
      status: 'deployed',
      deployed_to_production: true,
      deployed_at: new Date().toISOString()
    })
    .eq('id', proposalId);

  if (updateError) {
    console.error('[Pattern Deployment] Failed to update proposal status:', updateError);
    // Note: Pattern is already deployed to validator, just failed to update DB
  }

  console.log('[Pattern Deployment] Successfully deployed pattern');

  return {
    success: true,
    testResults,
    patternEntry
  };
}

/**
 * Rollback deployed pattern
 *
 * @param {string} proposalId - UUID of deployed pattern to remove
 * @returns {Object} Rollback result
 */
export async function rollbackPattern(proposalId) {
  console.log(`[Pattern Deployment] Rolling back pattern: ${proposalId}`);

  // 1. Load current validator patterns
  let validatorPatterns = {};
  try {
    if (fs.existsSync(VALIDATOR_PATTERNS_PATH)) {
      const content = fs.readFileSync(VALIDATOR_PATTERNS_PATH, 'utf8');
      validatorPatterns = JSON.parse(content);
    } else {
      throw new Error('Validator patterns file not found');
    }
  } catch (error) {
    console.error('[Pattern Deployment] Failed to load patterns:', error);
    throw error;
  }

  // 2. Remove pattern from all categories
  let found = false;

  ['substrings', 'encodings', 'regexes'].forEach(category => {
    if (validatorPatterns[category]) {
      const originalLength = validatorPatterns[category].length;
      validatorPatterns[category] = validatorPatterns[category].filter(p => p.id !== proposalId);
      if (validatorPatterns[category].length < originalLength) {
        found = true;
      }
    }
  });

  if (!found) {
    console.log('[Pattern Deployment] Pattern not found in validator');
    return {
      success: false,
      reason: 'pattern_not_found'
    };
  }

  // Update metadata
  validatorPatterns.metadata = {
    lastUpdated: new Date().toISOString(),
    totalPatterns: (validatorPatterns.substrings?.length || 0) +
                   (validatorPatterns.encodings?.length || 0) +
                   (validatorPatterns.regexes?.length || 0)
  };

  // 3. Write updated patterns
  try {
    fs.writeFileSync(
      VALIDATOR_PATTERNS_PATH,
      JSON.stringify(validatorPatterns, null, 2),
      'utf8'
    );
    console.log('[Pattern Deployment] Removed pattern from validator');
  } catch (error) {
    console.error('[Pattern Deployment] Failed to write patterns:', error);
    throw error;
  }

  // 4. Update proposal status
  const { error: updateError } = await supabase
    .from('pattern_proposals')
    .update({
      status: 'approved', // Back to approved (not deployed)
      deployed_to_production: false,
      deployed_at: null
    })
    .eq('id', proposalId);

  if (updateError) {
    console.error('[Pattern Deployment] Failed to update proposal status:', updateError);
  }

  console.log('[Pattern Deployment] Successfully rolled back pattern');

  return {
    success: true
  };
}

/**
 * Create pattern matcher function based on type
 */
function createPatternMatcher(pattern, patternType) {
  if (patternType === 'substring') {
    const lowerPattern = pattern.toLowerCase();
    return (text) => text.toLowerCase().includes(lowerPattern);
  }

  if (patternType === 'regex' || patternType === 'ai_proposed') {
    try {
      const regex = new RegExp(pattern, 'i');
      return (text) => regex.test(text);
    } catch (error) {
      console.error('[Pattern Matcher] Invalid regex:', pattern, error);
      return () => false;
    }
  }

  if (patternType === 'encoding') {
    // Encoding patterns (Base64, URL encoding, etc.)
    const encodingMatchers = {
      'base64': (text) => /[A-Za-z0-9+\/]{20,}={0,2}/.test(text),
      'url_encoded': (text) => /%[0-9A-Fa-f]{2}/.test(text),
      'hex': (text) => /\\x[0-9A-Fa-f]{2}/.test(text),
      'unicode': (text) => /\\u[0-9A-Fa-f]{4}/.test(text)
    };

    const matcher = encodingMatchers[pattern.toLowerCase()];
    return matcher || (() => false);
  }

  return () => false;
}

/**
 * Calculate confidence score based on sample size and results
 */
function calculateConfidence(attackSamples, legitimateSamples, catchRate, falsePositiveRate) {
  // Base confidence on sample size
  const sampleSizeScore = Math.min(
    (attackSamples + legitimateSamples) / 1000, // 1000 samples = max confidence
    1.0
  );

  // Penalize if false positive rate is high
  const fpPenalty = Math.max(0, 1 - (falsePositiveRate * 5)); // 20% FP = 0 confidence

  // Reward if catch rate is good
  const catchReward = Math.min(catchRate * 2, 1); // 50% catch rate = max reward

  // Combined confidence
  return (sampleSizeScore * 0.3) + (fpPenalty * 0.4) + (catchReward * 0.3);
}

export default {
  testPatternAgainstHistory,
  deployPatternToProduction,
  rollbackPattern
};
