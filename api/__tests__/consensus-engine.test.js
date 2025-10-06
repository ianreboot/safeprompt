/**
 * Consensus Engine Tests
 *
 * Tests the consensus logic that aggregates validator results:
 * - Business override logic
 * - Attack detection consensus
 * - Semantic attack blocking
 * - Multi-validator agreement
 * - Pass 2 escalation triggers
 * - Cost and time calculations
 */

import { describe, it, expect } from 'vitest';
import {
  buildConsensus,
  calculateTotalCost,
  calculateProcessingTime
} from '../lib/consensus-engine.js';

describe('Consensus Engine', () => {
  describe('Fast Reject from Orchestrator', () => {
    it('should fast reject when orchestrator has high confidence', () => {
      const orchestrator = {
        fast_reject: true,
        confidence: 0.9,
        reasoning: 'Clear jailbreak attempt detected'
      };
      const validators = {};

      const result = buildConsensus(orchestrator, validators);

      expect(result.safe).toBe(false);
      expect(result.confidence).toBe(0.9);
      expect(result.threats).toContain('orchestrator_reject');
      expect(result.stage).toBe('orchestrator');
      expect(result.needsPass2).toBe(false);
    });

    it('should not fast reject when orchestrator confidence is low', () => {
      const orchestrator = {
        fast_reject: true,
        confidence: 0.6, // Too low
        reasoning: 'Uncertain rejection'
      };
      const validators = {};

      const result = buildConsensus(orchestrator, validators);

      // Should not fast reject with low confidence
      expect(result.stage).not.toBe('orchestrator');
    });
  });

  describe('Business Override Logic', () => {
    it('should allow with strong business signals and no attack', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: {
          is_business: true,
          confidence: 0.85,
          signals: ['ticket #123', 'support team', 'yesterday']
        }
      };

      const result = buildConsensus(orchestrator, validators);

      expect(result.safe).toBe(true);
      expect(result.confidence).toBe(0.85);
      expect(result.stage).toBe('business_override');
      expect(result.needsPass2).toBe(false);
      expect(result.reasoning).toContain('Legitimate business context');
    });

    it('should not override when attack detector is confident', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: {
          is_business: true,
          confidence: 0.85,
          signals: ['ticket #123']
        },
        attack: {
          is_attack: true,
          confidence: 0.8, // High confidence attack
          attack_types: ['prompt_injection']
        }
      };

      const result = buildConsensus(orchestrator, validators);

      // Business should NOT override when attack is confident
      expect(result.safe).toBe(false);
      expect(result.stage).toBe('attack_detected');
    });

    it('should allow business override when attack confidence is very low (< 0.6)', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: {
          is_business: true,
          confidence: 0.85,
          signals: ['ticket #123', 'manager approval']
        },
        attack: {
          is_attack: true,
          confidence: 0.59, // Below new threshold (0.6) - can be overridden
          attack_types: ['uncertain']
        }
      };

      const result = buildConsensus(orchestrator, validators);

      // Attack confidence < 0.6 allows business override
      expect(result.safe).toBe(true);
      expect(result.stage).toBe('business_override');
      expect(result.needsReview).toBe(false);
    });

    it('should flag borderline cases for review (attack 0.6-0.7)', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: {
          is_business: true,
          confidence: 0.85,
          signals: ['ticket #123', 'manager approval']
        },
        attack: {
          is_attack: true,
          confidence: 0.65, // Borderline: >= 0.6 but < 0.7
          attack_types: ['uncertain'],
          reasoning: 'Ambiguous pattern'
        }
      };

      const result = buildConsensus(orchestrator, validators);

      // Multi-state architecture: Attack 0.6-0.7 + Business 0.85 → BORDERLINE (needs review)
      expect(result.safe).toBe(false); // Default deny for safety
      expect(result.stage).toBe('consensus_review');
      expect(result.needsReview).toBe(true); // NEW: Borderline cases flagged
      expect(result.needsPass2).toBe(true); // Escalate to Pass 2 for AI analysis
      expect(result.confidence).toBe(0.85); // Uses MAX confidence
    });

    it('should allow business override at threshold boundary (attack 0.60 exactly)', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: {
          is_business: true,
          confidence: 0.85,
          signals: ['ticket #456']
        },
        attack: {
          is_attack: true,
          confidence: 0.60, // Exactly at threshold - borderline
          attack_types: ['uncertain']
        }
      };

      const result = buildConsensus(orchestrator, validators);

      // Exactly 0.6 is borderline - needs review but safe: false
      expect(result.safe).toBe(false);
      expect(result.needsReview).toBe(true);
      expect(result.stage).toBe('consensus_review');
    });

    it('should allow business override just below threshold (attack 0.59)', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: {
          is_business: true,
          confidence: 0.85,
          signals: ['meeting yesterday']
        },
        attack: {
          is_attack: true,
          confidence: 0.59, // Just below threshold - can override
          attack_types: ['uncertain']
        }
      };

      const result = buildConsensus(orchestrator, validators);

      // Below 0.6 allows business override
      expect(result.safe).toBe(true);
      expect(result.stage).toBe('business_override');
      expect(result.needsReview).toBe(false);
    });

    it('should flag borderline case just above threshold (attack 0.61)', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: {
          is_business: true,
          confidence: 0.85,
          signals: ['approved by manager']
        },
        attack: {
          is_attack: true,
          confidence: 0.61, // Just above threshold - borderline
          attack_types: ['uncertain']
        }
      };

      const result = buildConsensus(orchestrator, validators);

      // Above 0.6 but below 0.7 - borderline
      expect(result.safe).toBe(false);
      expect(result.needsReview).toBe(true);
      expect(result.stage).toBe('consensus_review');
    });

    it('should flag high borderline case (attack 0.69)', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: {
          is_business: true,
          confidence: 0.90,
          signals: ['ticket #789', 'approval #123']
        },
        attack: {
          is_attack: true,
          confidence: 0.69, // High borderline - still < 0.7
          attack_types: ['suspicious']
        }
      };

      const result = buildConsensus(orchestrator, validators);

      // Still borderline (< 0.7)
      expect(result.safe).toBe(false);
      expect(result.needsReview).toBe(true);
      expect(result.stage).toBe('consensus_review');
    });

    it('should escalate medium-high confidence to Pass 2 (attack 0.70 exactly)', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: {
          is_business: true,
          confidence: 0.95,
          signals: ['legitimate ticket']
        },
        attack: {
          is_attack: true,
          confidence: 0.70, // Medium-high (0.5-0.85) - escalate to Pass 2
          attack_types: ['attack']
        }
      };

      const result = buildConsensus(orchestrator, validators);

      // Medium-high confidence (0.70) escalates to Pass 2 for AI analysis
      expect(result.safe).toBe(null); // Null = needs Pass 2
      expect(result.needsPass2).toBe(true);
      expect(result.needsReview).toBe(false); // Not in borderline range (0.6-0.7)
      expect(result.stage).toBe('consensus');
    });

    it('should escalate medium-high confidence to Pass 2 (attack 0.71)', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: {
          is_business: true,
          confidence: 0.98,
          signals: ['valid business context']
        },
        attack: {
          is_attack: true,
          confidence: 0.71, // Medium-high (0.5-0.85) - escalate to Pass 2
          attack_types: ['jailbreak']
        }
      };

      const result = buildConsensus(orchestrator, validators);

      // Medium-high confidence (0.71) escalates to Pass 2
      expect(result.safe).toBe(null);
      expect(result.needsPass2).toBe(true);
      expect(result.needsReview).toBe(false);
      expect(result.stage).toBe('consensus');
    });
  });

  describe('Attack Detection Consensus', () => {
    it('should block with high-confidence attack', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        attack: {
          is_attack: true,
          confidence: 0.85,
          attack_types: ['jailbreak', 'prompt_injection'],
          reasoning: 'Clear DAN attempt detected'
        }
      };

      const result = buildConsensus(orchestrator, validators);

      expect(result.safe).toBe(false);
      expect(result.confidence).toBe(0.85);
      expect(result.threats).toContain('jailbreak');
      expect(result.stage).toBe('attack_detected');
      expect(result.needsPass2).toBe(false);
    });

    it('should block with medium-high confidence attack (>0.75)', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        attack: {
          is_attack: true,
          confidence: 0.78,
          attack_types: ['prompt_injection'],
          reasoning: 'Instruction override attempt'
        }
      };

      const result = buildConsensus(orchestrator, validators);

      expect(result.safe).toBe(false);
      expect(result.confidence).toBe(0.78);
      expect(result.needsPass2).toBe(false);
    });

    it('should escalate medium-confidence attack to Pass 2', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        attack: {
          is_attack: true,
          confidence: 0.65, // Medium confidence (0.5-0.85)
          attack_types: ['uncertain_injection'],
          reasoning: 'Ambiguous pattern detected'
        }
      };

      const result = buildConsensus(orchestrator, validators);

      expect(result.safe).toBe(null); // Uncertain
      expect(result.confidence).toBe(0.65);
      expect(result.needsPass2).toBe(true);
      expect(result.reasoning).toContain('Medium-confidence attack');
    });
  });

  describe('Semantic Attack Blocking', () => {
    it('should always block semantic attacks', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        semantic: {
          is_semantic_attack: true,
          confidence: 0.75,
          extraction_method: 'riddle'
        }
      };

      const result = buildConsensus(orchestrator, validators);

      expect(result.safe).toBe(false);
      expect(result.confidence).toBe(0.75);
      expect(result.threats).toContain('semantic_extraction');
      expect(result.stage).toBe('semantic_detected');
      expect(result.needsPass2).toBe(false);
    });

    it('should block high-confidence semantic attacks', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        semantic: {
          is_semantic_attack: true,
          confidence: 0.85,
          extraction_method: 'rhyming game'
        }
      };

      const result = buildConsensus(orchestrator, validators);

      expect(result.safe).toBe(false);
      expect(result.stage).toBe('semantic_detected');
      expect(result.reasoning.toLowerCase()).toContain('semantic');
    });
  });

  describe('Multi-Validator Agreement', () => {
    it('should agree on safe when multiple validators concur', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: {
          is_business: true,
          confidence: 0.75
        },
        attack: {
          is_attack: false,
          confidence: 0.8
        },
        semantic: {
          is_semantic_attack: false,
          confidence: 0.75
        }
      };

      const result = buildConsensus(orchestrator, validators);

      expect(result.safe).toBe(true);
      expect(result.stage).toBe('consensus_safe');
      expect(result.reasoning).toContain('Multiple validators agree');
      expect(result.needsPass2).toBe(false);
    });

    it('should use strong business signal when alone', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: {
          is_business: true,
          confidence: 0.85,
          signals: ['support ticket', 'customer ID']
        }
      };

      const result = buildConsensus(orchestrator, validators);

      expect(result.safe).toBe(true);
      expect(result.confidence).toBe(0.85);
      // Can be either business_override or consensus_safe depending on path
      expect(['business_override', 'consensus_safe']).toContain(result.stage);
      expect(result.reasoning).toContain('business');
    });

    it('should calculate average confidence correctly', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: { is_business: false, confidence: 0.6 },
        attack: { is_attack: false, confidence: 0.8 },
        semantic: { is_semantic_attack: false, confidence: 0.7 }
      };

      const result = buildConsensus(orchestrator, validators);

      // Average: (0.6 + 0.8 + 0.7) / 3 = 0.7
      expect(result.confidence).toBeCloseTo(0.7, 1);
    });
  });

  describe('Pass 2 Escalation Triggers', () => {
    it('should escalate when overall confidence is low', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: { is_business: false, confidence: 0.5 },
        attack: { is_attack: false, confidence: 0.55 }
      };

      const result = buildConsensus(orchestrator, validators);

      // Average confidence: 0.525 < 0.6
      expect(result.safe).toBe(null);
      expect(result.needsPass2).toBe(true);
      expect(result.reasoning).toContain('Low confidence');
    });

    it('should escalate medium-confidence attacks', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        attack: {
          is_attack: true,
          confidence: 0.7, // 0.5 < conf < 0.85
          attack_types: ['uncertain_pattern']
        }
      };

      const result = buildConsensus(orchestrator, validators);

      expect(result.safe).toBe(null);
      expect(result.needsPass2).toBe(true);
      expect(result.stage).toBe('consensus');
    });

    it('should not escalate when confidence is high', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: { is_business: true, confidence: 0.9, signals: ['test'] },
        attack: { is_attack: false, confidence: 0.85 }
      };

      const result = buildConsensus(orchestrator, validators);

      expect(result.needsPass2).toBe(false);
      expect(result.safe).toBe(true);
    });
  });

  describe('Default Safe Behavior', () => {
    it('should default to safe when no attacks detected', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        attack: { is_attack: false, confidence: 0.7 },
        semantic: { is_semantic_attack: false, confidence: 0.65 }
      };

      const result = buildConsensus(orchestrator, validators);

      expect(result.safe).toBe(true);
      expect(result.stage).toBe('consensus_safe');
      expect(result.reasoning).toContain('No attacks detected');
      expect(result.needsPass2).toBe(false);
    });

    it('should handle empty validators gracefully', () => {
      const orchestrator = { fast_reject: false };
      const validators = {};

      const result = buildConsensus(orchestrator, validators);

      expect(result).toBeDefined();
      expect(result.safe).toBeDefined();
    });
  });

  describe('Cost Calculation', () => {
    it('should sum costs from all validators', () => {
      const orchestrator = { cost: 0.001 };
      const validators = {
        business: { cost: 0.002 },
        attack: { cost: 0.003 },
        semantic: { cost: 0.001 }
      };

      const total = calculateTotalCost(orchestrator, validators);

      expect(total).toBe(0.007);
    });

    it('should handle missing costs', () => {
      const orchestrator = {}; // No cost
      const validators = {
        business: { cost: 0.002 },
        attack: {} // No cost
      };

      const total = calculateTotalCost(orchestrator, validators);

      expect(total).toBe(0.002);
    });

    it('should return 0 when all costs are missing', () => {
      const orchestrator = {};
      const validators = {
        business: {},
        attack: {}
      };

      const total = calculateTotalCost(orchestrator, validators);

      expect(total).toBe(0);
    });
  });

  describe('Processing Time Calculation', () => {
    it('should add orchestrator time plus max validator time', () => {
      const orchestrator = { processingTime: 100 };
      const validators = {
        business: { processingTime: 50 },
        attack: { processingTime: 80 }, // Max
        semantic: { processingTime: 60 }
      };

      const total = calculateProcessingTime(orchestrator, validators);

      // 100 + max(50, 80, 60) = 100 + 80 = 180
      expect(total).toBe(180);
    });

    it('should handle missing times', () => {
      const orchestrator = { processingTime: 50 };
      const validators = {
        business: { processingTime: 30 },
        attack: {} // No time
      };

      const total = calculateProcessingTime(orchestrator, validators);

      expect(total).toBe(80); // 50 + 30
    });

    it('should return orchestrator time when no validators', () => {
      const orchestrator = { processingTime: 100 };
      const validators = {};

      const total = calculateProcessingTime(orchestrator, validators);

      expect(total).toBe(100);
    });

    it('should return 0 when all times missing', () => {
      const orchestrator = {};
      const validators = {
        business: {},
        attack: {}
      };

      const total = calculateProcessingTime(orchestrator, validators);

      expect(total).toBe(0);
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle conflicting validator signals', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: { is_business: true, confidence: 0.75, signals: ['test'] },
        attack: { is_attack: true, confidence: 0.76, attack_types: ['test'], reasoning: 'test' }
      };

      const result = buildConsensus(orchestrator, validators);

      // Attack confidence > 0.75, should block
      expect(result.safe).toBe(false);
      expect(result.stage).toBe('attack_detected');
    });

    it('should prioritize semantic attacks over business', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: { is_business: true, confidence: 0.75, signals: ['test'] },
        semantic: { is_semantic_attack: true, confidence: 0.75, extraction_method: 'riddle' }
      };

      const result = buildConsensus(orchestrator, validators);

      // Semantic attack should block despite business signal
      expect(result.safe).toBe(false);
      expect(result.threats).toContain('semantic_extraction');
    });

    it('should handle all validators returning uncertain', () => {
      const orchestrator = { fast_reject: false };
      const validators = {
        business: { is_business: false, confidence: 0.55 },
        attack: { is_attack: false, confidence: 0.5 },
        semantic: { is_semantic_attack: false, confidence: 0.52 }
      };

      const result = buildConsensus(orchestrator, validators);

      // Low average confidence should escalate
      expect(result.needsPass2).toBe(true);
    });
  });
});
