export interface ValidationResult {
  safe: boolean;
  threats: string[];
  confidence: number;
  detectionMethod?: string;
  reasoning?: string;
  processingTime?: number;
}

export interface SafePromptCallbackConfig {
  /** SafePrompt API key. Get one at https://safeprompt.dev */
  apiKey: string;

  /**
   * Provider base URL. Defaults to https://api.safeprompt.dev.
   * Override to self-host or point at dev-api.safeprompt.dev for testing.
   */
  provider?: string;

  /**
   * Detection sensitivity.
   * - 'fast': pattern detection only, sub-5ms
   * - 'balanced': pattern + AI when needed (default)
   * - 'strict': always full AI validation
   */
  mode?: 'fast' | 'balanced' | 'strict';

  /**
   * End-user IP for threat-intelligence tracking. Required by the API.
   * For server-side LangChain apps, pass the request IP from your web framework.
   */
  userIP: string;

  /**
   * Behaviour when a prompt is flagged unsafe.
   * - 'block' (default): throw a SafePromptBlockedError, aborting the chain
   * - 'log': call onBlock but let the chain continue (useful while tuning)
   */
  enforcement?: 'block' | 'log';

  /**
   * Behaviour when the provider is unreachable.
   * - 'fail-closed' (default): throw, aborting the chain
   * - 'fail-open': log and continue
   */
  onProviderError?: 'fail-closed' | 'fail-open';

  /**
   * Optional hook fired when a prompt is flagged unsafe, regardless of enforcement mode.
   */
  onBlock?: (prompt: string, result: ValidationResult) => void | Promise<void>;

  /**
   * Optional hook fired when validation is skipped due to provider error.
   */
  onError?: (prompt: string, error: Error) => void | Promise<void>;

  /**
   * Sample rate [0..1]. At 0.1, only 10% of prompts are validated.
   * Useful for cost/latency-sensitive high-volume apps.
   * Default: 1.0 (validate every prompt).
   */
  sampleRate?: number;
}

export class SafePromptBlockedError extends Error {
  public readonly result: ValidationResult;
  public readonly prompt: string;

  constructor(prompt: string, result: ValidationResult) {
    const threatSummary = result.threats.length > 0 ? result.threats.join(', ') : 'unsafe';
    super(`SafePrompt blocked prompt (${threatSummary})`);
    this.name = 'SafePromptBlockedError';
    this.prompt = prompt;
    this.result = result;
  }
}
