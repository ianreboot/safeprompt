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

const result = await client.check('User input goes here');

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

### `client.check(prompt)`

Validate a single prompt.

**Parameters:**
- `prompt` (string, required): The user input to validate

**Returns:**
```typescript
{
  safe: boolean;
  threats: string[];
  confidence: number;
  processingTimeMs: number;
  passesUsed: number;
}
```

### `client.checkBatch(prompts)`

Validate multiple prompts in one request.

**Parameters:**
- `prompts` (string[], required): Array of prompts to validate

**Returns:**
```typescript
Array<ValidationResult>
```

### `client.getUsage()`

Get API usage statistics.

**Returns:**
```typescript
{
  requestsThisMonth: number;
  requestsRemaining: number;
  plan: string;
}
```

## Error Handling

```javascript
try {
  const result = await client.check(userInput);
} catch (error) {
  if (error instanceof SafePromptError) {
    console.error('API Error:', error.message, error.statusCode);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## TypeScript Support

Full TypeScript support included with type definitions.

## License

MIT
