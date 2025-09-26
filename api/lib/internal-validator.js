/**
 * CommonJS wrapper for ES6 AI validator
 * This allows CommonJS endpoints to use the ES6 validation module
 */

const https = require('https');

// Use the same validation endpoint internally but with special header
async function validateInternal(prompt, options = {}) {
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
        'X-API-Key': 'sp_test_unlimited_dogfood_key_2025', // Internal unlimited key
        'X-Internal-Request': 'true' // Mark as internal
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
          console.error('Parse error:', error);
          // Fail closed on error
          resolve({
            safe: false,
            error: error.message,
            threats: ['validation_error']
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Internal validation error:', error);
      // Fail closed on error
      resolve({
        safe: false,
        error: error.message,
        threats: ['validation_error']
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        safe: false,
        error: 'Request timeout',
        threats: ['validation_error']
      });
    });

    req.write(postData);
    req.end();
  });
}

module.exports = { validateInternal };