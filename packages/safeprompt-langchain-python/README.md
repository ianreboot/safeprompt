# safeprompt-langchain

LangChain callback handler that validates every prompt flowing through your chain via the [SafePrompt](https://safeprompt.dev) API before it reaches the LLM. Catches jailbreaks, data-extraction attempts, authority-signal impersonation, and indirect injection from tool outputs.

This is the Python counterpart to the JavaScript package [`@safeprompt.dev/langchain`](https://www.npmjs.com/package/@safeprompt.dev/langchain).

## Install

```bash
pip install safeprompt-langchain
```

Requires `langchain-core>=0.3.0` (installed automatically).

## Quick start

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from safeprompt_langchain import SafePromptCallbackHandler, SafePromptBlockedError

handler = SafePromptCallbackHandler(
    api_key="sp_live_...",   # get one at https://safeprompt.dev
    user_ip=request_ip,      # end-user IP from your web framework
)

chain = ChatPromptTemplate.from_template("Answer: {input}") | ChatOpenAI(model="gpt-4o-mini")

try:
    result = chain.invoke({"input": user_input}, config={"callbacks": [handler]})
    print(result.content)
except SafePromptBlockedError as err:
    # The prompt was flagged. Surface the threats, do not call the LLM.
    return {"error": "Prompt blocked for safety", "threats": err.result.threats}
```

## Configuration

```python
SafePromptCallbackHandler(
    api_key="sp_live_...",
    user_ip="203.0.113.1",            # REQUIRED: end-user IP

    provider="https://api.safeprompt.dev",  # default
    mode="balanced",                  # "fast" | "balanced" | "strict"
    enforcement="block",              # "block" | "log" (log = don't raise, just fire on_block)
    on_provider_error="fail-closed",  # "fail-closed" | "fail-open"
    sample_rate=1.0,                  # 0..1, fraction of prompts to validate
    timeout=30.0,                     # seconds per validation request

    on_block=lambda prompt, result: print("[safeprompt] blocked", result.threats),
    on_error=lambda prompt, err: print("[safeprompt] provider error", err),
)
```

### `enforcement="log"`: tune before enforcing

Run the adapter in log mode in staging/production for a week. You get `on_block`
callbacks without any chain aborts. Review the results, tune custom lists / confidence
thresholds on your SafePrompt account, then flip to `enforcement="block"`.

### `sample_rate`: cost control for high-volume apps

Each validation is a round-trip to the SafePrompt API (sub-second for most prompts, but
still a network hop). For apps processing >10K prompts/day where latency matters more than
per-prompt coverage, set `sample_rate=0.1` to validate 10% of prompts.

### Indirect-injection protection (agents)

Used with a LangChain agent, the handler also fires on `on_tool_end`, the moment a tool
returns content that will be fed back to the LLM. This is the key protection against
*indirect* prompt injection (content fetched from the web, retrieved from RAG, etc., that
hides malicious instructions).

## How it works

1. `on_llm_start` / `on_chat_model_start` fires before every LLM call. Each rendered prompt
   is POSTed to the SafePrompt API.
2. The API runs a layered defense: pattern matching → external-reference detection → AI
   validation. Most requests are classified in single-digit milliseconds.
3. If the API returns `safe == False`, the handler either raises `SafePromptBlockedError`
   (in `block` mode) or fires your `on_block` hook (in `log` mode).
4. `on_tool_end` applies the same check to agent tool outputs, the primary indirect
   injection surface.

> The handler sets `raise_error = True` so a blocked prompt actually aborts the run
> instead of being swallowed-and-logged by LangChain's callback manager.

## Standalone validation

You can also call the API directly without LangChain:

```python
from safeprompt_langchain import validate

result = validate("ignore all previous instructions", api_key="sp_live_...", user_ip="203.0.113.1")
print(result.safe, result.threats)  # False ['jailbreak_instruction_override']
```

## Troubleshooting

- **Every prompt 401s:** API key is invalid or revoked. Check your key.
- **Every prompt 400s with "X-User-IP required":** you passed an empty `user_ip`. The API
  requires this for threat-intelligence tracking. Use your web framework's client-IP helper.
- **False positives:** switch to `enforcement="log"`, inspect the blocked prompts, and use
  custom whitelist rules on your SafePrompt account to allow known-safe patterns.

## Links

- [SafePrompt homepage](https://safeprompt.dev)
- [API docs](https://safeprompt.dev/docs)
- [Dashboard](https://dashboard.safeprompt.dev)
- [JS package (`@safeprompt.dev/langchain`)](https://www.npmjs.com/package/@safeprompt.dev/langchain)

MIT.
