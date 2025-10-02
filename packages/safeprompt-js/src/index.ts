/**
 * SafePrompt JavaScript/TypeScript SDK
 * API-first prompt injection protection
 */

export interface SafePromptConfig {
  apiKey: string;
  baseURL?: string;
}

export interface ValidationResult {
  safe: boolean;
  threats: string[];
  confidence: number;
  processingTimeMs: number;
  passesUsed: number;
}

export interface ValidationError {
  error: string;
  message: string;
  statusCode: number;
}

export class SafePromptError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'SafePromptError';
    this.statusCode = statusCode;
  }
}

export default class SafePrompt {
  private apiKey: string;
  private baseURL: string;

  constructor(config: SafePromptConfig) {
    if (!config.apiKey) {
      throw new Error('SafePrompt API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.safeprompt.dev';
  }

  /**
   * Check if a prompt is safe
   * @param prompt - The user input to validate
   * @returns Validation result indicating if the prompt is safe
   */
  async check(prompt: string): Promise<ValidationResult> {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt must be a non-empty string');
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'safeprompt-js/1.0.0'
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SafePromptError(
          errorData.message || `API request failed with status ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof SafePromptError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new SafePromptError(error.message, 500);
      }

      throw new SafePromptError('Unknown error occurred', 500);
    }
  }

  /**
   * Batch validate multiple prompts
   * @param prompts - Array of prompts to validate
   * @returns Array of validation results
   */
  async checkBatch(prompts: string[]): Promise<ValidationResult[]> {
    if (!Array.isArray(prompts) || prompts.length === 0) {
      throw new Error('Prompts must be a non-empty array');
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/validate/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'safeprompt-js/1.0.0'
        },
        body: JSON.stringify({ prompts })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SafePromptError(
          errorData.message || `API request failed with status ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      return data.results;
    } catch (error) {
      if (error instanceof SafePromptError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new SafePromptError(error.message, 500);
      }

      throw new SafePromptError('Unknown error occurred', 500);
    }
  }

  /**
   * Get API usage statistics
   * @returns Usage statistics for your API key
   */
  async getUsage(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/v1/usage`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'safeprompt-js/1.0.0'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SafePromptError(
          errorData.message || `API request failed with status ${response.status}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof SafePromptError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new SafePromptError(error.message, 500);
      }

      throw new SafePromptError('Unknown error occurred', 500);
    }
  }
}

// Named exports for convenience
export { SafePrompt };
