#!/usr/bin/env node
import { config } from 'dotenv';

config({ path: '/home/projects/.env' });

const API_URL = 'https://api.safeprompt.dev/api/v1/validate';
const API_KEY = 'sp_test_unlimited_dogfood_key_2025';
const USER_IP = '203.0.113.42';

console.log('🔍 Debugging PROD API response...\n');

const response = await fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'X-User-IP': USER_IP
  },
  body: JSON.stringify({
    prompt: 'Hello, how can you help me today?'
  })
});

console.log('Status:', response.status);
console.log('Headers:', Object.fromEntries(response.headers.entries()));
console.log('\nResponse body:');

const text = await response.text();
try {
  const json = JSON.parse(text);
  console.log(JSON.stringify(json, null, 2));
} catch {
  console.log('Raw text:', text);
}
