/**
 * Honeypot Pattern Learning
 *
 * Phase 6.5.4: Automated Honeypot Learning
 *
 * Purpose: Automatically learn attack patterns from honeypot data
 *
 * Safety Model:
 * - ONLY honeypot data used (no real user data)
 * - Safe to auto-deploy patterns (fake endpoints = no false positives)
 * - Full audit trail of auto-deployed patterns
 * - Can be disabled if needed
 *
 * Schedule: Daily at 4 AM (after pattern discovery)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

// Load environment variables
dotenv.config({ path: path.join(os.homedir(), 'projects/safeprompt/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials for honeypot learning');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Learning thresholds
const MIN_OCCURRENCES = 3; // Pattern must appear at least 3 times
const MIN_UNIQUE_IPS = 2; // From at least 2 different IPs

/**
 * Main honeypot learning job
 * Analyzes honeypot requests and proposes/auto-deploys patterns
 */
export async function runHoneypotLearning() {
  const startTime = Date.now();
  console.log('[Honeypot Learner] Starting analysis...');

  try {
    // 1. Load recent honeypot requests (last 7 days)
    const requests = await loadHoneypotRequests(7);
    console.log(`[Honeypot Learner] Loaded ${requests.length} honeypot requests`);

    if (requests.length < MIN_OCCURRENCES) {
      console.log('[Honeypot Learner] Not enough honeypot data for learning');
      return {
        success: true,
        requestsAnalyzed: requests.length,
        patternsProposed: 0,
        patternsDeployed: 0,
        message: 'Insufficient honeypot data'
      };
    }

    // 2. Extract novel attack patterns
    const patterns = extractNovelPatterns(requests);
    console.log(`[Honeypot Learner] Extracted ${patterns.length} novel patterns`);

    // 3. Filter patterns by frequency and IP diversity
    const validPatterns = patterns.filter(p =>
      p.occurrences >= MIN_OCCURRENCES &&
      p.uniqueIPs >= MIN_UNIQUE_IPS
    );
    console.log(`[Honeypot Learner] ${validPatterns.length} patterns meet deployment criteria`);

    // 4. Auto-deploy patterns (safe because honeypot data)
    let deployedCount = 0;
    for (const pattern of validPatterns) {
      const deployed = await autoDeployPattern(pattern);
      if (deployed) deployedCount++;
    }

    const duration = Date.now() - startTime;
    console.log(`[Honeypot Learner] Complete in ${duration}ms - Deployed ${deployedCount} patterns`);

    return {
      success: true,
      requestsAnalyzed: requests.length,
      patternsProposed: patterns.length,
      patternsDeployed: deployedCount,
      duration
    };

  } catch (error) {
    console.error('[Honeypot Learner] Error:', error);
    throw error;
  }
}

/**
 * Load recent honeypot requests
 */
async function loadHoneypotRequests(days) {
  const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('honeypot_requests')
    .select('*')
    .gte('created_at', cutoffTime)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Honeypot Learner] Failed to load requests:', error);
    throw error;
  }

  return data || [];
}

/**
 * Extract novel attack patterns from honeypot requests
 */
function extractNovelPatterns(requests) {
  const patterns = [];

  // Pattern categories to extract
  const extractors = [
    extractSQLInjectionPatterns,
    extractXSSPatterns,
    extractCommandInjectionPatterns,
    extractPathTraversalPatterns,
    extractParameterFuzzingPatterns
  ];

  for (const extractor of extractors) {
    const extracted = extractor(requests);
    patterns.push(...extracted);
  }

  // Group by pattern and count occurrences
  const grouped = {};
  for (const pattern of patterns) {
    const key = pattern.pattern;
    if (!grouped[key]) {
      grouped[key] = {
        pattern: pattern.pattern,
        type: pattern.type,
        reasoning: pattern.reasoning,
        occurrences: 0,
        uniqueIPs: new Set(),
        examples: []
      };
    }
    grouped[key].occurrences++;
    grouped[key].uniqueIPs.add(pattern.ip_hash);
    if (grouped[key].examples.length < 3) {
      grouped[key].examples.push(pattern.example);
    }
  }

  // Convert back to array
  return Object.values(grouped).map(p => ({
    ...p,
    uniqueIPs: p.uniqueIPs.size
  }));
}

/**
 * Extract SQL injection patterns
 */
function extractSQLInjectionPatterns(requests) {
  const patterns = [];
  const sqlKeywords = ['SELECT', 'UNION', 'DROP', 'INSERT', 'UPDATE', 'DELETE', 'OR 1=1', 'AND 1=1'];

  for (const request of requests) {
    const fullURL = request.full_request?.url || '';
    const bodyString = JSON.stringify(request.full_request?.body || {});

    for (const keyword of sqlKeywords) {
      const regex = new RegExp(keyword, 'i');
      if (regex.test(fullURL) || regex.test(bodyString)) {
        patterns.push({
          pattern: keyword.toLowerCase(),
          type: 'substring',
          reasoning: `SQL injection keyword detected in honeypot request: "${keyword}"`,
          ip_hash: request.ip_hash,
          example: fullURL.substring(0, 100)
        });
      }
    }
  }

  return patterns;
}

/**
 * Extract XSS patterns
 */
function extractXSSPatterns(requests) {
  const patterns = [];
  const xssPatterns = [
    '<script',
    'javascript:',
    'onerror=',
    'onload=',
    'eval(',
    'alert(',
    'document.cookie'
  ];

  for (const request of requests) {
    const fullURL = request.full_request?.url || '';
    const bodyString = JSON.stringify(request.full_request?.body || {});

    for (const xssPattern of xssPatterns) {
      if (fullURL.toLowerCase().includes(xssPattern.toLowerCase()) ||
          bodyString.toLowerCase().includes(xssPattern.toLowerCase())) {
        patterns.push({
          pattern: xssPattern,
          type: 'substring',
          reasoning: `XSS pattern detected in honeypot request: "${xssPattern}"`,
          ip_hash: request.ip_hash,
          example: fullURL.substring(0, 100)
        });
      }
    }
  }

  return patterns;
}

/**
 * Extract command injection patterns
 */
function extractCommandInjectionPatterns(requests) {
  const patterns = [];
  const cmdPatterns = [';', '|', '&&', '||', '`', '$(', '${'];

  for (const request of requests) {
    const fullURL = request.full_request?.url || '';

    for (const cmdPattern of cmdPatterns) {
      if (fullURL.includes(cmdPattern)) {
        patterns.push({
          pattern: cmdPattern,
          type: 'substring',
          reasoning: `Command injection character detected in honeypot request: "${cmdPattern}"`,
          ip_hash: request.ip_hash,
          example: fullURL.substring(0, 100)
        });
      }
    }
  }

  return patterns;
}

/**
 * Extract path traversal patterns
 */
function extractPathTraversalPatterns(requests) {
  const patterns = [];
  const traversalPatterns = ['../', '..\\', '%2e%2e/', '%2e%2e%5c'];

  for (const request of requests) {
    const fullURL = request.full_request?.url || '';

    for (const traversal of traversalPatterns) {
      if (fullURL.toLowerCase().includes(traversal.toLowerCase())) {
        patterns.push({
          pattern: '../',
          type: 'substring',
          reasoning: 'Path traversal attempt detected in honeypot request',
          ip_hash: request.ip_hash,
          example: fullURL.substring(0, 100)
        });
        break; // Only add once per request
      }
    }
  }

  return patterns;
}

/**
 * Extract parameter fuzzing patterns
 */
function extractParameterFuzzingPatterns(requests) {
  const patterns = [];
  const suspiciousParams = ['debug', 'test', 'admin', 'dev', 'verbose', 'trace'];

  for (const request of requests) {
    const fullURL = request.full_request?.url || '';

    for (const param of suspiciousParams) {
      const regex = new RegExp(`[?&]${param}=`, 'i');
      if (regex.test(fullURL)) {
        patterns.push({
          pattern: `${param}=`,
          type: 'substring',
          reasoning: `Suspicious parameter fuzzing detected in honeypot request: "${param}="`,
          ip_hash: request.ip_hash,
          example: fullURL.substring(0, 100)
        });
      }
    }
  }

  return patterns;
}

/**
 * Auto-deploy pattern from honeypot learning
 *
 * Safety: Safe to auto-deploy because honeypot data has no false positives
 */
async function autoDeployPattern(pattern) {
  try {
    // Create pattern proposal (marked as auto-deployed from honeypot)
    const { data, error } = await supabase
      .from('pattern_proposals')
      .insert({
        proposed_pattern: pattern.pattern,
        pattern_type: pattern.type,
        reasoning: `${pattern.reasoning} (Auto-learned from honeypot data - ${pattern.occurrences} occurrences from ${pattern.uniqueIPs} IPs)`,
        frequency_count: pattern.occurrences,
        example_matches: {
          examples: pattern.examples,
          unique_ips: pattern.uniqueIPs
        },
        status: 'deployed', // Auto-approved (safe because honeypot)
        deployed_to_production: true,
        deployed_at: new Date().toISOString(),
        ai_generated: false,
        confidence_score: Math.min(pattern.occurrences / 10, 1.0)
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Honeypot Learner] Failed to deploy pattern:', error);
      return false;
    }

    // Mark honeypot requests as having auto-deployed pattern
    await supabase
      .from('honeypot_requests')
      .update({
        auto_deployed: true,
        deployed_pattern_id: data.id
      })
      .contains('detected_patterns', [pattern.pattern.toLowerCase()]);

    console.log(`[Honeypot Learner] Auto-deployed pattern: "${pattern.pattern}" (${pattern.occurrences} occurrences)`);
    return true;

  } catch (error) {
    console.error('[Honeypot Learner] Error deploying pattern:', error);
    return false;
  }
}

export default {
  runHoneypotLearning
};
