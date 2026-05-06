import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { DEFAULT_PROVIDER, validate } from './client.js';
import { SafePromptBlockedError, type SafePromptCallbackConfig, type ValidationResult } from './types.js';

/**
 * LangChain callback handler that validates every prompt flowing through a chain
 * via the SafePrompt API before it reaches the LLM.
 *
 * Example:
 *   const chain = new LLMChain({
 *     llm, prompt,
 *     callbacks: [new SafePromptCallbackHandler({ apiKey: 'sp_live_…', userIP: req.ip })]
 *   });
 *   await chain.call({ input: userInput });
 *   // throws SafePromptBlockedError if input was flagged
 */
export class SafePromptCallbackHandler extends BaseCallbackHandler {
  name = 'safeprompt_callback_handler';

  private readonly config: Required<Omit<SafePromptCallbackConfig, 'onBlock' | 'onError'>> & {
    onBlock?: SafePromptCallbackConfig['onBlock'];
    onError?: SafePromptCallbackConfig['onError'];
  };

  constructor(config: SafePromptCallbackConfig) {
    super();
    if (!config.apiKey) throw new Error('SafePromptCallbackHandler: apiKey is required');
    if (!config.userIP) throw new Error('SafePromptCallbackHandler: userIP is required');

    this.config = {
      apiKey: config.apiKey,
      userIP: config.userIP,
      provider: config.provider ?? DEFAULT_PROVIDER,
      mode: config.mode ?? 'balanced',
      enforcement: config.enforcement ?? 'block',
      onProviderError: config.onProviderError ?? 'fail-closed',
      sampleRate: config.sampleRate ?? 1.0,
      onBlock: config.onBlock,
      onError: config.onError,
    };
  }

  /**
   * Fires before an LLM call. `prompts` is the fully-rendered prompt array.
   * We validate each prompt in parallel; the first unsafe result aborts the chain.
   */
  async handleLLMStart(_llm: unknown, prompts: string[]): Promise<void> {
    if (this.config.sampleRate < 1 && Math.random() > this.config.sampleRate) return;

    const results = await Promise.allSettled(
      prompts.map(async (prompt) => ({
        prompt,
        result: await validate(prompt, {
          provider: this.config.provider,
          apiKey: this.config.apiKey,
          mode: this.config.mode,
          userIP: this.config.userIP,
        }),
      })),
    );

    for (const entry of results) {
      if (entry.status === 'rejected') {
        const err = entry.reason instanceof Error ? entry.reason : new Error(String(entry.reason));
        if (this.config.onError) await this.config.onError('', err);
        if (this.config.onProviderError === 'fail-closed') throw err;
        continue;
      }
      const { prompt, result } = entry.value;
      if (!result.safe) {
        if (this.config.onBlock) await this.config.onBlock(prompt, result);
        if (this.config.enforcement === 'block') throw new SafePromptBlockedError(prompt, result);
      }
    }
  }

  /**
   * Chat-model variant of handleLLMStart.
   * `messages` is string[][] — one array of serialized messages per prompt.
   * We flatten to strings and validate each as a single prompt for safety checking.
   */
  async handleChatModelStart(_llm: unknown, messages: unknown[][]): Promise<void> {
    const flattened = messages.map((msgs) =>
      msgs.map((m) => serializeMessage(m)).filter((s) => s.length > 0).join('\n'),
    );
    await this.handleLLMStart(_llm, flattened);
  }

  /**
   * Fires when an agent receives tool output. This is where indirect-injection
   * attacks land (e.g. a web-scrape tool returns content with hidden instructions).
   * Validates the tool output before it's fed back into the LLM.
   */
  async handleToolEnd(output: string | unknown): Promise<void> {
    if (typeof output !== 'string' || output.length === 0) return;
    if (this.config.sampleRate < 1 && Math.random() > this.config.sampleRate) return;

    let result: ValidationResult;
    try {
      result = await validate(output, {
        provider: this.config.provider,
        apiKey: this.config.apiKey,
        mode: this.config.mode,
        userIP: this.config.userIP,
      });
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      if (this.config.onError) await this.config.onError(output, e);
      if (this.config.onProviderError === 'fail-closed') throw e;
      return;
    }

    if (!result.safe) {
      if (this.config.onBlock) await this.config.onBlock(output, result);
      if (this.config.enforcement === 'block') throw new SafePromptBlockedError(output, result);
    }
  }
}

/**
 * Best-effort serialization of a LangChain message into a string for validation.
 * LangChain's BaseMessage has .content (string or MessageContentComplex[]).
 */
function serializeMessage(m: unknown): string {
  if (m === null || m === undefined) return '';
  if (typeof m === 'string') return m;
  if (typeof m === 'object') {
    const maybe = m as { content?: unknown; text?: unknown };
    if (typeof maybe.content === 'string') return maybe.content;
    if (Array.isArray(maybe.content)) {
      return maybe.content
        .map((c) => (typeof c === 'string' ? c : (c as { text?: string }).text ?? ''))
        .filter((s) => s.length > 0)
        .join('\n');
    }
    if (typeof maybe.text === 'string') return maybe.text;
    try {
      return JSON.stringify(m);
    } catch {
      return '';
    }
  }
  return String(m);
}
