/**
 * SafePrompt - User Preferences Management Example
 *
 * Demonstrates paid tier preference management:
 * - Intelligence sharing (contribute threat data)
 * - Automatic IP blocking (opt-in for Starter/Business tiers)
 * - Privacy controls (data deletion, export)
 *
 * Requirements:
 * - Starter or Business tier subscription
 * - User authentication
 */

import SafePrompt from 'safeprompt';

const client = new SafePrompt({ apiKey: process.env.SAFEPROMPT_API_KEY });

// Example 1: Get Current Preferences
async function getPreferences() {
  console.log('\n=== Example 1: Get User Preferences ===\n');

  const preferences = await client.preferences.get();

  console.log('Current preferences:', preferences);

  // Response structure:
  // {
  //   contribute_intelligence: true,      // Share anonymized threat data
  //   enable_ip_blocking: false,          // Auto-block bad IPs (Starter/Business tiers)
  //   ip_block_threshold: 0.3,            // Reputation threshold (0-1)
  //   notification_email: 'user@example.com',
  //   alert_on_blocked_ips: true
  // }

  return preferences;
}

// Example 2: Enable IP Blocking (Starter/Business Tier)
async function enableIpBlocking() {
  console.log('\n=== Example 2: Enable IP Blocking ===\n');

  // Update preferences to enable automatic IP blocking
  const updated = await client.preferences.update({
    enable_ip_blocking: true,
    ip_block_threshold: 0.3 // Block IPs with score < 0.3
  });

  console.log('IP blocking enabled:', updated);

  // Now bad IPs will be automatically blocked with 403 response
  return updated;
}

// Example 3: Disable Intelligence Sharing
async function disableIntelligenceSharing() {
  console.log('\n=== Example 3: Disable Intelligence Sharing ===\n');

  // Starter/Business tiers can opt out of intelligence sharing
  // (Free tier must contribute to use the service)
  const updated = await client.preferences.update({
    contribute_intelligence: false
  });

  console.log('Intelligence sharing disabled:', updated);

  return updated;
}

// Example 4: Adjust IP Block Threshold
async function adjustBlockThreshold(threshold) {
  console.log('\n=== Example 4: Adjust IP Block Threshold ===\n');

  // threshold: 0.0 (block almost all) to 1.0 (block none)
  // Recommended: 0.2-0.4
  const updated = await client.preferences.update({
    enable_ip_blocking: true,
    ip_block_threshold: threshold
  });

  console.log(`Block threshold set to ${threshold}:`, updated);

  // Threshold guide:
  // 0.1: Extremely strict - may block legitimate users
  // 0.3: Recommended - good balance (default)
  // 0.5: Moderate - blocks only obvious bad actors
  // 0.7+: Permissive - blocks very few IPs

  return updated;
}

// Example 5: Settings UI Component (React)
function SettingsComponent() {
  console.log('\n=== Example 5: React Settings Component ===\n');

  // Example React component code
  const code = `
import { useState, useEffect } from 'react';
import SafePrompt from 'safeprompt';

function SafePromptSettings() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  const client = new SafePrompt({ apiKey: process.env.SAFEPROMPT_API_KEY });

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    const prefs = await client.preferences.get();
    setPreferences(prefs);
    setLoading(false);
  }

  async function toggleIpBlocking(enabled) {
    setLoading(true);
    await client.preferences.update({
      enable_ip_blocking: enabled
    });
    await loadPreferences();
  }

  async function updateThreshold(threshold) {
    setLoading(true);
    await client.preferences.update({
      ip_block_threshold: parseFloat(threshold)
    });
    await loadPreferences();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>SafePrompt Settings</h2>

      {/* Intelligence Sharing */}
      <label>
        <input
          type="checkbox"
          checked={preferences.contribute_intelligence}
          onChange={(e) => client.preferences.update({
            contribute_intelligence: e.target.checked
          })}
        />
        Share anonymized threat intelligence
      </label>

      {/* IP Blocking (Starter/Business tier) */}
      <label>
        <input
          type="checkbox"
          checked={preferences.enable_ip_blocking}
          onChange={(e) => toggleIpBlocking(e.target.checked)}
        />
        Automatically block malicious IPs (Starter/Business tier)
      </label>

      {/* Block Threshold */}
      {preferences.enable_ip_blocking && (
        <div>
          <label>
            Block threshold: {preferences.ip_block_threshold}
            <input
              type="range"
              min="0.1"
              max="0.7"
              step="0.1"
              value={preferences.ip_block_threshold}
              onChange={(e) => updateThreshold(e.target.value)}
            />
          </label>
          <p>Lower = stricter (more blocking)</p>
        </div>
      )}
    </div>
  );
}
`;

  console.log(code);
}

// Example 6: Express.js Settings API
function settingsApiEndpoints() {
  console.log('\n=== Example 6: Express.js Settings API ===\n');

  const code = `
// GET /api/settings
app.get('/api/settings', async (req, res) => {
  const client = new SafePrompt({
    apiKey: req.user.safepromptApiKey
  });

  const preferences = await client.preferences.get();
  res.json(preferences);
});

// PATCH /api/settings
app.patch('/api/settings', async (req, res) => {
  const { enable_ip_blocking, ip_block_threshold } = req.body;

  const client = new SafePrompt({
    apiKey: req.user.safepromptApiKey
  });

  const updated = await client.preferences.update({
    enable_ip_blocking,
    ip_block_threshold
  });

  res.json(updated);
});
`;

  console.log(code);
}

// Example 7: Privacy Controls
async function privacyControls() {
  console.log('\n=== Example 7: Privacy Controls ===\n');

  // Export user data (GDPR right to access)
  console.log('Exporting user data...');
  const exported = await client.privacy.export();
  console.log('Data export:', exported);

  // Delete user data (GDPR right to deletion)
  // WARNING: This deletes all intelligence samples
  // await client.privacy.delete();
  // console.log('User data deleted');

  return exported;
}

// Example 8: Best Practices for Settings
function bestPractices() {
  console.log('\n=== Example 8: Best Practices ===\n');

  const practices = [
    {
      setting: 'IP Blocking',
      recommendation: 'Enable for production apps',
      reason: 'Automatically blocks known bad actors',
      threshold: '0.3 (default) for most use cases'
    },
    {
      setting: 'Intelligence Sharing',
      recommendation: 'Keep enabled (Starter/Business tiers can opt out)',
      reason: 'Improves network-wide protection',
      note: 'All data anonymized after 24 hours (GDPR/CCPA compliant)'
    },
    {
      setting: 'Block Threshold',
      recommendation: 'Start at 0.3, adjust based on false positives',
      reason: 'Lower = stricter blocking, higher = more permissive',
      warning: 'Values below 0.2 may block legitimate users'
    },
    {
      setting: 'Notifications',
      recommendation: 'Enable alerts for blocked IPs',
      reason: 'Monitor for false positives and adjust threshold',
      note: 'Check email for IP block alerts'
    }
  ];

  console.table(practices);

  return practices;
}

// Example 9: Testing Preferences
async function testPreferences() {
  console.log('\n=== Example 9: Testing Preferences ===\n');

  // Get current state
  const current = await client.preferences.get();
  console.log('Before:', current);

  // Enable IP blocking
  await client.preferences.update({
    enable_ip_blocking: true,
    ip_block_threshold: 0.3
  });

  // Test validation with blocking enabled
  const testResult = await client.check('test prompt', {
    userIp: '203.0.113.1'
  });

  console.log('Validation result:', {
    safe: testResult.safe,
    ipReputation: testResult.ipReputation
  });

  // Restore original settings
  await client.preferences.update(current);
  console.log('Restored original settings');
}

// Run all examples
async function runExamples() {
  try {
    await getPreferences();
    // await enableIpBlocking(); // Uncomment to test
    // await adjustBlockThreshold(0.3); // Uncomment to test

    console.log('\n=== UI Integration Examples ===\n');
    SettingsComponent();
    settingsApiEndpoints();

    await privacyControls();
    bestPractices();

    console.log('\n✅ All examples complete!\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Uncomment to run:
// runExamples();

export {
  getPreferences,
  enableIpBlocking,
  disableIntelligenceSharing,
  adjustBlockThreshold,
  SettingsComponent,
  settingsApiEndpoints,
  privacyControls,
  bestPractices,
  testPreferences
};
