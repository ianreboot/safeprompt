/**
 * ESM validator for internal use
 * This allows endpoints to validate prompts using the SafePrompt API
 */

import https from 'https';

// Use the same validation endpoint internally but with special header
export async function validateInternal(prompt, options = {}) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      prompt: prompt,
      mode: options.mode || 'optimized'
    });

    const requestOptions = {
      hostname: 'api.safeprompt.dev',
      path: '/api/v1/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-API-Key': 'sp_test_unlimited_dogfood_key_2025', // Dogfooding account (treated as regular user)
        'X-Internal-Request': 'true' // Optional marker (not used for special treatment)
      },
      timeout: 5000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            resolve(result);
          } else {
            console.error(`Validation API error: ${res.statusCode}`);
            // Fail closed on error
            resolve({
              safe: false,
              error: `API returned status ${res.statusCode}`,
              threats: ['validation_error']
            });
          }
        } catch (error) {
          console.error('Validation parse error:', error);
          // Fail closed on parse error
          resolve({
            safe: false,
            error: 'Failed to parse validation response',
            threats: ['validation_error']
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Validation request error:', error);
      // Fail closed on network error
      resolve({
        safe: false,
        error: 'Network error during validation',
        threats: ['validation_error']
      });
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('Validation request timeout');
      // Fail closed on timeout
      resolve({
        safe: false,
        error: 'Validation request timed out',
        threats: ['validation_error']
      });
    });

    req.write(postData);
    req.end();
  });
}