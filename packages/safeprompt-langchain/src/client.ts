import type { ValidationResult } from './types.js';

export const DEFAULT_PROVIDER = 'https://api.safeprompt.dev';

export interface ValidateOptions {
  provider: string;
  apiKey: string;
  mode: 'fast' | 'balanced' | 'strict';
  userIP: string;
}

export async function validate(
  prompt: string,
  options: ValidateOptions,
): Promise<ValidationResult> {
  const { provider, apiKey, mode, userIP } = options;
  const base = provider.replace(/\/$/, '');
  const url = `${base}/api/v1/validate`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-User-IP': userIP,
      'User-Agent': '@safeprompt.dev/langchain/0.1.0',
    },
    body: JSON.stringify({ prompt, mode }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SafePrompt API returned HTTP ${res.status}: ${body}`);
  }

  return (await res.json()) as ValidationResult;
}
