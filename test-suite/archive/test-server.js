/**
 * Simple test server for SafePrompt API
 * No Vercel CLI required
 */

import http from 'http';
import { validatePrompt, CONFIDENCE_THRESHOLDS } from './lib/prompt-validator.js';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only handle check endpoint
  if (req.url !== '/api/v1/check' || req.method !== 'POST') {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Collect body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      // Parse request
      let prompt;
      try {
        const parsed = JSON.parse(body);
        prompt = parsed.prompt || parsed.text || parsed.input;
      } catch {
        // Plain text
        prompt = body;
      }

      if (!prompt) {
        res.writeHead(400);
        res.end(JSON.stringify({
          error: 'Bad request',
          message: 'Missing prompt in request body'
        }));
        return;
      }

      // Validate
      const validationResult = validatePrompt(prompt);

      // Determine action
      let action = 'allow';
      let requiresAI = false;

      if (!validationResult.safe) {
        if (validationResult.confidence <= CONFIDENCE_THRESHOLDS.DEFINITELY_UNSAFE) {
          action = 'block';
        } else if (validationResult.confidence <= CONFIDENCE_THRESHOLDS.UNCERTAIN) {
          action = 'review';
          requiresAI = true;
        } else {
          action = 'caution';
        }
      } else {
        if (validationResult.confidence < CONFIDENCE_THRESHOLDS.PROBABLY_SAFE) {
          requiresAI = true;
        }
      }

      // Send response
      res.writeHead(200);
      res.end(JSON.stringify({
        safe: validationResult.safe,
        action: action,
        confidence: validationResult.confidence,
        threats: validationResult.threats || [],
        processingTime: validationResult.processingTime,
        validationType: 'regex',
        requiresAI: requiresAI
      }));

    } catch (error) {
      console.error('Error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({
        safe: false,
        action: 'block',
        confidence: 0.01,
        threats: ['internal_error'],
        error: error.message
      }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`SafePrompt API running on http://localhost:${PORT}`);
  console.log(`Test endpoint: POST http://localhost:${PORT}/api/v1/check`);
});