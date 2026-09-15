/**
 * Regression tests for the detection-sensitivity parameter.
 *
 * Same defect as safeprompt-middleware, verified against the live API on 2026-09-07:
 * this package sent {prompt, mode} while documenting `mode` as detection sensitivity.
 * The API reads `mode` as CACHING behaviour and `sensitivity` as detection, so
 * mode:'strict' was applied as sensitivity:"balanced". Callers asking for strict got balanced.
 */
import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { validate, normaliseSensitivity } from '../client.js';

const realFetch = globalThis.fetch;
let lastBody: any = null;

beforeEach(() => {
  lastBody = null;
  (globalThis as any).fetch = async (_url: string, init: any) => {
    lastBody = JSON.parse(init.body);
    return { ok: true, status: 200, json: async () => ({ safe: true, threats: [] }) };
  };
});
afterEach(() => { (globalThis as any).fetch = realFetch; });

const call = (opts: any) =>
  validate('hello', { provider: 'https://x', apiKey: 'k', userIP: '203.0.113.10', ...opts });

describe('detection sensitivity is sent as `sensitivity`', () => {
  it('sends sensitivity, never mode', async () => {
    await call({ sensitivity: 'strict' });
    assert.equal(lastBody.sensitivity, 'strict');
    assert.equal('mode' in lastBody, false, '`mode` is the API caching field and must not be sent');
  });

  it('defaults to balanced', async () => {
    await call({});
    assert.equal(lastBody.sensitivity, 'balanced');
  });

  it('maps the deprecated mode option onto sensitivity', async () => {
    await call({ mode: 'strict' });
    assert.equal(lastBody.sensitivity, 'strict');
  });

  it('never sends a value the API would reject', async () => {
    for (const v of ['fast', 'nonsense', '', undefined]) {
      await call({ sensitivity: v });
      assert.ok(['lenient', 'balanced', 'strict'].includes(lastBody.sensitivity),
        `sent ${JSON.stringify(lastBody.sensitivity)} for ${JSON.stringify(v)}`);
    }
  });
});

describe('normaliseSensitivity', () => {
  it('passes through real values', () => {
    assert.equal(normaliseSensitivity('lenient'), 'lenient');
    assert.equal(normaliseSensitivity('strict'), 'strict');
  });
  it("maps this package's old 'fast' onto balanced, never lower", () => {
    // 'fast' was never a valid API sensitivity; the API ignored the field, so callers who
    // set it were actually receiving balanced detection. Mapping it to balanced preserves
    // exactly the behaviour those callers observed.
    assert.equal(normaliseSensitivity('fast'), 'balanced');
  });
  it('falls back to balanced', () => {
    assert.equal(normaliseSensitivity(undefined), 'balanced');
  });
});
