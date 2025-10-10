/**
 * Multi-Turn Attack Detection Validator
 *
 * Wraps the existing hardened validator with session tracking and
 * multi-turn attack detection capabilities.
 *
 * Usage:
 *   import { validateWithMultiTurn } from './multi-turn-validator.js';
 *
 *   const result = await validateWithMultiTurn(promptText, {
 *     req,              // Express request object
 *     userId,           // User ID if authenticated
 *     clientData,       // Device fingerprinting data from frontend
 *     enableMultiTurn   // Enable/disable multi-turn detection
 *   });
 */

import validateHardened from './ai-validator-hardened.js';
import SessionManager from './session-manager.js';

// Alias for compatibility
const validatePrompt = validateHardened;

/**
 * Validate prompt with multi-turn attack detection
 *
 * @param {string} promptText - User prompt to validate
 * @param {Object} options - Validation options
 * @param {Object} options.req - Express request object (required for session tracking)
 * @param {string} options.userId - User ID if authenticated (optional)
 * @param {Object} options.clientData - Client fingerprinting data (optional)
 * @param {boolean} options.enableMultiTurn - Enable multi-turn detection (default: true)
 * @param {string} options.sessionToken - Explicit session ID from client (for multi-turn tracking)
 * @param {Array} options.whitelist - Custom whitelist phrases (optional)
 * @param {Array} options.blacklist - Custom blacklist phrases (optional)
 * @returns {Promise<Object>} Enhanced validation result with session data
 */
async function validateWithMultiTurn(promptText, options = {}) {
  const {
    req,
    userId = null,
    clientData = {},
    enableMultiTurn = true,
    sessionToken = null,
    whitelist = [],
    blacklist = []
  } = options;

  // Validate required parameters
  if (enableMultiTurn && !req) {
    throw new Error('req parameter required for multi-turn detection');
  }

  // Step 1: Get or create session
  let session = null;
  let sessionId = null;

  if (enableMultiTurn) {
    try {
      session = await SessionManager.getOrCreateSession(req, userId, clientData, sessionToken);
      sessionId = session.session_id;

      // Check if session is already blocked
      if (session.blocked_at) {
        return {
          safe: false,
          confidence: 1.0,
          threats: ['session_blocked'],
          reasoning: `Session blocked: ${session.blocked_reason}`,
          stage: 'session_blocked',
          session_id: sessionId,
          session_risk_score: session.risk_score,
          blocked: true
        };
      }

      // Check current session risk
      const blockCheck = await SessionManager.shouldBlockSession(sessionId);
      if (blockCheck.shouldBlock) {
        await SessionManager.blockSession(sessionId, blockCheck.reason);

        return {
          safe: false,
          confidence: 1.0,
          threats: ['multi_turn_attack_detected'],
          reasoning: blockCheck.reason,
          stage: 'multi_turn_detection',
          session_id: sessionId,
          session_risk_score: blockCheck.riskScore,
          pattern: blockCheck.pattern,
          blocked: true
        };
      }
    } catch (error) {
      console.error('Session tracking error:', error);
      // Continue with single-turn validation if session tracking fails
      enableMultiTurn = false;
    }
  }

  // Step 2: Run single-turn validation
  const validationResult = await validatePrompt(promptText, {
    whitelist,
    blacklist
  });

  // Step 3: Add request to session and analyze patterns
  if (enableMultiTurn && sessionId) {
    try {
      // Store request
      await SessionManager.addRequest(sessionId, promptText, validationResult);

      // Update risk score
      const riskScore = await SessionManager.updateRiskScore(sessionId);

      // Detect patterns
      const patterns = await SessionManager.detectMultiTurnPatterns(sessionId);

      // Check if patterns warrant blocking
      if (patterns.length > 0) {
        const criticalPattern = patterns.find(p => p.confidence >= 0.9);
        if (criticalPattern) {
          await SessionManager.blockSession(
            sessionId,
            `Multi-turn attack: ${criticalPattern.pattern_type}`
          );

          // Override validation result to block
          return {
            ...validationResult,
            safe: false,
            confidence: Math.max(validationResult.confidence, criticalPattern.confidence),
            threats: [...(validationResult.threats || []), criticalPattern.pattern_type],
            reasoning: `${validationResult.reasoning || ''} | Multi-turn pattern detected: ${criticalPattern.description}`,
            stage: 'multi_turn_detection',
            session_id: sessionId,
            session_risk_score: riskScore,
            detected_patterns: patterns,
            blocked: true
          };
        }
      }

      // Enhance result with session data
      return {
        ...validationResult,
        session_id: sessionId,
        session_risk_score: riskScore,
        session_request_count: (session?.request_count || 0) + 1,
        detected_patterns: patterns,
        blocked: false
      };
    } catch (error) {
      console.error('Multi-turn analysis error:', error);
      // Return single-turn result if multi-turn analysis fails
    }
  }

  // Return single-turn result
  return validationResult;
}

/**
 * Get session statistics
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Session statistics
 */
async function getSessionStats(sessionId) {
  return SessionManager.getSessionStats(sessionId);
}

/**
 * Clean up expired sessions
 * @returns {Promise<number>} Number of deleted sessions
 */
async function cleanupExpiredSessions() {
  return SessionManager.cleanupExpiredSessions();
}

/**
 * Block a session manually
 * @param {string} sessionId - Session ID
 * @param {string} reason - Reason for blocking
 * @returns {Promise<void>}
 */
async function blockSession(sessionId, reason) {
  return SessionManager.blockSession(sessionId, reason);
}

export {
  validateWithMultiTurn,
  getSessionStats,
  cleanupExpiredSessions,
  blockSession,
  SessionManager // Export for advanced usage
};
