# @safeprompt.dev/langchain

LangChain callback handler that validates every prompt flowing through your chain via the [SafePrompt](https://safeprompt.dev) API before it reaches the LLM. Catches jailbreaks, data-extraction attempts, authority-signal impersonation, and indirect injection from tool outputs.

## Install

```bash
npm install @safeprompt.dev/langchain
```

Peer dependency: `@langchain/core` (LangChain 1.x, `>=1.0.0`).

## Quick start

```ts
import { LLMChain } from 'langchain/chains';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { SafePromptCallbackHandler, SafePromptBlockedError } from '@safeprompt.dev/langchain';

const chain = new LLMChain({
  llm: new ChatOpenAI({ model: 'gpt-4o-mini' }),
  prompt: PromptTemplate.fromTemplate('Answer: {input}'),
  callbacks: [
    new SafePromptCallbackHandler({
      apiKey: process.env.SAFEPROMPT_API_KEY!,
      userIP: req.ip, // end-user IP from your web framework
    }),
  ],
});

try {
  const { text } = await chain.call({ input: userInput });
  console.log(text);
} catch (err) {
  if (err instanceof SafePromptBlockedError) {
    return res.status(400).json({
      error: 'Prompt blocked for safety',
      threats: err.result.threats,
    });
  }
  throw err;
}
```

## Configuration

```ts
new SafePromptCallbackHandler({
  apiKey: 'sp_live_…',
  userIP: '203.0.113.1',              // REQUIRED — end-user IP

  provider: 'https://api.safeprompt.dev',  // default
  sensitivity: 'balanced',                 // 'lenient' | 'balanced' | 'strict'
  enforcement: 'block',                    // 'block' | 'log' (log = don't throw, just fire onBlock)
  onProviderError: 'fail-closed',          // 'fail-closed' | 'fail-open'
  sampleRate: 1.0,                         // 0..1 — fraction of prompts to validate

  onBlock: (prompt, result) => {
    console.warn('[safeprompt] blocked', result.threats, '→', prompt.slice(0, 80));
  },
  onError: (prompt, err) => {
    console.error('[safeprompt] provider error', err.message);
  },
});
```

### `enforcement: 'log'` — tune before enforcing

Run the adapter in log mode in staging/production for a week. You get `onBlock` events
without any chain aborts. Review the results in your logs (or SafePrompt dashboard), tune
custom lists / confidence threshold, then flip `enforcement: 'block'`.

### `sampleRate` — cost control for high-volume apps

Each validation call is a round-trip to the SafePrompt API (sub-second for most prompts,
but still a network hop). For apps processing >10K prompts/day where latency matters more
than per-prompt coverage, set `sampleRate: 0.1` to validate 10% of prompts.

### Indirect-injection protection (agents)

When you use this handler with a LangChain agent, it also fires on `handleToolEnd` — the
moment a tool returns content that will be fed back to the LLM. This is the key protection
against *indirect* prompt injection (content fetched from the web, retrieved from RAG, etc.,
that hides malicious instructions).

## How it works

1. `handleLLMStart` / `handleChatModelStart` fires before every LLM call. Each prompt is
   POSTed to the SafePrompt API.
2. The API runs a 3-layer defense: pattern matching → external-reference detection → AI
   validation. Most requests are classified in single-digit milliseconds.
3. If the API returns `safe: false`, the handler either throws `SafePromptBlockedError`
   (in `block` mode) or fires your `onBlock` hook (in `log` mode).
4. `handleToolEnd` applies the same check to agent tool outputs — the primary indirect
   injection surface.

## Troubleshooting

- **Every prompt 401s:** API key is invalid or revoked. Check `SAFEPROMPT_API_KEY`.
- **Every prompt 400s with "X-User-IP required":** you passed an empty `userIP`. The API
  requires this for threat-intelligence tracking. Use your web framework's IP helper
  (`req.ip` in Express, `req.socket.remoteAddress`, etc.).
- **False positives:** switch to `enforcement: 'log'`, inspect the blocked prompts, and
  use custom whitelist rules on your SafePrompt account to allow known-safe patterns.

## Links

- [SafePrompt homepage](https://safeprompt.dev)
- [API docs](https://safeprompt.dev/docs)
- [Dashboard](https://dashboard.safeprompt.dev)
- [Open NPM client](https://www.npmjs.com/package/@safeprompt/client)

MIT.

---

### Note on `mode` (fixed in 0.2.0)

Before 0.2.0 this package sent the detection level to the API as `mode`. The API reads `mode` as a
caching setting and `sensitivity` as the detection level, so `mode: 'strict'` was accepted and then
applied as `balanced`. Anyone who selected `strict` or `fast` was getting `balanced`, silently.

From 0.2.0 the value is sent as `sensitivity` and applies as requested. `mode` still works as a
deprecated alias. If you set `mode: 'strict'`, expect detection to actually get stricter now, which
may block prompts that previously passed.

`'fast'` was never a valid API sensitivity. Callers who set it were receiving `balanced`, so it now maps to `balanced` to preserve exactly what they had. Use `'lenient'` explicitly if you want fewer blocks.
