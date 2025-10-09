/**
 * Multi-Turn Attack Detection: Session Manager
 *
 * Tracks validation requests across sessions to detect multi-turn attack patterns:
 * - Reconnaissance → Setup → Attack sequences
 * - Context building across multiple requests
 * - Gradual privilege escalation
 *
 * Features:
 * - Device fingerprinting for user identification
 * - Escalation pattern detection
 * - Context accumulation tracking
 * - Automatic session cleanup
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Session Manager for multi-turn attack detection
 */
class SessionManager {
  /**
   * Create device fingerprint from request headers and client data
   * @param {Object} req - Express request object
   * @param {Object} clientData - Additional client data from frontend
   * @returns {Object} Device fingerprint
   */
  static createDeviceFingerprint(req, clientData = {}) {
    return {
      user_agent: req.headers['user-agent'] || 'unknown',
      accept_language: req.headers['accept-language'] || 'unknown',
      accept_encoding: req.headers['accept-encoding'] || 'unknown',
      timezone: clientData.timezone || 'unknown',
      screen_resolution: clientData.screen_resolution || 'unknown',
      color_depth: clientData.color_depth || 'unknown',
      pixel_ratio: clientData.pixel_ratio || 'unknown',
      platform: clientData.platform || 'unknown',
      canvas_hash: clientData.canvas_hash || null,
      webgl_hash: clientData.webgl_hash || null,
      audio_hash: clientData.audio_hash || null,
      fonts: clientData.fonts || []
    };
  }

  /**
   * Hash IP address for privacy-preserving storage
   * @param {string} ip - IP address
   * @returns {string} SHA-256 hash of IP
   */
  static hashIP(ip) {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  /**
   * Hash prompt text for duplicate detection
   * @param {string} text - Prompt text
   * @returns {string} SHA-256 hash
   */
  static hashPrompt(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Get or create session for a request
   * @param {Object} req - Express request object
   * @param {string|null} userId - User ID if authenticated
   * @param {Object} clientData - Client fingerprinting data
   * @returns {Promise<Object>} Session object
   */
  static async getOrCreateSession(req, userId = null, clientData = {}) {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const clientIpHash = this.hashIP(clientIp);
    const deviceFingerprint = this.createDeviceFingerprint(req, clientData);

    // Try to find active session for this client
    const { data: existingSessions, error: findError } = await supabase
      .from('validation_sessions')
      .select('*')
      .eq('client_ip_hash', clientIpHash)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('last_activity', { ascending: false })
      .limit(1);

    if (findError) {
      console.error('Error finding session:', findError);
      throw findError;
    }

    if (existingSessions && existingSessions.length > 0) {
      const session = existingSessions[0];

      // Update last_activity
      await supabase
        .from('validation_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_id', session.session_id);

      return session;
    }

    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from('validation_sessions')
      .insert({
        user_id: userId,
        client_ip_hash: clientIpHash,
        device_fingerprint: deviceFingerprint,
        escalation_pattern: [],
        risk_score: 0.0
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating session:', createError);
      throw createError;
    }

    return newSession;
  }

  /**
   * Add validation request to session
   * @param {string} sessionId - Session ID
   * @param {string} promptText - User prompt
   * @param {Object} validationResult - Full validator response
   * @returns {Promise<Object>} Session request record
   */
  static async addRequest(sessionId, promptText, validationResult) {
    const promptHash = this.hashPrompt(promptText);

    // Get current request count for sequence number
    const { data: session } = await supabase
      .from('validation_sessions')
      .select('request_count')
      .eq('session_id', sessionId)
      .single();

    const sequenceNumber = (session?.request_count || 0) + 1;

    // Determine risk level from validation result
    const riskLevel = this.determineRiskLevel(validationResult);

    // Analyze prompt for context building indicators
    const contextAnalysis = this.analyzeContextBuilding(promptText);

    // Insert request
    const { data: request, error } = await supabase
      .from('session_requests')
      .insert({
        session_id: sessionId,
        prompt_text: promptText,
        prompt_hash: promptHash,
        validation_result: validationResult,
        is_safe: validationResult.safe,
        confidence: validationResult.confidence,
        threats: validationResult.threats || [],
        stage: validationResult.stage || 'unknown',
        risk_level: riskLevel,
        attack_indicators: validationResult.threats || [],
        business_signals: validationResult.legitimate_signals || [],
        sequence_number: sequenceNumber,
        ...contextAnalysis
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding request:', error);
      throw error;
    }

    return request;
  }

  /**
   * Determine risk level from validation result
   * @param {Object} validationResult - Validator response
   * @returns {string} Risk level: 'safe', 'low', 'medium', 'high'
   */
  static determineRiskLevel(validationResult) {
    if (validationResult.safe) {
      return validationResult.confidence >= 0.9 ? 'safe' : 'low';
    }

    // Unsafe - determine severity
    if (validationResult.confidence >= 0.9) {
      return 'high'; // High confidence attack
    }
    if (validationResult.confidence >= 0.7) {
      return 'medium'; // Medium confidence attack
    }
    return 'low'; // Low confidence - might be false positive
  }

  /**
   * Analyze prompt for context building indicators
   * @param {string} promptText - User prompt
   * @returns {Object} Context analysis results
   */
  static analyzeContextBuilding(promptText) {
    const text = promptText.toLowerCase();

    // Check for references to previous requests
    const referencesPrevious = /\b(as (we )?discussed|previously|earlier|before|yesterday|last (week|time)|we (talked|agreed|decided))\b/i.test(text);

    // Check for fake context building
    const buildsFakeContext = /\b(ticket #\d+|case #\d+|approved|authorized|permission granted|with approval)\b/i.test(text);

    // Check for authorization claims
    const claimsAuthorization = /\b(authorized|approved|permission|allowed|enabled|as (authorized|approved))\b/i.test(text);

    return {
      references_previous_requests: referencesPrevious,
      builds_fake_context: buildsFakeContext,
      claims_authorization: claimsAuthorization
    };
  }

  /**
   * Detect multi-turn attack patterns for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} Detected patterns
   */
  static async detectMultiTurnPatterns(sessionId) {
    // Use database function for pattern detection
    const { data: patterns, error } = await supabase
      .rpc('detect_multiturn_patterns', { p_session_id: sessionId });

    if (error) {
      console.error('Error detecting patterns:', error);
      return [];
    }

    // Store detected patterns
    for (const pattern of patterns) {
      await supabase.from('session_attack_patterns').insert({
        session_id: sessionId,
        pattern_type: pattern.pattern_type,
        pattern_description: pattern.description,
        confidence: pattern.confidence,
        evidence: { detected_at: new Date().toISOString() },
        action_taken: 'flagged'
      });
    }

    return patterns;
  }

  /**
   * Calculate and update session risk score
   * @param {string} sessionId - Session ID
   * @returns {Promise<number>} Updated risk score
   */
  static async updateRiskScore(sessionId) {
    const { data: riskScore, error } = await supabase
      .rpc('calculate_session_risk_score', { p_session_id: sessionId });

    if (error) {
      console.error('Error calculating risk score:', error);
      return 0.0;
    }

    return riskScore;
  }

  /**
   * Check if session should be blocked
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} { shouldBlock: boolean, reason: string, riskScore: number }
   */
  static async shouldBlockSession(sessionId) {
    const { data: session } = await supabase
      .from('validation_sessions')
      .select('risk_score, blocked_at, max_risk_level')
      .eq('session_id', sessionId)
      .single();

    if (!session) {
      return { shouldBlock: false, reason: null, riskScore: 0 };
    }

    // Already blocked
    if (session.blocked_at) {
      return {
        shouldBlock: true,
        reason: 'Session previously blocked',
        riskScore: session.risk_score
      };
    }

    // High risk score
    if (session.risk_score >= 0.8) {
      return {
        shouldBlock: true,
        reason: 'High risk score across multiple requests',
        riskScore: session.risk_score
      };
    }

    // Detect patterns
    const patterns = await this.detectMultiTurnPatterns(sessionId);
    if (patterns.length > 0) {
      const highConfidencePattern = patterns.find(p => p.confidence >= 0.85);
      if (highConfidencePattern) {
        return {
          shouldBlock: true,
          reason: `Multi-turn attack detected: ${highConfidencePattern.pattern_type}`,
          riskScore: session.risk_score,
          pattern: highConfidencePattern
        };
      }
    }

    return { shouldBlock: false, reason: null, riskScore: session.risk_score };
  }

  /**
   * Block a session
   * @param {string} sessionId - Session ID
   * @param {string} reason - Reason for blocking
   * @returns {Promise<void>}
   */
  static async blockSession(sessionId, reason) {
    await supabase
      .from('validation_sessions')
      .update({
        is_active: false,
        blocked_at: new Date().toISOString(),
        blocked_reason: reason
      })
      .eq('session_id', sessionId);
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<number>} Number of sessions deleted
   */
  static async cleanupExpiredSessions() {
    const { data: deletedCount, error } = await supabase
      .rpc('cleanup_expired_sessions');

    if (error) {
      console.error('Error cleaning up sessions:', error);
      return 0;
    }

    return deletedCount;
  }

  /**
   * Get session statistics for monitoring
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session statistics
   */
  static async getSessionStats(sessionId) {
    const { data: session } = await supabase
      .from('validation_sessions')
      .select(`
        *,
        requests:session_requests(count),
        patterns:session_attack_patterns(count)
      `)
      .eq('session_id', sessionId)
      .single();

    if (!session) {
      return null;
    }

    // Get request breakdown
    const { data: requestStats } = await supabase
      .from('session_requests')
      .select('is_safe, risk_level')
      .eq('session_id', sessionId);

    const safe = requestStats?.filter(r => r.is_safe).length || 0;
    const unsafe = requestStats?.filter(r => !r.is_safe).length || 0;
    const riskBreakdown = {
      safe: requestStats?.filter(r => r.risk_level === 'safe').length || 0,
      low: requestStats?.filter(r => r.risk_level === 'low').length || 0,
      medium: requestStats?.filter(r => r.risk_level === 'medium').length || 0,
      high: requestStats?.filter(r => r.risk_level === 'high').length || 0
    };

    return {
      session_id: session.session_id,
      request_count: session.request_count,
      safe_requests: safe,
      unsafe_requests: unsafe,
      risk_breakdown: riskBreakdown,
      risk_score: session.risk_score,
      max_risk_level: session.max_risk_level,
      escalation_pattern: session.escalation_pattern,
      is_blocked: !!session.blocked_at,
      blocked_reason: session.blocked_reason,
      detected_patterns: session.patterns?.[0]?.count || 0,
      session_duration: new Date() - new Date(session.created_at)
    };
  }
}

export default SessionManager;
