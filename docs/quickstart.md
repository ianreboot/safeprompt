# Quick Start Guide

Get started with SafePrompt in 5 minutes.

## 1. Get Your API Key

Sign up at [safeprompt.dev/signup](https://safeprompt.dev/signup) to get your API key.

**Pricing**: $29/month with full API access.

## 2. Install the SDK

```bash
npm install safeprompt
```

## 3. Basic Usage

```javascript
import SafePrompt from 'safeprompt';

const client = new SafePrompt({
  apiKey: process.env.SAFEPROMPT_API_KEY
});

// Validate user input
const result = await client.check('User message here');

if (result.safe) {
  console.log('✅ Safe to proceed');
  // Send to your LLM
} else {
  console.log('⚠️ Threat detected:', result.threats);
  // Handle malicious input
}
```

## 4. Integration with OpenAI

```javascript
import SafePrompt from 'safeprompt';
import OpenAI from 'openai';

const safeprompt = new SafePrompt({ apiKey: process.env.SAFEPROMPT_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function chat(userMessage) {
  // Step 1: Validate with SafePrompt
  const validation = await safeprompt.check(userMessage);

  if (!validation.safe) {
    throw new Error(`Threat detected: ${validation.threats.join(', ')}`);
  }

  // Step 2: Safe to proceed to OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: userMessage }]
  });

  return completion.choices[0].message.content;
}

// Usage
const reply = await chat('What is the weather like today?');
console.log(reply);
```

## 5. Response Format

```typescript
{
  safe: boolean;              // Is the prompt safe?
  threats: string[];          // Array of detected threats
  confidence: number;         // Confidence score (0-1)
  processingTimeMs: number;   // Processing time
  passesUsed: number;         // Number of validation passes used
}
```

### Example Response (Safe)

```json
{
  "safe": true,
  "threats": [],
  "confidence": 0.99,
  "processingTimeMs": 12,
  "passesUsed": 1
}
```

### Example Response (Threat Detected)

```json
{
  "safe": false,
  "threats": ["prompt_injection", "system_prompt_extraction"],
  "confidence": 0.95,
  "processingTimeMs": 234,
  "passesUsed": 2
}
```

## 6. Error Handling

```javascript
import SafePrompt, { SafePromptError } from 'safeprompt';

const client = new SafePrompt({ apiKey: process.env.SAFEPROMPT_API_KEY });

try {
  const result = await client.check(userInput);
  // Handle result
} catch (error) {
  if (error instanceof SafePromptError) {
    // SafePrompt API error
    console.error('API Error:', error.message);
    console.error('Status Code:', error.statusCode);
  } else {
    // Other error
    console.error('Unexpected error:', error);
  }
}
```

## 7. Best Practices

### ✅ Do This

```javascript
// Validate BEFORE sending to LLM
const validation = await safeprompt.check(userInput);
if (validation.safe) {
  const llmResponse = await yourLLM.chat(userInput);
}
```

### ❌ Don't Do This

```javascript
// DON'T send to LLM first, then validate
const llmResponse = await yourLLM.chat(userInput); // ⚠️ Too late!
const validation = await safeprompt.check(userInput);
```

### Use Environment Variables

```javascript
// Good
const client = new SafePrompt({
  apiKey: process.env.SAFEPROMPT_API_KEY
});

// Bad - hardcoded key
const client = new SafePrompt({
  apiKey: 'sp_123abc...' // ⚠️ Never commit API keys!
});
```

### Handle Errors Gracefully

```javascript
try {
  const validation = await safeprompt.check(userInput);

  if (!validation.safe) {
    // Log for monitoring
    console.log('Threat detected:', validation.threats);

    // Return user-friendly message
    return { error: 'Your message could not be processed' };
  }

  // Proceed with LLM
} catch (error) {
  // Fail closed - don't proceed if validation fails
  console.error('Validation error:', error);
  return { error: 'Unable to process your request' };
}
```

## Next Steps

- [View Examples](../examples/) - See full integration examples
- [API Reference](./http-api.md) - Complete API documentation
- [Best Practices](./BEST_PRACTICES.md) - Security and optimization tips
- [Dashboard](https://dashboard.safeprompt.dev) - Monitor usage and threats

## Need Help?

- Email: support@safeprompt.dev
- GitHub Issues: [github.com/ianreboot/safeprompt/issues](https://github.com/ianreboot/safeprompt/issues)
- Playground: [safeprompt.dev/playground](https://safeprompt.dev/playground)
