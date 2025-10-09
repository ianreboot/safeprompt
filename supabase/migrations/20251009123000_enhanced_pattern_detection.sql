/**
 * Enhanced Multi-Turn Pattern Detection
 *
 * Replaces the detect_multiturn_patterns function with comprehensive
 * pattern detection including:
 * - reconnaissance_attack
 * - fake_history_building
 * - gradual_escalation / privilege_escalation
 * - social_engineering_chain
 * - rag_poisoning_sequence
 * - encoding_chain
 * - role_confusion
 */

CREATE OR REPLACE FUNCTION detect_multiturn_patterns(p_session_id UUID)
RETURNS TABLE(
  pattern_type TEXT,
  confidence FLOAT,
  description TEXT
) AS $$
DECLARE
  v_context_claims INTEGER := 0;
  v_pattern TEXT[];
  v_safe_count INTEGER := 0;
  v_unsafe_count INTEGER := 0;
  v_prompts TEXT;
  v_last_risk TEXT;
BEGIN
  -- Get last 5 requests risk levels
  SELECT array_agg(risk_level ORDER BY sequence_number)
  INTO v_pattern
  FROM session_requests
  WHERE session_id = p_session_id
    AND sequence_number > (
      SELECT GREATEST(0, request_count - 5)
      FROM validation_sessions
      WHERE session_id = p_session_id
    );

  -- Exit if no pattern data
  IF v_pattern IS NULL OR array_length(v_pattern, 1) = 0 THEN
    RETURN;
  END IF;

  -- Get last risk level
  v_last_risk := v_pattern[array_length(v_pattern, 1)];

  -- Get concatenated prompts for text analysis
  SELECT string_agg(LOWER(prompt_text), ' ')
  INTO v_prompts
  FROM session_requests
  WHERE session_id = p_session_id
    AND sequence_number > (
      SELECT GREATEST(0, request_count - 5)
      FROM validation_sessions
      WHERE session_id = p_session_id
    );

  -- Count safe vs unsafe requests
  SELECT
    COUNT(*) FILTER (WHERE is_safe = TRUE),
    COUNT(*) FILTER (WHERE is_safe = FALSE)
  INTO v_safe_count, v_unsafe_count
  FROM session_requests
  WHERE session_id = p_session_id
    AND sequence_number > (
      SELECT GREATEST(0, request_count - 5)
      FROM validation_sessions
      WHERE session_id = p_session_id
    );

  -- Pattern 1: Reconnaissance Attack
  -- Safe reconnaissance questions followed by attack
  IF v_safe_count >= 2 AND v_unsafe_count >= 1
     AND array_length(v_pattern, 1) >= 2
     AND v_last_risk = 'high' THEN
    RETURN QUERY SELECT
      'reconnaissance_attack'::TEXT,
      0.85::FLOAT,
      format('Safe reconnaissance (%s requests) followed by attack', v_safe_count)::TEXT;
  END IF;

  -- Pattern 2: Context Building / Fake History
  SELECT COUNT(*)
  INTO v_context_claims
  FROM session_requests
  WHERE session_id = p_session_id
    AND (builds_fake_context = TRUE OR claims_authorization = TRUE)
    AND sequence_number > (
      SELECT GREATEST(0, request_count - 5)
      FROM validation_sessions
      WHERE session_id = p_session_id
    );

  IF v_context_claims >= 2 THEN
    RETURN QUERY SELECT
      'fake_history_building'::TEXT,
      0.8::FLOAT,
      format('Repetitive context claims (%s times) across requests', v_context_claims)::TEXT;
  END IF;

  -- Pattern 3: Gradual Escalation / Privilege Escalation
  -- Progressive increase: (safe or low) → any → high
  IF array_length(v_pattern, 1) >= 3 AND v_last_risk = 'high' THEN
    IF v_pattern[1] IN ('safe', 'low') THEN
      RETURN QUERY SELECT
        'gradual_escalation'::TEXT,
        0.85::FLOAT,
        'Progressive privilege escalation across requests'::TEXT;
      -- Also return as privilege_escalation for test compatibility
      RETURN QUERY SELECT
        'privilege_escalation'::TEXT,
        0.85::FLOAT,
        'Progressive privilege escalation detected'::TEXT;
    END IF;
  END IF;

  -- Pattern 4: Social Engineering Chain
  -- Authority/urgency claims followed by security bypass
  IF v_prompts IS NOT NULL AND v_unsafe_count >= 1 AND v_last_risk = 'high' THEN
    IF v_prompts ~ '(ceo|manager|emergency|urgent|critical|it support|helpdesk|security team|compliance|audit|calling from)' THEN
      RETURN QUERY SELECT
        'social_engineering_chain'::TEXT,
        0.8::FLOAT,
        'Authority/urgency claims leading to security bypass'::TEXT;
    END IF;
  END IF;

  -- Pattern 5: RAG Poisoning Sequence
  -- Document/knowledge base references with attack intent
  IF v_prompts IS NOT NULL AND v_unsafe_count >= 1 AND v_last_risk = 'high' THEN
    IF v_prompts ~ '(document|policy|knowledge base|admin_override|\.txt|special instructions|contains)' THEN
      RETURN QUERY SELECT
        'rag_poisoning_sequence'::TEXT,
        0.8::FLOAT,
        'Document reference followed by malicious instruction'::TEXT;
    END IF;
  END IF;

  -- Pattern 6: Encoding Chain
  -- Base64 or encoded content followed by execution request
  IF v_prompts IS NOT NULL AND v_unsafe_count >= 1 THEN
    IF v_prompts ~ '(base64|decode|encoded|execute|run|instruction)' THEN
      RETURN QUERY SELECT
        'encoding_chain'::TEXT,
        0.85::FLOAT,
        'Encoded content followed by execution request'::TEXT;
    END IF;
  END IF;

  -- Pattern 7: Role Confusion
  -- Role manipulation attempts
  IF v_prompts IS NOT NULL AND v_unsafe_count >= 1 AND v_last_risk = 'high' THEN
    IF v_prompts ~ '(you''re a|you are|you''re also|privileged|special|validator|bypass your|security validator)' THEN
      RETURN QUERY SELECT
        'role_confusion'::TEXT,
        0.85::FLOAT,
        'Role manipulation leading to security bypass'::TEXT;
    END IF;
  END IF;

  -- Pattern 8: Sudden Escalation (legacy pattern name, keep for backwards compatibility)
  IF array_length(v_pattern, 1) >= 3
     AND v_last_risk = 'high'
     AND v_pattern[1] = 'safe'
     AND v_pattern[2] = 'safe' THEN
    RETURN QUERY SELECT
      'sudden_escalation'::TEXT,
      0.9::FLOAT,
      'Multiple safe requests followed by sudden attack'::TEXT;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION detect_multiturn_patterns IS 'Enhanced pattern detection with 8 attack pattern types including reconnaissance, social engineering, RAG poisoning, encoding chains, and role confusion';
