import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SafePromptCallbackHandler, SafePromptBlockedError, validate, DEFAULT_PROVIDER } from '../index.js';

// Only a real boolean `true` is safe. A response whose `safe` is "false", "true", 1, 0,
// null or missing must be blocked. Before this, `if (!result.safe)` let the string "false"
// (truthy) straight through both handleLLMStart and handleToolEnd.

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

function mockApi(safe: unknown, present = true) {
  globalThis.fetch = (async () => {
    const body: Record<string, unknown> = { threats: [], confidence: 0.9 };
    if (present) body.safe = safe;
    return { ok: true, status: 200, json: async () => body, text: async () => '' } as Response;
  }) as typeof fetch;
}

const CASES: Array<{ label: string; safe: unknown; present: boolean }> = [
  { label: '"false"', safe: 'false', present: true },
  { label: '"true"', safe: 'true', present: true },
  { label: '1', safe: 1, present: true },
  { label: '0', safe: 0, present: true },
  { label: 'null', safe: null, present: true },
  { label: 'missing', safe: undefined, present: false },
];

function handler() {
  return new SafePromptCallbackHandler({ apiKey: 'sp_live_x', userIP: '1.2.3.4' });
}

test('strict safe: safe === true passes handleLLMStart and handleToolEnd', async () => {
  mockApi(true);
  await handler().handleLLMStart({}, ['hello']);
  await handler().handleToolEnd('tool output');
});

for (const c of CASES) {
  test(`strict safe: handleLLMStart blocks safe ${c.label}`, async () => {
    mockApi(c.safe, c.present);
    await assert.rejects(() => handler().handleLLMStart({}, ['hello']), SafePromptBlockedError);
  });

  test(`strict safe: handleToolEnd blocks safe ${c.label}`, async () => {
    mockApi(c.safe, c.present);
    await assert.rejects(() => handler().handleToolEnd('tool output'), SafePromptBlockedError);
  });

  test(`strict safe: validate() returns boolean false for safe ${c.label}`, async () => {
    mockApi(c.safe, c.present);
    const r = await validate('hello', { provider: DEFAULT_PROVIDER, apiKey: 'k', userIP: '1.2.3.4' });
    assert.equal(r.safe, false);
  });
}
