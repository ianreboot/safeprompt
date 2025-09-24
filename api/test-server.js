/**
 * SafePrompt Test Server
 * Simple HTTP server for testing the API endpoints
 */

import { createServer } from 'http';
import { validatePrompt } from './lib/prompt-validator.js';
import { validateWithAI } from './lib/ai-validator.js';

const PORT = 3000;

// Simple router
async function handleRequest(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Route: /api/v1/check
  if (url.pathname === '/api/v1/check' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { prompt } = JSON.parse(body);

        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing prompt' }));
          return;
        }

        // First, validate with regex
        const regexResult = validatePrompt(prompt);

        // If testing backdoor, return immediately
        if (regexResult.testing) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(regexResult));
          return;
        }

        // If high confidence malicious, return immediately
        if (regexResult.confidence >= 0.95 && !regexResult.safe) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(regexResult));
          return;
        }

        // If uncertain, check with AI
        if (regexResult.confidence < 0.95) {
          try {
            const aiResult = await validateWithAI(prompt);

            // Combine results
            const finalResult = {
              safe: regexResult.safe && aiResult.safe,
              threats: [...new Set([...regexResult.threats, ...aiResult.threats])],
              confidence: Math.max(regexResult.confidence, aiResult.confidence),
              processingTime: regexResult.processingTime + aiResult.processingTime,
              aiUsed: true,
              testing: aiResult.testing || false
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(finalResult));
          } catch (aiError) {
            // AI failed, use regex result
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              ...regexResult,
              aiError: aiError.message
            }));
          }
        } else {
          // High confidence from regex, skip AI
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(regexResult));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Internal server error',
          message: error.message
        }));
      }
    });
    return;
  }

  // Route: /api/v1/check-with-ai
  if (url.pathname === '/api/v1/check-with-ai' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { prompt } = JSON.parse(body);

        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing prompt' }));
          return;
        }

        // Always use AI for this endpoint
        const aiResult = await validateWithAI(prompt);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(aiResult));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'AI validation failed',
          message: error.message
        }));
      }
    });
    return;
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Create server
const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`SafePrompt API running on http://localhost:${PORT}`);
  console.log(`Test endpoint: POST http://localhost:${PORT}/api/v1/check`);
  console.log('\nTesting mode:', process.env.SAFEPROMPT_TESTING === 'true' ? 'ENABLED' : 'DISABLED');
  if (process.env.SAFEPROMPT_TESTING === 'true') {
    console.log('Backdoor prompts active for testing');
  }
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});