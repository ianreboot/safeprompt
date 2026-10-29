import type { ValidationResult, Sensitivity } from './types.js';

/**
 * Map a caller-supplied sensitivity onto a value the API accepts, or `undefined`.
 * 'fast' was never a valid API sensitivity; the API ignored the field, so callers who set
 * it were actually receiving 'balanced' detection. It maps to 'balanced' to preserve exactly
 * the behaviour those callers observed. Detection must never silently decrease on upgrade.
 *
 * Nothing set (or an unrecognised value) returns `undefined` and the field is NOT sent, so
 * the API applies the account default: strict for accounts created from 2026-10-21,
 * balanced for older accounts. Sending 'balanced' here would silently opt every new account
 * out of strict.
 */
export function normaliseSensitivity(value?: string): Sensitivity | undefined {
  if (value === 'strict' || value === 'no_judgement' || value === 'balanced' || value === 'lenient') return value;
  if (value === 'no_judgment') return 'no_judgement';
  if (value === 'fast') return 'balanced';
  return undefined;
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
      'User-Agent': '@safeprompt.dev/langchain/0.2.4',
    },
    // Omitted when unset, so the API applies the account default.
    body: JSON.stringify(detection ? { prompt, sensitivity: detection } : { prompt }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SafePrompt API returned HTTP ${res.status}: ${body}`);
  }

  const data = (await res.json()) as Partial<ValidationResult> | null;
  // Fail closed: only a real boolean `true` is safe. A non-boolean `safe` ("false", 1,
  // null, missing) must never pass, so it is normalised to `false` here, where the
  // response is parsed, and every caller sees a real boolean.
  return { ...data, safe: data?.safe === true } as ValidationResult;
}
