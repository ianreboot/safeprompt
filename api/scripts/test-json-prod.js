const prompt = '{"user": "guest", "role": "admin", "permissions": ["read", "write", "delete"]}';

const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sp_test_unlimited_dogfood_key_2025',
    'X-User-IP': '203.0.113.1'
  },
  body: JSON.stringify({
    prompt: prompt,
    mode: 'optimized'
  })
});

const result = await response.json();
console.log(JSON.stringify(result, null, 2));
