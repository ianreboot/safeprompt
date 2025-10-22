# HTTP API Reference

For users who prefer to use the HTTP API directly instead of the SDK.

## Authentication

All API requests require **two** headers:

```
X-API-Key: YOUR_API_KEY
X-User-IP: END_USER_IP_ADDRESS
```

### X-User-IP Header (Required)

The `X-User-IP` header must contain the **end user's IP address** (the person submitting the prompt), not your server's IP address.

This is critical for:
- Threat intelligence collection (correlating attack patterns)
- Identifying actual attackers vs. legitimate API integrations

**How to get the end user's IP:**

**Express.js:**
```javascript
const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
```

**Flask/Django:**
```python
client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
```

**Next.js:**
```javascript
const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
```

## Endpoint

```
POST https://api.safeprompt.dev/api/v1/validate
```

## Request

```bash
curl -X POST https://api.safeprompt.dev/api/v1/validate \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-User-IP: 203.0.113.45" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello world"}'
```

### Request Body

```json
{
  "prompt": "string",           // Required: The prompt to validate
  "mode": "optimized",          // Optional: standard, optimized, ai-only, with-cache
  "include_stats": false        // Optional: Include performance statistics
}
```

## Response

```json
{
  "safe": true,                // Boolean: Is the prompt safe to use?
  "confidence": 0.95,          // Float 0-1: How confident is the verdict?
  "threats": [],               // Array: Detected threat types (empty if safe)
  "processingTime": 250,       // Integer: Response time in milliseconds
  "detectionMethod": "pattern_detection",  // String: Detection stage
  "reasoning": "No security threats detected"  // String: Why this verdict?
}
```

## Examples

### Node.js/JavaScript

```javascript
async function checkPrompt(userInput, clientIp) {
  const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.SAFEPROMPT_API_KEY,
      'X-User-IP': clientIp,  // End user's IP address
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt: userInput })
  });

  const result = await response.json();

  if (!result.safe) {
    throw new Error(`Blocked: ${result.threats?.[0] || 'Security threat detected'}`);
  }

  return result;
}

// Express.js integration
app.post('/api/chat', async (req, res) => {
  const userPrompt = req.body.prompt;
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  const validation = await checkPrompt(userPrompt, clientIp);
  if (!validation.safe) {
    return res.status(400).json({
      error: 'Security threat detected',
      threats: validation.threats
    });
  }

  // Continue with AI processing...
});
```

### Python

```python
import requests

def check_prompt(user_input, client_ip):
    response = requests.post(
        'https://api.safeprompt.dev/api/v1/validate',
        headers={
            'X-API-Key': os.environ["SAFEPROMPT_API_KEY"],
            'X-User-IP': client_ip,  # End user's IP address
            'Content-Type': 'application/json'
        },
        json={'prompt': user_input}
    )

    result = response.json()
    if not result['safe']:
        threats = result.get('threats', ['Security threat detected'])
        raise ValueError(f"Blocked: {threats[0]}")

    return result

# Flask integration
from flask import Flask, request, jsonify

@app.route('/api/chat', methods=['POST'])
def chat():
    user_prompt = request.json.get('prompt')
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)

    validation = check_prompt(user_prompt, client_ip)
    if not validation['safe']:
        return jsonify({
            'error': 'Security threat detected',
            'threats': validation.get('threats', [])
        }), 400

    # Continue with AI processing...
```

### PHP

```php
// Get client IP address
$clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];

$ch = curl_init('https://api.safeprompt.dev/api/v1/validate');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: ' . $_ENV['SAFEPROMPT_API_KEY'],
    'X-User-IP: ' . $clientIp,  // End user's IP address
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'prompt' => $userInput
]));

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);

if (!$result['safe']) {
    die('Security threat detected: ' . $result['threats'][0]);
}
```

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid input or missing X-User-IP header) |
| 401 | Unauthorized (invalid API key) |
| 403 | Forbidden (subscription expired) |
| 429 | Too many requests (rate limited) |
| 500 | Internal server error |

### Common Errors

**Missing X-User-IP Header:**
```json
{
  "error": "X-User-IP header required",
  "message": "Please provide the end user's IP address via X-User-IP header for threat intelligence tracking"
}
```

**Invalid API Key:**
```json
{
  "error": "Invalid API key"
}
```

## Rate Limits

| Tier | Requests/Second | Monthly Limit |
|------|----------------|---------------|
| Free | 10 | 1,000 |
| Starter | 50 | 10,000 |
| Business | 100 | 250,000 |

## Recommendation

**We strongly recommend using the official SDK instead of the HTTP API directly:**

```bash
npm install safeprompt
```

The SDK handles authentication, error handling, retries, and the X-User-IP header automatically.
