#!/usr/bin/env node
/**
 * SafePrompt Simple Health Check
 *
 * Startup-focused monitoring - just enough to know if things are broken
 * Run this via cron every 5 minutes: 0,5,10,15,20,25,30,35,40,45,50,55 * * * * /home/projects/safeprompt/simple-health-check.js
 */

import https from 'https';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '/home/projects/.env' });

const ENDPOINTS_TO_TEST = [
  {
    name: 'Website',
    url: 'https://safeprompt.dev/',
    expectText: 'SafePrompt',
    critical: true
  },
  {
    name: 'Basic API',
    url: 'https://api.safeprompt.dev/api/v1/validate',
    method: 'POST',
    data: JSON.stringify({ prompt: 'Hello world' }),
    headers: { 'Content-Type': 'application/json' },
    expectJson: true,
    expectField: 'safe',
    critical: true
  },
  {
    name: 'Waitlist API',
    url: 'https://api.safeprompt.dev/api/waitlist',
    method: 'POST',
    data: JSON.stringify({ email: `test+${Date.now()}@example.com` }),
    headers: { 'Content-Type': 'application/json' },
    expectJson: true,
    critical: false
  }
];

// Initialize Supabase for database health check
const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || ''
);

function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.url);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: endpoint.method || 'GET',
      headers: endpoint.headers || {},
      timeout: 10000 // 10 second timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            body: data,
            headers: res.headers
          };
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);

    if (endpoint.data) {
      req.write(endpoint.data);
    }

    req.end();
  });
}

async function testEndpoint(endpoint) {
  const start = Date.now();

  try {
    const response = await makeRequest(endpoint);
    const responseTime = Date.now() - start;

    // Check status code
    if (response.status >= 400) {
      return {
        name: endpoint.name,
        status: 'FAIL',
        error: `HTTP ${response.status}`,
        responseTime,
        critical: endpoint.critical
      };
    }

    // Check expected text
    if (endpoint.expectText && !response.body.includes(endpoint.expectText)) {
      return {
        name: endpoint.name,
        status: 'FAIL',
        error: `Expected text "${endpoint.expectText}" not found`,
        responseTime,
        critical: endpoint.critical
      };
    }

    // Check expected JSON field
    if (endpoint.expectJson) {
      try {
        const json = JSON.parse(response.body);
        if (endpoint.expectField && !(endpoint.expectField in json)) {
          return {
            name: endpoint.name,
            status: 'FAIL',
            error: `Expected field "${endpoint.expectField}" not found`,
            responseTime,
            critical: endpoint.critical
          };
        }
      } catch (error) {
        return {
          name: endpoint.name,
          status: 'FAIL',
          error: `Invalid JSON response`,
          responseTime,
          critical: endpoint.critical
        };
      }
    }

    return {
      name: endpoint.name,
      status: 'OK',
      responseTime,
      critical: endpoint.critical
    };

  } catch (error) {
    return {
      name: endpoint.name,
      status: 'FAIL',
      error: error.message,
      responseTime: Date.now() - start,
      critical: endpoint.critical
    };
  }
}

async function testDatabase() {
  const start = Date.now();

  try {
    // Simple database query to test connection
    const { data, error } = await supabase
      .from('waitlist')
      .select('count(*)')
      .limit(1);

    if (error) {
      return {
        name: 'Database',
        status: 'FAIL',
        error: error.message,
        responseTime: Date.now() - start,
        critical: true
      };
    }

    return {
      name: 'Database',
      status: 'OK',
      responseTime: Date.now() - start,
      critical: true
    };

  } catch (error) {
    return {
      name: 'Database',
      status: 'FAIL',
      error: error.message,
      responseTime: Date.now() - start,
      critical: true
    };
  }
}

async function runHealthCheck() {
  console.log(`[${new Date().toISOString()}] SafePrompt Health Check Starting...`);

  const results = [];

  // Test all endpoints
  for (const endpoint of ENDPOINTS_TO_TEST) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }

  // Test database
  const dbResult = await testDatabase();
  results.push(dbResult);

  // Calculate summary
  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === 'OK').length;
  const failedTests = totalTests - passedTests;
  const criticalFails = results.filter(r => r.status === 'FAIL' && r.critical).length;
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests
  );

  // Print results
  console.log(`\n📊 SUMMARY: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`⚡ Average Response Time: ${avgResponseTime}ms`);

  if (criticalFails > 0) {
    console.log(`🚨 CRITICAL FAILURES: ${criticalFails} critical services down`);
  }

  console.log('\n📋 DETAILED RESULTS:');
  results.forEach(result => {
    const status = result.status === 'OK' ? '✅' : '❌';
    const critical = result.critical ? '🔴' : '🟡';
    const time = `${result.responseTime}ms`;

    if (result.status === 'OK') {
      console.log(`${status} ${critical} ${result.name.padEnd(15)} ${time.padStart(6)}`);
    } else {
      console.log(`${status} ${critical} ${result.name.padEnd(15)} ${time.padStart(6)} - ${result.error}`);
    }
  });

  // Exit with error code if critical services are down
  if (criticalFails > 0) {
    console.log(`\n🚨 SYSTEM STATUS: DEGRADED (${criticalFails} critical services down)`);
    process.exit(1);
  } else {
    console.log(`\n✅ SYSTEM STATUS: OPERATIONAL (all critical services up)`);
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHealthCheck().catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
}

export { runHealthCheck };