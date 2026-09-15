import type { ValidationResult, Sensitivity } from './types.js';

/**
 * Map a caller-supplied sensitivity onto a value the API accepts.
 * 'fast' was never a valid API sensitivity; the API ignored the field, so callers who set
 * it were actually receiving 'balanced' detection. It maps to 'balanced' to preserve exactly
 * the behaviour those callers observed. Detection must never silently decrease on upgrade.
 */
export function normaliseSensitivity(value?: string): Sensitivity {
  if (value === 'strict' || value === 'balanced' || value === 'lenient') return value;
  if (value === 'fast') return 'balanced';
  return 'balanced';
}

export const DEFAULT_PROVIDER = 'https://api.safeprompt.dev';

export interface ValidateOptions {
  provider: string;
  apiKey: string;
  /** Detection sensitivity. Sent as `sensitivity`, the field the API reads for detection. */
  sensitivity?: Sensitivity;
  /**
   * @deprecated Use `sensitivity`. Mapped onto it for back-compat.
   * Previously sent as `mode`, which the API reads as CACHING behaviour, so 'strict' here
   * silently produced balanced detection.
   */
  mode?: 'fast' | 'balanced' | 'strict';
  userIP: string;
}

export async function validate(
  prompt: string,
  options: ValidateOptions,
): Promise<ValidationResult> {
  const { provider, apiKey, sensitivity, mode, userIP } = options;
  // `sensitivity` selects detection. `mode` is the API's CACHING parameter and is deliberately
  // not forwarded: sending mode:'strict' set no detection level at all.
  const detection = normaliseSensitivity(sensitivity ?? mode);
  const base = provider.replace(/\/$/, '');
  const url = `${base}/api/v1/validate`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-User-IP': userIP,
      'User-Agent': '@safeprompt.dev/langchain/0.2.0',
    },
    body: JSON.stringify({ prompt, sensitivity: detection }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SafePrompt API returned HTTP ${res.status}: ${body}`);
  }

  return (await res.json()) as ValidationResult;
}
