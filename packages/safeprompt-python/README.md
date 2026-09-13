# SafePrompt Python SDK

Protect your AI application from prompt injection attacks with one function call.

[![PyPI version](https://img.shields.io/pypi/v/safeprompt.svg)](https://pypi.org/project/safeprompt/)
[![Python versions](https://img.shields.io/pypi/pyversions/safeprompt.svg)](https://pypi.org/project/safeprompt/)

## Install

```bash
pip install safeprompt
```

## Quick Start

```python
from safeprompt import SafePrompt

sp = SafePrompt(api_key="YOUR_API_KEY")

# user_ip is your END USER's address, not your server's. The API requires it.
result = sp.check(user_input, user_ip=request.remote_addr)
if not result["safe"]:
    raise ValueError(f"Blocked: {result['threats'][0]}")
```

`check()` takes `prompt`, then keyword arguments `user_ip` and `session_token`. If you omit
`user_ip` the SDK sends `127.0.0.1`, which makes the call succeed but attributes every attack to
localhost in threat intelligence; always pass the real address. There is no `mode` argument.

## Async Support

```python
from safeprompt import AsyncSafePrompt

async with AsyncSafePrompt(api_key="YOUR_API_KEY") as sp:
    result = await sp.check(user_input, user_ip=request.remote_addr)
    if not result["safe"]:
        raise ValueError(f"Blocked: {result['threats'][0]}")
```

## Response Format

```python
{
    "safe": True,
    "threats": [],
    "confidence": 0.99,
    "processingTime": 45
}
```

## Error Handling

```python
from safeprompt import SafePromptError

try:
    result = sp.check(user_input, user_ip=request.remote_addr)
except SafePromptError as e:
    print(e.status_code)
    print(str(e))
```

Decide before you ship whether an error fails closed (reject the message) or fails open (let it
through and log). The SDK does neither for you.

## Links

- [Get API key](https://safeprompt.dev)
- [Documentation](https://docs.safeprompt.dev)
- [npm SDK](https://www.npmjs.com/package/safeprompt)
