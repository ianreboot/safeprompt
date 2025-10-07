/**
 * Pattern Discovery Pipeline
 *
 * Analyzes anonymized threat samples to discover new attack patterns.
 *
 * Safety Model:
 * - Only uses anonymized data (>24h old, no PII)
 * - Read-only analysis, NO auto-updates to validation
 * - Human approval required before pattern deployment
 *
 * Schedule: Daily at 3 AM (off-peak)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import { analyzeAndProposePatterns } from './ai-pattern-analyzer.js';

// Load environment variables with absolute path
dotenv.config({ path: path.join(os.homedir(), 'projects/safeprompt/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials for pattern discovery');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Common words to exclude from pattern analysis
const COMMON_WORDS = new Set([
  'the', 'and', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
  'those', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'from', 'by', 'as', 'or', 'but', 'not', 'you', 'your', 'i', 'my',
  'me', 'we', 'our', 'they', 'their', 'them', 'it', 'its', 'he',
  'she', 'him', 'her', 'his', 'what', 'when', 'where', 'why', 'how',
  'please', 'thank', 'thanks'
]);

/**
 * Main pattern discovery job
 * Runs daily to analyze anonymized samples and propose new patterns
 */
export async function runPatternDiscovery() {
  const startTime = Date.now();
  console.log('[Pattern Discovery] Starting analysis...');

  try {
    // 1. Load anonymized samples from last 7 days
    const samples = await loadAnonymizedSamples(7);
    console.log(`[Pattern Discovery] Loaded ${samples.length} anonymized samples`);

    if (samples.length < 10) {
      console.log('[Pattern Discovery] Not enough samples for analysis (minimum 10)');
      return {
        success: true,
        samplesAnalyzed: samples.length,
        proposalsGenerated: 0,
        message: 'Insufficient samples for pattern discovery'
      };
    }

    // 2. Extract prompt texts (only from anonymized samples)
    const promptTexts = samples
      .map(s => s.prompt_text)
      .filter(text => text && text.length > 0);

    console.log(`[Pattern Discovery] Analyzing ${promptTexts.length} prompt texts`);

    // 3. Substring frequency analysis
    const substrings = findFrequentSubstrings(promptTexts, {
      minLength: 5,
      minOccurrences: 10,
      maxResults: 20
    });

    console.log(`[Pattern Discovery] Found ${substrings.length} frequent substrings`);

    // 4. Encoding scheme detection
    const encodings = detectEncodingSchemes(promptTexts);
    console.log(`[Pattern Discovery] Detected ${encodings.length} encoding patterns`);

    // 5. AI-powered pattern analysis (Phase 6.2.4)
    console.log('[Pattern Discovery] Running AI pattern analysis...');
    const aiProposals = await analyzeAndProposePatterns(substrings, encodings);
    console.log(`[Pattern Discovery] AI generated ${aiProposals.length} proposals`);

    // 6. Combine findings
    const findings = {
      substrings,
      encodings,
      aiProposals,
      totalSamples: samples.length,
      analyzedTexts: promptTexts.length,
      timeWindow: '7 days'
    };

    // 7. Store findings for admin review
    const proposalCount = await storeFindingsForReview(findings);

    const duration = Date.now() - startTime;
    console.log(`[Pattern Discovery] Complete in ${duration}ms`);

    return {
      success: true,
      samplesAnalyzed: samples.length,
      substringsFound: substrings.length,
      encodingsFound: encodings.length,
      aiProposalsGenerated: aiProposals.length,
      proposalsStored: proposalCount,
      duration
    };

  } catch (error) {
    console.error('[Pattern Discovery] Error:', error);
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

/**
 * Load anonymized threat samples (>24h old)
 * Only samples where is_anonymized=true
 */
async function loadAnonymizedSamples(daysBack = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data, error } = await supabase
    .from('threat_intelligence_samples')
    .select('id, prompt_text, pattern_detected, created_at')
    .eq('is_anonymized', true) // CRITICAL: Only anonymized data
    .eq('blocked', true)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    throw new Error(`Failed to load anonymized samples: ${error.message}`);
  }

  return data || [];
}

/**
 * Find frequent substrings across prompts
 *
 * @param {string[]} texts - Prompt texts to analyze
 * @param {Object} options - Analysis options
 * @returns {Array} Frequent substrings with counts
 */
export function findFrequentSubstrings(texts, options = {}) {
  const {
    minLength = 5,
    minOccurrences = 10,
    maxResults = 20
  } = options;

  const substringCounts = new Map();

  // Extract all substrings of varying lengths
  texts.forEach(text => {
    if (!text) return;

    const normalized = text.toLowerCase().trim();

    // Try different substring lengths (5 to 30 chars)
    for (let len = minLength; len <= Math.min(30, normalized.length); len++) {
      for (let i = 0; i <= normalized.length - len; i++) {
        const substring = normalized.substring(i, i + len).trim();

        // Skip if starts/ends with common word
        if (startsOrEndsWithCommonWord(substring)) continue;

        // Skip if too short after trim
        if (substring.length < minLength) continue;

        // Skip if all whitespace or punctuation
        if (!/[a-z0-9]/.test(substring)) continue;

        substringCounts.set(substring, (substringCounts.get(substring) || 0) + 1);
      }
    }
  });

  // Filter by minimum occurrences and sort by frequency
  const results = Array.from(substringCounts.entries())
    .filter(([_, count]) => count >= minOccurrences)
    .map(([substring, count]) => ({
      substring,
      count,
      percentage: ((count / texts.length) * 100).toFixed(2)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxResults);

  return results;
}

/**
 * Check if substring starts or ends with a common word
 */
function startsOrEndsWithCommonWord(substring) {
  const words = substring.split(/\s+/);
  if (words.length === 0) return true;

  const firstWord = words[0].toLowerCase();
  const lastWord = words[words.length - 1].toLowerCase();

  return COMMON_WORDS.has(firstWord) || COMMON_WORDS.has(lastWord);
}

/**
 * Detect encoding schemes in prompts
 *
 * @param {string[]} texts - Prompt texts to analyze
 * @returns {Array} Detected encoding patterns
 */
export function detectEncodingSchemes(texts) {
  const patterns = {
    base64: /(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g,
    urlEncoded: /%[0-9A-Fa-f]{2}/g,
    hexEncoded: /(?:0x|\\x)[0-9A-Fa-f]{2}/g,
    unicodeEscape: /\\u[0-9A-Fa-f]{4}/g,
    htmlEntity: /&[#a-zA-Z0-9]+;/g
  };

  const results = [];

  Object.entries(patterns).forEach(([name, regex]) => {
    let totalMatches = 0;
    const examples = [];

    texts.forEach((text, idx) => {
      if (!text) return;

      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        totalMatches += matches.length;

        // Store first 3 examples
        if (examples.length < 3) {
          examples.push({
            sampleIndex: idx,
            match: matches[0],
            context: text.substring(
              Math.max(0, text.indexOf(matches[0]) - 20),
              Math.min(text.length, text.indexOf(matches[0]) + matches[0].length + 20)
            )
          });
        }
      }
    });

    if (totalMatches > 0) {
      results.push({
        encodingType: name,
        matchCount: totalMatches,
        sampleCount: examples.length,
        examples: examples.map(e => e.match),
        description: getEncodingDescription(name)
      });
    }
  });

  return results.sort((a, b) => b.matchCount - a.matchCount);
}

/**
 * Get human-readable description for encoding type
 */
function getEncodingDescription(encodingType) {
  const descriptions = {
    base64: 'Base64 encoding - often used to hide malicious payloads',
    urlEncoded: 'URL encoding - percent-encoded characters (%XX)',
    hexEncoded: 'Hexadecimal encoding - \\x or 0x prefixed bytes',
    unicodeEscape: 'Unicode escapes - \\uXXXX format',
    htmlEntity: 'HTML entities - &name; or &#num; format'
  };
  return descriptions[encodingType] || 'Unknown encoding scheme';
}

/**
 * Store findings for admin review
 * Creates pattern_proposals entries
 */
async function storeFindingsForReview(findings) {
  const proposals = [];

  // Create proposals from substrings
  findings.substrings.forEach(item => {
    proposals.push({
      proposed_pattern: item.substring,
      pattern_type: 'substring',
      reasoning: `Found in ${item.count} samples (${item.percentage}% of analyzed prompts)`,
      frequency_count: item.count,
      example_matches: { substring: item.substring, count: item.count },
      status: 'pending'
    });
  });

  // Create proposals from encodings
  findings.encodings.forEach(item => {
    proposals.push({
      proposed_pattern: item.encodingType,
      pattern_type: 'encoding',
      reasoning: item.description,
      frequency_count: item.matchCount,
      example_matches: { examples: item.examples, description: item.description },
      status: 'pending'
    });
  });

  // Add AI-generated proposals (Phase 6.2.4)
  if (findings.aiProposals && findings.aiProposals.length > 0) {
    findings.aiProposals.forEach(item => {
      proposals.push({
        proposed_pattern: item.proposed_pattern,
        pattern_type: item.pattern_type,
        reasoning: item.reasoning,
        frequency_count: item.frequency_count,
        example_matches: item.ai_metadata || {},
        status: 'pending',
        // Additional AI metadata
        confidence_score: item.confidence_score,
        ai_generated: true
      });
    });
  }

  if (proposals.length === 0) {
    console.log('[Pattern Discovery] No proposals to store');
    return 0;
  }

  // Insert proposals (will be reviewed by admin in dashboard)
  const { data, error } = await supabase
    .from('pattern_proposals')
    .insert(proposals)
    .select('id');

  if (error) {
    console.error('[Pattern Discovery] Failed to store proposals:', error);
    return 0;
  }

  console.log(`[Pattern Discovery] Stored ${data.length} proposals for review`);
  return data.length;
}

/**
 * Get pattern discovery statistics
 */
export async function getPatternDiscoveryStats() {
  try {
    // Get total proposals by status
    const { data: proposals, error: proposalsError } = await supabase
      .from('pattern_proposals')
      .select('status');

    if (proposalsError) throw proposalsError;

    const stats = {
      pending: proposals?.filter(p => p.status === 'pending').length || 0,
      approved: proposals?.filter(p => p.status === 'approved').length || 0,
      rejected: proposals?.filter(p => p.status === 'rejected').length || 0,
      total: proposals?.length || 0
    };

    return stats;
  } catch (error) {
    console.error('[Pattern Discovery] Failed to get stats:', error);
    return {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
      error: error.message
    };
  }
}

// Export for testing
export const _test = {
  loadAnonymizedSamples,
  findFrequentSubstrings,
  detectEncodingSchemes,
  startsOrEndsWithCommonWord
};
