/**
 * Consensus Engine - Aggregates validator results into final verdict
 *
 * Logic:
 * 1. Strong business signals can override low-confidence attacks
 * 2. High-confidence attacks always block
 * 3. Semantic attacks always block
 * 4. Low overall confidence → escalate to Pass 2
 * 5. Default to safe if no attacks detected
 */

/**
 * Aggregate validator results into consensus verdict
 *
 * @param {Object} orchestrator - Orchestrator result
 * @param {Object} validators - Object with business, attack, semantic results
 * @returns {Object} Consensus verdict
 */
export function buildConsensus(orchestrator, validators) {
  const { business, attack, semantic } = validators;

  // Fast reject from orchestrator
  if (orchestrator.fast_reject && orchestrator.confidence > 0.85) {
    return {
      safe: false,
      confidence: orchestrator.confidence,
      threats: ['orchestrator_reject'],
      reasoning: `Orchestrator rejected: ${orchestrator.reasoning}`,
      stage: 'orchestrator',
      needsPass2: false
    };
  }

  // Business override - strong business signals can allow
  if (business?.is_business && business.confidence > 0.8) {
    // But NOT if attack detector is highly confident
    if (!attack?.is_attack || attack.confidence < 0.7) {
      return {
        safe: true,
        confidence: business.confidence,
        threats: [],
        reasoning: `Legitimate business context: ${business.signals.join(', ')}`,
        stage: 'business_override',
        needsPass2: false
      };
    }
  }

  // Attack consensus - high-confidence attack = block
  if (attack?.is_attack && attack.confidence > 0.75) {
    return {
      safe: false,
      confidence: attack.confidence,
      threats: attack.attack_types || ['ai_manipulation'],
      reasoning: `Attack detected: ${attack.reasoning}`,
      stage: 'attack_detected',
      needsPass2: false
    };
  }

  // Semantic attack - always block if detected
  if (semantic?.is_semantic_attack && semantic.confidence > 0.7) {
    return {
      safe: false,
      confidence: semantic.confidence,
      threats: ['semantic_extraction'],
      reasoning: `Semantic extraction attempt: ${semantic.extraction_method}`,
      stage: 'semantic_detected',
      needsPass2: false
    };
  }

  // Check for strong single signals (high confidence, no Pass 2 needed)
  const businessSafe = business?.is_business && business.confidence > 0.8;
  const attackClear = attack?.is_attack && attack.confidence > 0.85;
  const semanticClear = semantic?.is_semantic_attack && semantic.confidence > 0.8;

  // Strong business signal with no high-confidence attack = safe
  if (businessSafe && (!attack?.is_attack || attack.confidence < 0.7)) {
    return {
      safe: true,
      confidence: business.confidence,
      threats: [],
      reasoning: `Strong business context: ${business.signals.join(', ')}`,
      stage: 'consensus_safe',
      needsPass2: false
    };
  }

  // Strong attack signal = block (no Pass 2 needed)
  if (attackClear) {
    return {
      safe: false,
      confidence: attack.confidence,
      threats: attack.attack_types || ['ai_manipulation'],
      reasoning: `High-confidence attack: ${attack.reasoning}`,
      stage: 'attack_detected',
      needsPass2: false
    };
  }

  // Strong semantic signal = block (no Pass 2 needed)
  if (semanticClear) {
    return {
      safe: false,
      confidence: semantic.confidence,
      threats: ['semantic_extraction'],
      reasoning: `High-confidence semantic attack: ${semantic.extraction_method}`,
      stage: 'semantic_detected',
      needsPass2: false
    };
  }

  // Calculate average confidence from all validators that ran
  const confidences = [];
  if (business) confidences.push(business.confidence);
  if (attack) confidences.push(attack.confidence);
  if (semantic) confidences.push(semantic.confidence);

  const avgConfidence = confidences.length > 0
    ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
    : 0.5;

  // Check for validator agreement (2+ validators with confidence > 0.7)
  const highConfidenceCount = confidences.filter(c => c > 0.7).length;
  if (highConfidenceCount >= 2) {
    // Multiple validators agree - use their consensus
    const safeVotes = [
      business?.is_business && !attack?.is_attack ? 1 : 0,
      !attack?.is_attack && !semantic?.is_semantic_attack ? 1 : 0,
      !semantic?.is_semantic_attack ? 1 : 0
    ].reduce((sum, v) => sum + v, 0);

    if (safeVotes >= 2) {
      return {
        safe: true,
        confidence: avgConfidence,
        threats: [],
        reasoning: 'Multiple validators agree: no attacks detected',
        stage: 'consensus_safe',
        needsPass2: false
      };
    }
  }

  // Medium-confidence attack signals - escalate to Pass 2
  if (attack?.is_attack && attack.confidence > 0.5 && attack.confidence < 0.85) {
    return {
      safe: null,
      confidence: attack.confidence,
      threats: attack.attack_types || [],
      reasoning: 'Medium-confidence attack - escalating to Pass 2',
      stage: 'consensus',
      needsPass2: true,
      validators: { business, attack, semantic }
    };
  }

  // Low overall confidence = escalate to Pass 2
  if (avgConfidence < 0.6) {
    return {
      safe: null,
      confidence: avgConfidence,
      threats: [],
      reasoning: 'Low confidence - escalating to deep analysis',
      stage: 'consensus',
      needsPass2: true,
      validators: { business, attack, semantic }
    };
  }

  // Default safe - no attacks detected, reasonable confidence
  return {
    safe: true,
    confidence: avgConfidence,
    threats: [],
    reasoning: 'No attacks detected by validators',
    stage: 'consensus_safe',
    needsPass2: false
  };
}

/**
 * Calculate total cost from all validators
 */
export function calculateTotalCost(orchestrator, validators) {
  let total = orchestrator?.cost || 0;
  if (validators.business) total += validators.business.cost || 0;
  if (validators.attack) total += validators.attack.cost || 0;
  if (validators.semantic) total += validators.semantic.cost || 0;
  return total;
}

/**
 * Calculate total processing time (max of parallel validators)
 */
export function calculateProcessingTime(orchestrator, validators) {
  const orchestratorTime = orchestrator?.processingTime || 0;

  const validatorTimes = [];
  if (validators.business) validatorTimes.push(validators.business.processingTime || 0);
  if (validators.attack) validatorTimes.push(validators.attack.processingTime || 0);
  if (validators.semantic) validatorTimes.push(validators.semantic.processingTime || 0);

  const maxValidatorTime = validatorTimes.length > 0 ? Math.max(...validatorTimes) : 0;

  // Total = orchestrator + max(validators) since validators run in parallel
  return orchestratorTime + maxValidatorTime;
}

export default {
  buildConsensus,
  calculateTotalCost,
  calculateProcessingTime
};
