/**
 * CommonJS wrapper for ES6 AI validator
 * This allows CommonJS endpoints to use the ES6 validation module
 */

const fetch = require('node-fetch');

// Use the same validation endpoint internally but with special header
async function validateInternal(prompt, options = {}) {
  try {
    const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'sp_test_unlimited_dogfood_key_2025', // Internal unlimited key
        'X-Internal-Request': 'true' // Mark as internal
      },
      body: JSON.stringify({
        prompt: prompt,
        mode: options.mode || 'optimized'
      }),
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`Validation API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Internal validation error:', error);
    // Fail closed on error
    return {
      safe: false,
      error: error.message,
      threats: ['validation_error']
    };
  }
}

module.exports = { validateInternal };