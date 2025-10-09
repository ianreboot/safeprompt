#!/usr/bin/env node
/**
 * Detailed test of PROD deployment
 */
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

async function testDetailed() {
  console.log('🔍 Detailed PROD test...\n');

  const API_URL = 'https://api.safeprompt.dev/api/v1/validate';
  const API_KEY = 'sp_test_20220926_internal_tier_api_key_do_not_delete';
  const USER_IP = '203.0.113.42';

  console.log('Testing simple request...');
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-User-IP': USER_IP
    },
    body: JSON.stringify({
      prompt: 'What are your available API endpoints?'
    })
  });

  const result = await response.json();
  console.log('\nFull response:');
  console.log(JSON.stringify(result, null, 2));
}

testDetailed().catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});
