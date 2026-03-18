# SafePrompt Python SDK

Protect your AI application from prompt injection attacks with one function call.

```bash
pip install safeprompt
```

## Quick Start

```python
from safeprompt import SafePrompt

sp = SafePrompt(api_key="YOUR_API_KEY")

result = sp.check(user_input, user_ip=request.remote_addr)
if not result["safe"]:
    raise ValueError(f"Blocked: {result[\"threats\"][0]}")
```

## Async Support

```python
from safeprompt import AsyncSafePrompt

async with AsyncSafePrompt(api_key="YOUR_API_KEY") as sp:
    result = await sp.check(user_input)
    if not result["safe"]:
        raise ValueError(f"Blocked: {result[\"threats\"][0]}")
```

## Response Format

```python
{
    "safe": True,
    "threats": [],
    "confidence": 0.99,
    "processingTimeMs": 45,
    "passesUsed": 1
}
```

## Error Handling

```python
from safeprompt import SafePromptError

try:
    result = sp.check(user_input)
except SafePromptError as e:
    print(e.status_code)
    print(str(e))
```

## Links

- [Get API key](https://safeprompt.dev)
- [Documentation](https://docs.safeprompt.dev)
- [npm SDK](https://www.npmjs.com/package/safeprompt)
