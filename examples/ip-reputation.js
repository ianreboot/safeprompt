/**
 * SafePrompt - IP Reputation Example
 *
 * Demonstrates handling IP reputation responses and configuring
 * automatic IP blocking (Starter/Business tier feature).
 *
 * Features:
 * - IP reputation scores (0-1, higher = better)
 * - Automatic blocking of malicious IPs (opt-in)
 * - Network-wide threat intelligence
 *
 * Requirements:
 * - Starter or Business tier subscription
 * - X-User-IP header in API requests
 * - Auto-block preference enabled (optional)
 */

import SafePrompt from 'safeprompt';

const client = new SafePrompt({ apiKey: process.env.SAFEPROMPT_API_KEY });

// Example 1: Basic IP Reputation Checking
async function basicIpReputation(userPrompt, clientIp) {
  console.log('\n=== Example 1: IP Reputation Checking ===\n');

  const result = await client.check(userPrompt, {
    userIp: clientIp // Pass end user's IP address
  });

  console.log('Validation result:', {
    safe: result.safe,
    ipReputation: result.ipReputation
  });

  // Response structure:
  // {
  //   safe: true,
  //   confidence: 0.95,
  //   threats: [],
  //   ipReputation: {
  //     checked: true,           // Whether IP was checked (Starter/Business tiers)
  //     reputationScore: 0.87,   // 0-1 (higher = better reputation)
  //     blocked: false           // Whether request was blocked
  //   }
  // }
}

// Example 2: Handling IP Blocked Responses
async function handleIpBlocked(userPrompt, clientIp) {
  console.log('\n=== Example 2: Handling IP Blocked Responses ===\n');

  try {
    const result = await client.check(userPrompt, { userIp: clientIp });

    if (result.ipReputation?.blocked) {
      // IP was blocked due to poor reputation
      console.log('IP blocked:', {
        reason: result.ipReputation.blockReason,
        score: result.ipReputation.reputationScore
      });

      return {
        error: 'IP_BLOCKED',
        message: 'Your IP address has been flagged for suspicious activity',
        reputationScore: result.ipReputation.reputationScore
      };
    }

    return result;
  } catch (error) {
    if (error.response?.data?.error === 'ip_blocked') {
      // Handle 403 error from API
      console.log('IP blocked by API:', error.response.data);
      return {
        error: 'IP_BLOCKED',
        message: error.response.data.message
      };
    }
    throw error;
  }
}

// Example 3: Express.js Middleware
function ipReputationMiddleware() {
  console.log('\n=== Example 3: Express.js Middleware ===\n');

  return async (req, res, next) => {
    const { prompt } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    try {
      const result = await client.check(prompt, { userIp: clientIp });

      // Check if IP was blocked
      if (result.ipReputation?.blocked) {
        return res.status(403).json({
          error: 'IP blocked',
          message: 'Your IP address has been flagged for suspicious activity',
          reputationScore: result.ipReputation.reputationScore,
          blockReason: result.ipReputation.blockReason
        });
      }

      // Check prompt safety
      if (!result.safe) {
        return res.status(400).json({
          error: 'Unsafe input',
          threats: result.threats,
          ipReputation: result.ipReputation
        });
      }

      // Attach reputation data to request for logging
      req.safeprompt = {
        ipReputation: result.ipReputation
      };

      next();
    } catch (error) {
      console.error('SafePrompt error:', error);
      // Fail open - allow request if SafePrompt is down
      next();
    }
  };
}

// Example 4: Next.js API Route with IP Reputation
function nextjsWithIpReputation() {
  console.log('\n=== Example 4: Next.js API Route ===\n');

  return async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;

    // Get client IP (works with Vercel, Cloudflare, etc.)
    const clientIp =
      req.headers['x-real-ip'] ||
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.connection.remoteAddress;

    // Validate with IP reputation
    const result = await client.check(message, { userIp: clientIp });

    // Handle IP blocking
    if (result.ipReputation?.blocked) {
      return res.status(403).json({
        error: 'IP blocked',
        message: 'Your IP has been flagged. Contact support if this is an error.',
        reputationScore: result.ipReputation.reputationScore
      });
    }

    // Handle unsafe prompts
    if (!result.safe) {
      return res.status(400).json({
        error: 'Unsafe input',
        threats: result.threats,
        ipReputation: result.ipReputation
      });
    }

    // Log reputation for monitoring
    console.log('IP reputation:', {
      ip: clientIp.substring(0, 10) + '...', // Partial for privacy
      score: result.ipReputation.reputationScore
    });

    res.json({
      safe: true,
      ipReputation: result.ipReputation
    });
  };
}

// Example 5: Reputation Score Thresholds
function reputationThresholds(ipReputation) {
  console.log('\n=== Example 5: Reputation Score Interpretation ===\n');

  const score = ipReputation.reputationScore;

  // Interpret reputation scores
  if (score >= 0.8) {
    console.log('✅ Excellent reputation - trusted IP');
    return 'trusted';
  } else if (score >= 0.5) {
    console.log('⚠️ Moderate reputation - monitor activity');
    return 'monitor';
  } else if (score >= 0.3) {
    console.log('⚠️ Poor reputation - high risk');
    return 'high_risk';
  } else {
    console.log('🚫 Very poor reputation - likely malicious');
    return 'block';
  }

  // Note: Starter/Business tiers with auto-block enabled will automatically
  // block IPs below the configured threshold (default: 0.3)
}

// Example 6: Logging and Analytics
async function logIpReputation(prompt, clientIp) {
  console.log('\n=== Example 6: Logging for Analytics ===\n');

  const result = await client.check(prompt, { userIp: clientIp });

  // Log to your analytics system
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: clientIp,
    safe: result.safe,
    threats: result.threats,
    ipReputation: result.ipReputation,
    blocked: result.ipReputation?.blocked || false
  };

  console.log('Analytics log:', JSON.stringify(logEntry, null, 2));

  // Send to analytics (Mixpanel, Segment, etc.)
  // analytics.track('prompt_validation', logEntry);

  return result;
}

// Example 7: Handling Free vs Paid Tier
async function tierDifferences(prompt, clientIp) {
  console.log('\n=== Example 7: Free vs Paid Tier ===\n');

  const result = await client.check(prompt, { userIp: clientIp });

  if (!result.ipReputation?.checked) {
    console.log('Free tier: IP reputation not checked');
    console.log('Upgrade to Starter or Business for IP reputation and auto-blocking');
    return result;
  }

  console.log('Starter/Business tier: IP reputation checked');
  console.log('Reputation score:', result.ipReputation.reputationScore);
  console.log('Blocked:', result.ipReputation.blocked);

  return result;
}

// Run all examples
async function runExamples() {
  try {
    const testPrompt = 'Hello, I need help';
    const testIp = '203.0.113.1';

    await basicIpReputation(testPrompt, testIp);
    await handleIpBlocked(testPrompt, testIp);
    await logIpReputation(testPrompt, testIp);
    await tierDifferences(testPrompt, testIp);

    console.log('\n=== Framework Integration Examples ===\n');
    console.log('See code for Express.js and Next.js integration patterns');

    console.log('\n✅ All examples complete!\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Uncomment to run:
// runExamples();

export {
  basicIpReputation,
  handleIpBlocked,
  ipReputationMiddleware,
  nextjsWithIpReputation,
  reputationThresholds,
  logIpReputation,
  tierDifferences
};
