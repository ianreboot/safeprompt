# SafePrompt JavaScript/TypeScript SDK

Official JavaScript/TypeScript SDK for SafePrompt API.

## Installation

```bash
npm install safeprompt
```

## Quick Start

```javascript
import SafePrompt from 'safeprompt';

const client = new SafePrompt({ apiKey: 'your-api-key' });

// userIP is your END USER's address, not your server's. The API requires it.
const result = await client.check('User input goes here', { userIP: req.ip });

if (result.safe) {
  // Safe to proceed with LLM
} else {
  // Handle malicious input
  console.log('Threats detected:', result.threats);
}
```

## API Reference

### `new SafePrompt(config)`

Create a new SafePrompt client.

**Parameters:**
- `config.apiKey` (string, required): Your SafePrompt API key
- `config.baseURL` (string, optional): Custom API base URL

### `client.check(prompt, options?)`

Validate a single prompt.

**Parameters:**
- `prompt` (string, required): The user input to validate
- `options.userIP` (string): The end user's IP address. The API requires the `X-User-IP` header on every call; if you omit this option the SDK sends `127.0.0.1`, which makes the call succeed but attributes every attack to localhost in threat intelligence. Always pass the real address.
- `options.sessionToken` (string): Multi-turn session token. Note: the API currently reads this field from the body as `session_token`; the SDK sends `sessionToken`, so multi-turn context through this option is not honoured until the SDK is updated (tracked). Use the raw HTTP call with `session_token` for multi-turn today.

**Returns:**
```typescript
{
  safe: boolean;
  threats: string[];
  confidence: number;
  processingTime: number;
}
```

### `client.checkBatch(prompts, options?)`

Validate multiple prompts in one request.

**Parameters:**
- `prompts` (string[], required): Array of prompts to validate
- `options.userIP` (string): as above

**Returns:**
```typescript
Array<ValidationResult>
```

### `client.getUsage()`

Get API usage statistics.

Not available yet: the API has no `/api/v1/usage` route as of 2026-09-12, so this method returns an error. Read usage from the dashboard until the route ships.

## Error Handling

```javascript
try {
  const result = await client.check(userInput, { userIP: req.ip });
} catch (error) {
  if (error instanceof SafePromptError) {
    console.error('API Error:', error.message, error.statusCode);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

Decide what happens on an error before you ship: fail closed (reject the message) or fail open (let it through and log). The SDK does neither for you.

## TypeScript Support

Full TypeScript support included with type definitions.

## License

MIT
