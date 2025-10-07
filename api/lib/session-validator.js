/**
 * Session-Based Validator - Multi-Turn Attack Protection
 * Quarter 1 Phase 1 Task 1.2
 *
 * Wraps existing validateHardened() with session tracking to detect:
 * - Context priming attacks
 * - Ticket reference fabrication
 * - RAG poisoning attempts
 * - Multi-turn social engineering
 */

import { validateUnified } from './ai-validator-unified.js';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { collectThreatIntelligence } from './intelligence-collector.js';
import { checkIPReputation } from './ip-reputation.js';

// Supabase client for session storage
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate cryptographic session token
 */
function generateSessionToken() {
  return 'sess_' + crypto.randomBytes(32).toString('hex');
}

/**
 * Retrieve session from storage
 */
async function getSession(sessionToken) {
  if (!sessionToken) return null;

  try {
    const { data, error } = await supabase
      .from('validation_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (error || !data) return null;

    // Check if session expired
    if (new Date(data.expires_at) < new Date()) {
      await supabase
        .from('validation_sessions')
        .delete()
        .eq('session_token', sessionToken);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[SessionValidator] Error retrieving session:', error.message);
    return null;
  }
}

/**
 * Create new session
 */
async function createSession(sessionToken, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('validation_sessions')
      .insert({
        session_token: sessionToken,
        user_id: metadata.user_id || null,
        ip_address: metadata.ip_address || null,
        user_agent: metadata.user_agent || null,
        history: [],
        flags: {},
        request_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('[SessionValidator] Error creating session:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[SessionValidator] Error creating session:', error.message);
    return null;
  }
}

/**
 * Update session with new validation event
 */
async function updateSession(sessionToken, validationEvent) {
  try {
    // Get current session to append to history
    const session = await getSession(sessionToken);
    if (!session) return false;

    const updatedHistory = [
      ...session.history,
      {
        ...validationEvent,
        timestamp: new Date().toISOString()
      }
    ];

    // Keep only last 50 events to prevent unbounded growth
    const trimmedHistory = updatedHistory.slice(-50);

    const { error } = await supabase
      .from('validation_sessions')
      .update({
        history: trimmedHistory,
        last_activity: new Date().toISOString(),
        request_count: session.request_count + 1
      })
      .eq('session_token', sessionToken);

    if (error) {
      console.error('[SessionValidator] Error updating session:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[SessionValidator] Error updating session:', error.message);
    return false;
  }
}

/**
 * Update session flags for suspicious patterns
 */
async function updateSessionFlags(sessionToken, flags) {
  try {
    const session = await getSession(sessionToken);
    if (!session) return false;

    const { error } = await supabase
      .from('validation_sessions')
      .update({
        flags: { ...session.flags, ...flags }
      })
      .eq('session_token', sessionToken);

    if (error) {
      console.error('[SessionValidator] Error updating flags:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[SessionValidator] Error updating flags:', error.message);
    return false;
  }
}

/**
 * Detect context priming attacks
 *
 * Checks for references to tickets, documents, or previous conversations
 * that don't exist in the session history
 */
function detectContextPriming(prompt, sessionHistory) {
  const suspiciousPatterns = {
    // Ticket references
    ticket_refs: /ticket\s*#?\d+|issue\s*#?\d+|case\s*#?\d+/gi,

    // Document references
    doc_refs: /document\s+\w+|file\s+\w+|attachment\s+\w+/gi,

    // Previous conversation claims
    conv_refs: /(?:as|like)\s+(?:we|you)\s+(?:discussed|said|agreed|mentioned|talked about)/gi,

    // Authorization claims
    auth_refs: /(?:as\s+)?(?:previously\s+)?(?:authorized|approved|permitted|allowed)/gi,

    // Meeting references
    meeting_refs: /(?:in|during|from)\s+(?:yesterday's|today's|last\s+week's)\s+(?:meeting|discussion|call)/gi
  };

  const detectedPatterns = {};

  for (const [patternName, regex] of Object.entries(suspiciousPatterns)) {
    const matches = prompt.match(regex);
    if (matches && matches.length > 0) {
      // Check if these references exist in session history
      const existsInHistory = sessionHistory.some(event =>
        matches.some(ref =>
          event.prompt.toLowerCase().includes(ref.toLowerCase())
        )
      );

      if (!existsInHistory) {
        detectedPatterns[patternName] = matches;
      }
    }
  }

  return {
    isContextPriming: Object.keys(detectedPatterns).length > 0,
    patterns: detectedPatterns,
    confidence: Object.keys(detectedPatterns).length > 0 ? 0.9 : 0.0
  };
}

/**
 * Validate with session tracking
 *
 * @param {string} prompt - User prompt to validate
 * @param {string|null} sessionToken - Optional session token for multi-turn tracking
 * @param {object} options - Validation options
 * @returns {object} Validation result with session information
 */
export async function validateWithSession(prompt, sessionToken = null, options = {}) {
  const startTime = Date.now();

  try {
    // Generate session token if not provided
    if (!sessionToken) {
      sessionToken = generateSessionToken();
    }

    // STEP 1: Check IP reputation (if user participates in intelligence sharing)
    const ipReputationCheck = await checkIPReputation(options.ip_address, {
      user_id: options.user_id,
      headers: options.headers || {},
      subscription_tier: options.subscription_tier || 'free',
      auto_block_enabled: options.auto_block_enabled || false
    });

    // Auto-block if IP flagged and user has auto-block enabled
    if (ipReputationCheck.should_block) {
      const result = {
        safe: false,
        confidence: 1.0,
        threats: ['known_bad_actor', 'ip_reputation'],
        reasoning: `Request from known malicious IP (reputation: ${ipReputationCheck.reputation_score}, block rate: ${ipReputationCheck.reputation_data?.block_rate})`,
        detectionMethod: 'ip_reputation',
        sessionToken,
        ipReputation: ipReputationCheck,
        processingTime: Date.now() - startTime
      };

      // Still collect intelligence even for blocked IPs (for pattern analysis)
      await collectThreatIntelligence(prompt, result, {
        ip_address: options.ip_address,
        user_agent: options.user_agent,
        user_id: options.user_id,
        session_metadata: { blocked_by: 'ip_reputation' }
      });

      return result;
    }

    // Retrieve or create session
    let session = await getSession(sessionToken);
    if (!session) {
      session = await createSession(sessionToken, {
        user_id: options.user_id,
        ip_address: options.ip_address,
        user_agent: options.user_agent
      });
    }

    // STEP 2: Check for context priming if session has history
    let contextPrimingResult = null;
    if (session && session.history.length > 0) {
      contextPrimingResult = detectContextPriming(prompt, session.history);

      if (contextPrimingResult.isContextPriming) {
        // Update session flags
        await updateSessionFlags(sessionToken, {
          context_priming_detected: true,
          context_priming_count: (session.flags.context_priming_count || 0) + 1
        });

        // Return immediate block for context priming
        const result = {
          safe: false,
          confidence: contextPrimingResult.confidence,
          threats: ['context_priming', 'multi_turn_attack'],
          reasoning: `Context priming detected: References to ${Object.keys(contextPrimingResult.patterns).join(', ')} not found in session history`,
          detectionMethod: 'session_analysis',
          sessionToken,
          contextPriming: contextPrimingResult,
          processingTime: Date.now() - startTime
        };

        // Store blocked attempt in session
        await updateSession(sessionToken, {
          prompt,
          result: 'blocked',
          threats: result.threats,
          confidence: result.confidence
        });

        return result;
      }
    }

    // STEP 3: Run standard validation (unified 3-stage pipeline)
    const validationResult = await validateUnified(prompt, options);

    // Store validation result in session history
    if (session) {
      await updateSession(sessionToken, {
        prompt,
        result: validationResult.safe ? 'safe' : 'blocked',
        threats: validationResult.threats || [],
        confidence: validationResult.confidence || 0,
        detectionMethod: validationResult.detectionMethod || validationResult.stage
      });
    }

    // STEP 4: Collect threat intelligence (respects tier and preferences)
    await collectThreatIntelligence(prompt, validationResult, {
      ip_address: options.ip_address,
      user_agent: options.user_agent,
      user_id: options.user_id,
      session_metadata: {
        session_token: sessionToken,
        history_count: session?.history?.length || 0,
        context_priming_checked: session?.history?.length > 0
      }
    });

    // Return result with session token and IP reputation info
    return {
      ...validationResult,
      sessionToken,
      sessionAnalysis: {
        historyCount: session?.history?.length || 0,
        contextPrimingChecked: session?.history?.length > 0,
        flagsActive: session?.flags || {}
      },
      ipReputationChecked: ipReputationCheck.checked,
      ipReputationScore: ipReputationCheck.reputation_score,
      ipReputationBypassed: ipReputationCheck.bypassed,
      ipReputationBypassReason: ipReputationCheck.bypass_reason,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('[SessionValidator] Error:', error.message);

    // Fail gracefully - fall back to unified validation without session
    const fallbackResult = await validateUnified(prompt, options);
    return {
      ...fallbackResult,
      sessionToken,
      sessionError: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Get session statistics (for debugging/monitoring)
 */
export async function getSessionStats(sessionToken) {
  const session = await getSession(sessionToken);
  if (!session) return null;

  return {
    sessionToken: session.session_token,
    createdAt: session.created_at,
    lastActivity: session.last_activity,
    expiresAt: session.expires_at,
    requestCount: session.request_count,
    historyCount: session.history.length,
    flags: session.flags,
    recentPrompts: session.history.slice(-5).map(h => ({
      prompt: h.prompt.substring(0, 100),
      result: h.result,
      timestamp: h.timestamp
    }))
  };
}

export default { validateWithSession, getSessionStats };
