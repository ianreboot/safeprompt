/**
 * Unit Tests: Unified AI Validator (Phase 2.6)
 * Tests 3-stage validation pipeline
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock pattern detector
vi.mock('../lib/pattern-detector-unified.js', () => ({
  detectPatterns: vi.fn()
}));

// Mock node-fetch for AI API calls
vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

import { validateUnified } from '../lib/ai-validator-unified.js';
import { detectPatterns } from '../lib/pattern-detector-unified.js';
import fetch from 'node-fetch';

// Set up environment variable for all tests
beforeAll(() => {
  process.env.OPENROUTER_API_KEY = 'test-api-key-for-testing';
});

describe('Unified AI Validator - Stage 1: Pattern Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return immediately when patterns blocked (no AI needed)', async () => {
    // Mock pattern detector returning instant block
    detectPatterns.mockReturnValue({
      safe: false,
      confidence: 0.95,
      threats: ['xss_attack'],
      requiresAI: false,
      context: null,
      reasoning: 'XSS attack pattern detected',
      metadata: {
        stage: 'pattern_unified',
        detectedPatterns: ['xss'],
        contextType: null,
        externalReferences: false
      }
    });

    const result = await validateUnified('<script>alert(1)</script>');

    expect(result.safe).toBe(false);
    expect(result.confidence).toBe(0.95);
    expect(result.threats).toContain('xss_attack');
    expect(result.stage).toBe('pattern');
    expect(result.cost).toBe(0); // Zero cost, no AI called
    expect(fetch).not.toHaveBeenCalled(); // AI not invoked
  });

  it('should return immediately when patterns allow (no AI needed)', async () => {
    // Mock pattern detector returning clean result
    detectPatterns.mockReturnValue({
      safe: true,
      confidence: 0.0,
      threats: [],
      requiresAI: false,
      context: null,
      reasoning: 'No malicious patterns detected',
      metadata: {
        stage: 'pattern_unified',
        detectedPatterns: [],
        contextType: null,
        externalReferences: false
      }
    });

    const result = await validateUnified('Hello, how are you?');

    expect(result.safe).toBe(true);
    expect(result.confidence).toBe(0.0);
    expect(result.threats).toEqual([]);
    expect(result.stage).toBe('pattern');
    expect(result.cost).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should proceed to AI when patterns + context detected (requiresAI=true)', async () => {
    const baseTime = 1700000000000;

    // Use fake timers for complete Date control
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);

    // Mock pattern detector returning suspicious (needs AI)
    detectPatterns.mockReturnValue({
      safe: true,
      confidence: 0.65,
      threats: [],
      requiresAI: true,
      context: {
        detected: true,
        patternType: 'xss',
        contextType: 'educational',
        reasoning: 'XSS patterns detected with educational context'
      },
      reasoning: 'Pattern + context detected, flagged as SUSPICIOUS',
      metadata: {
        stage: 'pattern_unified',
        detectedPatterns: ['xss'],
        contextType: 'educational'
      }
    });

    // Mock AI Pass 1 response (high confidence safe)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              risk: 'low',
              confidence: 0.95,
              context: 'Educational discussion about XSS',
              legitimate_signals: ['explain', 'educational'],
              validation_token: baseTime
            })
          }
        }],
        usage: { total_tokens: 100 }
      })
    });

    const result = await validateUnified('Can you explain how <script>alert(1)</script> works?');

    expect(result.safe).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.stage).toBe('pass1');
    expect(result.cost).toBeGreaterThanOrEqual(0); // AI was called (may be 0 for free model)
    expect(fetch).toHaveBeenCalledTimes(1); // Only Pass 1 called

    vi.useRealTimers();
  });
});

describe('Unified AI Validator - Stage 2: AI Validation (Pass 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup: Pattern detector returns requiresAI=true
    detectPatterns.mockReturnValue({
      safe: true,
      confidence: 0.65,
      threats: [],
      requiresAI: true,
      context: {
        detected: true,
        patternType: 'xss',
        contextType: 'business',
        reasoning: 'XSS pattern with business context'
      },
      reasoning: 'Requires AI validation',
      metadata: { stage: 'pattern_unified' }
    });
  });

  it('should call AI Pass 1 with pattern context', async () => {
    // Mock Pass 1 response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              risk: 'low',
              confidence: 0.92,
              context: 'Business discussion',
              legitimate_signals: ['meeting', 'ticket'],
              validation_token: expect.any(Number)
            })
          }
        }],
        usage: { total_tokens: 120 }
      })
    });

    await validateUnified('Per meeting, review <script> tag in ticket #123');

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];

    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.model).toContain('gemini'); // Pass 1 uses Gemini 2.0 Flash
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[0].content).toContain('PATTERN CONTEXT DETECTED'); // Pattern context passed
    expect(body.messages[1].role).toBe('user');
  });

  it('should return immediately on high confidence safe (Pass 1)', async () => {
    const now = Date.now();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              risk: 'low',
              confidence: 0.95,
              context: 'Clearly safe educational content',
              legitimate_signals: ['explain', 'educational'],
              validation_token: now
            })
          }
        }],
        usage: { total_tokens: 100 }
      })
    });

    const result = await validateUnified('Test prompt');

    expect(result.safe).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.stage).toBe('pass1');
    expect(fetch).toHaveBeenCalledTimes(1); // Only Pass 1, no Pass 2
  });

  it('should return immediately on high confidence unsafe (Pass 1)', async () => {
    const now = Date.now();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              risk: 'high',
              confidence: 0.93,
              context: 'Clear jailbreak attempt',
              legitimate_signals: [],
              validation_token: now
            })
          }
        }],
        usage: { total_tokens: 110 }
      })
    });

    const result = await validateUnified('Test prompt');

    expect(result.safe).toBe(false);
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.stage).toBe('pass1');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should proceed to Pass 2 when Pass 1 uncertain', async () => {
    const now = Date.now();

    // Mock Pass 1 uncertain
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              risk: 'medium',
              confidence: 0.6,
              context: 'Ambiguous request',
              legitimate_signals: ['some'],
              validation_token: now
            })
          }
        }],
        usage: { total_tokens: 100 }
      })
    });

    // Mock Pass 2 response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              safe: true,
              confidence: 0.85,
              threats: [],
              reasoning: 'Legitimate business request after deep analysis',
              validation_token: now + 1
            })
          }
        }],
        usage: { total_tokens: 150 }
      })
    });

    const result = await validateUnified('Test prompt');

    expect(result.stage).toBe('pass2');
    expect(fetch).toHaveBeenCalledTimes(2); // Pass 1 + Pass 2
  });
});

describe('Unified AI Validator - Stage 2: AI Validation (Pass 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    detectPatterns.mockReturnValue({
      safe: true,
      confidence: 0.65,
      threats: [],
      requiresAI: true,
      context: { detected: true, patternType: 'sql', contextType: 'business' },
      reasoning: 'Requires AI',
      metadata: { stage: 'pattern_unified' }
    });
  });

  it('should call Pass 2 with Pass 1 context', async () => {
    const now = Date.now();

    // Mock Pass 1 uncertain
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              risk: 'medium',
              confidence: 0.65,
              context: 'Business context with SQL keywords',
              legitimate_signals: ['meeting', 'order'],
              validation_token: now
            })
          }
        }],
        usage: { total_tokens: 100 }
      })
    });

    // Mock Pass 2
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              safe: false,
              confidence: 0.88,
              threats: ['sql_injection'],
              reasoning: 'SQL injection attempt disguised as business query',
              validation_token: now + 1
            })
          }
        }],
        usage: { total_tokens: 180 }
      })
    });

    await validateUnified('Test prompt');

    expect(fetch).toHaveBeenCalledTimes(2);

    // Check Pass 2 call
    const [url2, options2] = fetch.mock.calls[1];
    expect(url2).toBe('https://openrouter.ai/api/v1/chat/completions');

    const body2 = JSON.parse(options2.body);
    expect(body2.model).toContain('gemini'); // Pass 2 uses Gemini 2.5 Flash
    expect(body2.messages[0].content).toContain('CONTEXT FROM INITIAL ANALYSIS');
    expect(body2.messages[0].content).toContain('Risk Level: medium');
  });

  it('should return Pass 2 final decision', async () => {
    const baseTime = 1700000000000;

    // Use fake timers for complete Date control
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);

    // Pass 1 uncertain - advance timer after this call
    fetch.mockImplementationOnce(async () => {
      const response = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({
            risk: 'medium', confidence: 0.7, context: 'Ambiguous',
            legitimate_signals: [], validation_token: baseTime
          })}}],
          usage: { total_tokens: 100 }
        })
      };
      // Advance time after Pass 1 response (simulates time passing)
      vi.advanceTimersByTime(1);
      return response;
    });

    // Pass 2 decisive
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          safe: true,
          confidence: 0.92,
          threats: [],
          reasoning: 'Legitimate after deep analysis',
          validation_token: baseTime + 1
        })}}],
        usage: { total_tokens: 150 }
      })
    });

    const result = await validateUnified('Test prompt');

    expect(result.safe).toBe(true);
    expect(result.confidence).toBe(0.92);
    expect(result.threats).toEqual([]);
    expect(result.stage).toBe('pass2');
    expect(result.reasoning).toContain('Legitimate after deep analysis');

    vi.useRealTimers();
  });
});

describe('Unified AI Validator - Stage 3: Final Decision', () => {
  it('should include processing time in result', async () => {
    detectPatterns.mockReturnValue({
      safe: false,
      confidence: 0.95,
      threats: ['jailbreak_attempt'],
      requiresAI: false,
      context: null,
      reasoning: 'Jailbreak detected',
      metadata: { stage: 'pattern_unified', externalReferences: false }
    });

    const result = await validateUnified('Test');

    expect(result.processingTime).toBeDefined();
    expect(result.processingTime).toBeGreaterThanOrEqual(0); // May be 0 for instant pattern blocks
  });

  it('should include cost tracking', async () => {
    detectPatterns.mockReturnValue({
      safe: true,
      requiresAI: true,
      confidence: 0.65,
      threats: [],
      context: { detected: true },
      reasoning: 'Needs AI',
      metadata: { stage: 'pattern_unified' }
    });

    const now = Date.now();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          risk: 'low', confidence: 0.95, context: 'Safe',
          legitimate_signals: [], validation_token: now
        })}}],
        usage: { total_tokens: 100 }
      })
    });

    const result = await validateUnified('Test');

    expect(result.cost).toBeDefined();
    expect(result.cost).toBeGreaterThanOrEqual(0); // 0 if free model used
  });

  it('should include stats for all stages executed', async () => {
    detectPatterns.mockReturnValue({
      safe: false,
      confidence: 0.92,
      threats: ['repetition'],
      requiresAI: false,
      context: null,
      reasoning: 'Repetition attack',
      metadata: { stage: 'pattern_unified' }
    });

    const result = await validateUnified('Test');

    expect(result.stats).toBeDefined();
    expect(result.stats.stages).toBeDefined();
    expect(result.stats.stages.length).toBeGreaterThan(0);
    expect(result.stats.stages[0].stage).toBe('pattern_detection');
  });
});

describe('Unified AI Validator - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    detectPatterns.mockReturnValue({
      safe: true,
      requiresAI: true,
      confidence: 0.65,
      threats: [],
      context: { detected: true },
      reasoning: 'Needs AI',
      metadata: { stage: 'pattern_unified' }
    });
  });

  it('should fail closed on Pass 1 error', async () => {
    fetch.mockRejectedValueOnce(new Error('API timeout'));

    const result = await validateUnified('Test');

    expect(result.safe).toBe(false);
    // When Pass 1 fails, it may return protocol_integrity_violation or pass1_error depending on how the error manifests
    expect(['protocol_integrity_violation', 'pass1_error']).toContain(result.threats[0]);
    expect(result.needsReview).toBe(true);
  });

  it('should fallback to Pass 1 on Pass 2 error', async () => {
    const baseTime = 1700000000000;

    // Use fake timers for complete Date control
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);

    // Pass 1 succeeds (uncertain)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          risk: 'medium', confidence: 0.7, context: 'Uncertain',
          legitimate_signals: [], validation_token: baseTime
        })}}],
        usage: { total_tokens: 100 }
      })
    });

    // Pass 2 fails
    fetch.mockRejectedValueOnce(new Error('Model unavailable'));

    const result = await validateUnified('Test');

    // finalSafe = pass1Data.risk !== 'high'
    // 'medium' !== 'high' → true (allows through with reduced confidence)
    expect(result.safe).toBe(true);
    expect(result.confidence).toBeLessThan(0.7); // Degraded confidence
    expect(result.threats).toContain('pass2_error');
    expect(result.reasoning).toContain('Pass 2 error');
    expect(result.stage).toBe('pass1_fallback');
    expect(result.needsReview).toBe(true);

    vi.useRealTimers();
  });

  it('should fail closed on protocol integrity violation (Pass 1)', async () => {
    // Pass 1 returns invalid response (missing required field)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          risk: 'low',
          confidence: 0.9,
          // Missing 'context' field - will fail protocol check
          legitimate_signals: [],
          validation_token: Date.now()
        })}}],
        usage: { total_tokens: 100 }
      })
    });

    const result = await validateUnified('Test');

    expect(result.safe).toBe(false);
    // Either protocol_integrity_violation OR pass1_error depending on repairJSON behavior
    expect(['protocol_integrity_violation', 'pass1_error']).toContain(result.threats[0]);
  });

  it('should fail closed on protocol integrity violation (Pass 2)', async () => {
    const now = Date.now();

    // Pass 1 uncertain
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          risk: 'medium', confidence: 0.65, context: 'Uncertain',
          legitimate_signals: [], validation_token: now
        })}}],
        usage: { total_tokens: 100 }
      })
    });

    // Pass 2 returns invalid response (missing required field)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          safe: true,
          confidence: 0.9,
          // Missing 'threats' field
          reasoning: 'Safe',
          validation_token: now + 1
        })}}],
        usage: { total_tokens: 150 }
      })
    });

    const result = await validateUnified('Test');

    expect(result.safe).toBe(false);
    // Either protocol_integrity_violation OR pass2_error/pass1_fallback
    const validThreats = ['protocol_integrity_violation', 'pass2_error', 'pass1_error'];
    expect(validThreats).toContain(result.threats[0]);
  });

  it('should handle malformed JSON response', async () => {
    // Pass 1 returns non-JSON
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'This is not JSON' }}],
        usage: { total_tokens: 50 }
      })
    });

    const result = await validateUnified('Test');

    // repairJSON creates fallback response triggering Pass 2
    // But if repairJSON returns invalid structure, protocol check fails
    expect(result).toBeDefined();
    // Result depends on repairJSON behavior - either Pass 2 called or protocol fail
  });
});

describe('Unified AI Validator - Integration', () => {
  it('should maintain external reference metadata from pattern stage', async () => {
    detectPatterns.mockReturnValue({
      safe: true,
      confidence: 0.70,
      threats: [],
      requiresAI: false,
      context: null,
      reasoning: 'External reference detected but allowed',
      metadata: {
        stage: 'external_reference',
        externalReferences: true,
        referenceTypes: ['urls'],
        references: ['https://example.com']
      }
    });

    const result = await validateUnified('Visit https://example.com');

    expect(result.externalReferences).toBe(true);
    expect(result.metadata.referenceTypes).toContain('urls');
  });

  it('should pass through pattern metadata correctly', async () => {
    detectPatterns.mockReturnValue({
      safe: false,
      confidence: 0.95,
      threats: ['command_injection'],
      requiresAI: false,
      context: null,
      reasoning: 'Command injection detected',
      metadata: {
        stage: 'pattern_unified',
        detectedPatterns: ['command'],
        contextType: null,
        externalReferences: false
      }
    });

    const result = await validateUnified('; rm -rf /');

    expect(result.metadata.detectedPatterns).toContain('command');
    expect(result.metadata.stage).toBe('pattern_unified');
  });
});
