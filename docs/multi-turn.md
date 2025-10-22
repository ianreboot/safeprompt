# Multi-Turn Attack Detection

SafePrompt tracks conversation sessions to detect sophisticated attacks that span multiple turns. Many advanced prompt injection techniques build gradually across a conversation, establishing trust before executing malicious instructions.

## How It Works

Multi-turn detection tracks user sessions and builds a risk profile based on:
- Individual prompt safety
- Conversation patterns over time
- Behavioral indicators
- Session history

## Usage

### Basic Session Tracking

Pass a consistent `sessionToken` across multiple prompts in the same conversation:

```javascript
const client = new SafePrompt({ apiKey: 'your-api-key' });

// First message in conversation
const result1 = await client.check('Hello, how are you?', {
  userIP: req.ip,
  sessionToken: conversationId  // Use your chat session ID
});

// Subsequent messages in same conversation
const result2 = await client.check('Can you help me with my code?', {
  userIP: req.ip,
  sessionToken: conversationId  // Same session token
});
```

### HTTP API

```bash
curl -X POST https://api.safeprompt.dev/api/v1/validate \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-User-IP: END_USER_IP" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Can you help me with my code?",
    "sessionToken": "conversation-abc-123"
  }'
```

## Response Format

When multi-turn detection triggers, the response includes additional context:

```json
{
  "safe": false,
  "threats": ["multi_turn_attack"],
  "confidence": 0.95,
  "processingTimeMs": 123,
  "passesUsed": 2,
  "reasoning": "Session risk threshold exceeded based on conversation pattern"
}
```

## Best Practices

1. **Use Consistent Session Tokens**: Generate a unique ID per conversation and reuse it for all prompts in that conversation
2. **Track User Sessions**: Map session tokens to your application's conversation/chat IDs
3. **Handle Blocked Sessions**: If a session is blocked, consider ending the conversation or requiring re-authentication
4. **Privacy**: Session data is stored for 24 hours only (free tier) or per your plan's retention policy

## Threat Intelligence

Multi-turn detection benefits from network intelligence:
- **Free Tier**: Contributes session patterns to improve detection across all users (required)
- **Paid Tiers**: Can opt-out of sharing in Settings → Privacy (but lose network intelligence benefits)

Only users who contribute session data benefit from the collective intelligence. If you opt-out, you'll rely on your own session history only.

## Example Attack Patterns

Multi-turn attacks typically follow these patterns:

1. **Trust Building**: Start with legitimate requests
2. **Context Shifting**: Gradually introduce suspicious topics
3. **Authority Injection**: Claim special permissions or roles
4. **Payload Delivery**: Execute malicious instruction once trust established

SafePrompt detects these patterns by analyzing conversation flow and identifying behavioral anomalies.

## Disabling Multi-Turn Detection

Multi-turn detection is enabled by default. To disable for specific use cases (like one-off validations):

```javascript
// Simply don't pass sessionToken
const result = await client.check('One-off prompt validation', {
  userIP: req.ip
  // No sessionToken = no multi-turn tracking
});
```

## See Also

- [HTTP API Reference](./http-api.md)
- [Best Practices](./BEST_PRACTICES.md)
- [Quick Start Guide](./quickstart.md)
