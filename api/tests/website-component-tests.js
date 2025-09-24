/**
 * SafePrompt Website Component Tests
 * Tests UI elements, user interactions, and flows
 */

import fetch from 'node-fetch';

const TEST_CONFIG = {
  baseUrl: process.env.SAFEPROMPT_WEBSITE_URL || 'http://localhost:3000',
  apiUrl: process.env.SAFEPROMPT_API_URL || 'http://localhost:3001',
  testEmail: `test-${Date.now()}@safeprompt.dev`,
  testApiKey: process.env.TEST_API_KEY || 'sp_test_key_123'
};

// Test utilities
async function fetchPage(path = '/') {
  const response = await fetch(`${TEST_CONFIG.baseUrl}${path}`);
  return {
    status: response.status,
    html: await response.text(),
    headers: response.headers
  };
}

async function submitForm(formData) {
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  return {
    status: response.status,
    data: await response.json()
  };
}

// Component Tests
const componentTests = {
  // 1. Hero Section Tests
  async testHeroSection() {
    console.log('Testing Hero Section...');
    const { html } = await fetchPage();

    const tests = [
      html.includes('SafePrompt'),
      html.includes('Stop Prompt Injection'),
      html.includes('Get Started'),
      html.includes('Join Beta')
    ];

    return {
      name: 'Hero Section',
      passed: tests.every(t => t),
      details: {
        hasTitle: tests[0],
        hasTagline: tests[1],
        hasCTA: tests[2],
        hasBetaButton: tests[3]
      }
    };
  },

  // 2. Attack Theater Tests
  async testAttackTheater() {
    console.log('Testing Attack Theater...');
    const { html } = await fetchPage();

    const attackExamples = [
      'Ignore previous instructions',
      'DROP TABLE',
      'system prompt',
      '<script>',
      'UNION SELECT'
    ];

    const foundExamples = attackExamples.filter(ex => html.includes(ex));

    return {
      name: 'Attack Theater',
      passed: foundExamples.length >= 3,
      details: {
        foundExamples,
        totalExamples: attackExamples.length
      }
    };
  },

  // 3. Pricing Section Tests
  async testPricingSection() {
    console.log('Testing Pricing Section...');
    const { html } = await fetchPage();

    const pricingElements = {
      starterPlan: html.includes('$29/month'),
      businessPlan: html.includes('$99/month'),
      enterprisePlan: html.includes('Custom'),
      betaOffer: html.includes('$5') && html.includes('Early Bird')
    };

    return {
      name: 'Pricing Section',
      passed: Object.values(pricingElements).filter(v => v).length >= 3,
      details: pricingElements
    };
  },

  // 4. Waitlist Form Tests
  async testWaitlistForm() {
    console.log('Testing Waitlist Form...');
    const { html } = await fetchPage();

    // Check form elements
    const formElements = {
      emailInput: html.includes('type="email"'),
      submitButton: html.includes('Join Waitlist') || html.includes('Get Early Access'),
      privacyPolicy: html.includes('Privacy') || html.includes('Terms')
    };

    // Test form submission
    const submitResult = await submitForm({
      email: TEST_CONFIG.testEmail,
      source: 'component_test'
    });

    return {
      name: 'Waitlist Form',
      passed: formElements.emailInput && formElements.submitButton && submitResult.status === 200,
      details: {
        elements: formElements,
        submission: {
          status: submitResult.status,
          success: submitResult.data?.success
        }
      }
    };
  },

  // 5. API Documentation Tests
  async testAPIDocumentation() {
    console.log('Testing API Documentation...');
    const { html } = await fetchPage();

    const docElements = {
      endpoint: html.includes('/api/v1/check'),
      authentication: html.includes('API Key') || html.includes('Authorization'),
      exampleRequest: html.includes('POST') && html.includes('prompt'),
      exampleResponse: html.includes('safe') && html.includes('threats')
    };

    return {
      name: 'API Documentation',
      passed: Object.values(docElements).filter(v => v).length >= 3,
      details: docElements
    };
  },

  // 6. Performance Metrics Display
  async testPerformanceMetrics() {
    console.log('Testing Performance Metrics...');
    const { html } = await fetchPage();

    const metrics = {
      accuracy: html.includes('100%') || html.includes('99.9%'),
      latency: html.includes('ms') || html.includes('milliseconds'),
      uptime: html.includes('99.9%') || html.includes('SLA')
    };

    return {
      name: 'Performance Metrics',
      passed: Object.values(metrics).filter(v => v).length >= 2,
      details: metrics
    };
  },

  // 7. Mobile Responsiveness Test
  async testMobileResponsiveness() {
    console.log('Testing Mobile Responsiveness...');
    const { html } = await fetchPage();

    const responsiveElements = {
      viewport: html.includes('viewport'),
      mobileMenu: html.includes('mobile-menu') || html.includes('burger'),
      responsiveGrid: html.includes('sm:') || html.includes('md:') || html.includes('lg:')
    };

    return {
      name: 'Mobile Responsiveness',
      passed: responsiveElements.viewport && responsiveElements.responsiveGrid,
      details: responsiveElements
    };
  },

  // 8. Early Bird Purchase Flow
  async testEarlyBirdFlow() {
    console.log('Testing Early Bird Purchase Flow...');
    const { html } = await fetchPage();

    const purchaseElements = {
      betaPrice: html.includes('$5'),
      stripeIntegration: html.includes('stripe') || html.includes('checkout'),
      instantAccess: html.includes('Instant Access') || html.includes('immediate')
    };

    return {
      name: 'Early Bird Purchase',
      passed: purchaseElements.betaPrice && purchaseElements.instantAccess,
      details: purchaseElements
    };
  },

  // 9. Interactive Demo Test
  async testInteractiveDemo() {
    console.log('Testing Interactive Demo...');
    const { html } = await fetchPage();

    const demoElements = {
      tryItNow: html.includes('Try it') || html.includes('Test'),
      inputField: html.includes('textarea') || html.includes('input'),
      resultDisplay: html.includes('result') || html.includes('output')
    };

    return {
      name: 'Interactive Demo',
      passed: Object.values(demoElements).filter(v => v).length >= 2,
      details: demoElements
    };
  },

  // 10. Footer and Legal Tests
  async testFooterLegal() {
    console.log('Testing Footer and Legal...');
    const { html } = await fetchPage();

    const footerElements = {
      copyright: html.includes('©') || html.includes('Copyright'),
      rebootMedia: html.includes('Reboot Media') || html.includes('RebootMedia'),
      privacyPolicy: html.includes('Privacy'),
      termsOfService: html.includes('Terms')
    };

    return {
      name: 'Footer & Legal',
      passed: footerElements.copyright && footerElements.rebootMedia,
      details: footerElements
    };
  }
};

// User Journey Tests
const journeyTests = {
  // 1. New Visitor Journey
  async testNewVisitorJourney() {
    console.log('Testing New Visitor Journey...');

    const steps = [];

    // Step 1: Land on homepage
    const homepage = await fetchPage();
    steps.push({
      step: 'Homepage Load',
      success: homepage.status === 200
    });

    // Step 2: View attack examples
    steps.push({
      step: 'View Attack Examples',
      success: homepage.html.includes('SQL Injection') || homepage.html.includes('DROP TABLE')
    });

    // Step 3: Check pricing
    steps.push({
      step: 'Check Pricing',
      success: homepage.html.includes('$29') && homepage.html.includes('$5')
    });

    // Step 4: Join waitlist
    const waitlistResult = await submitForm({
      email: `visitor-${Date.now()}@test.com`
    });
    steps.push({
      step: 'Join Waitlist',
      success: waitlistResult.status === 200
    });

    return {
      name: 'New Visitor Journey',
      passed: steps.every(s => s.success),
      details: steps
    };
  },

  // 2. Developer Integration Journey
  async testDeveloperJourney() {
    console.log('Testing Developer Integration Journey...');

    const steps = [];

    // Step 1: Check API docs
    const homepage = await fetchPage();
    steps.push({
      step: 'Find API Documentation',
      success: homepage.html.includes('/api/v1/check')
    });

    // Step 2: View code examples
    steps.push({
      step: 'View Code Examples',
      success: homepage.html.includes('curl') || homepage.html.includes('fetch')
    });

    // Step 3: Test API endpoint
    const apiTest = await fetch(`${TEST_CONFIG.apiUrl}/api/v1/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TEST_CONFIG.testApiKey
      },
      body: JSON.stringify({ prompt: 'Hello world' })
    });

    steps.push({
      step: 'Test API Endpoint',
      success: apiTest.status === 200 || apiTest.status === 401
    });

    return {
      name: 'Developer Integration',
      passed: steps.filter(s => s.success).length >= 2,
      details: steps
    };
  },

  // 3. Beta Tester Signup Journey
  async testBetaTesterJourney() {
    console.log('Testing Beta Tester Journey...');

    const steps = [];

    // Step 1: Find beta offer
    const homepage = await fetchPage();
    steps.push({
      step: 'Find Beta Offer',
      success: homepage.html.includes('$5') && homepage.html.includes('Early')
    });

    // Step 2: Click early bird
    steps.push({
      step: 'Early Bird CTA',
      success: homepage.html.includes('Get Instant Access') || homepage.html.includes('Join Now')
    });

    // Step 3: Stripe checkout (check if referenced)
    steps.push({
      step: 'Payment Integration',
      success: homepage.html.includes('stripe') || homepage.html.includes('secure')
    });

    return {
      name: 'Beta Tester Signup',
      passed: steps.every(s => s.success),
      details: steps
    };
  }
};

// Main test runner
async function runWebsiteComponentTests() {
  console.log('\n🧪 SAFEPROMPT WEBSITE COMPONENT TESTS\n');
  console.log('=' .repeat(60));

  const results = {
    components: [],
    journeys: [],
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    }
  };

  // Run component tests
  console.log('\n📦 Component Tests:\n');
  for (const [name, test] of Object.entries(componentTests)) {
    try {
      const result = await test();
      results.components.push(result);
      results.summary.totalTests++;

      if (result.passed) {
        results.summary.passedTests++;
        console.log(`✅ ${result.name}`);
      } else {
        results.summary.failedTests++;
        console.log(`❌ ${result.name}`);
        console.log(`   Details:`, result.details);
      }
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      results.summary.failedTests++;
      results.summary.totalTests++;
    }
  }

  // Run journey tests
  console.log('\n🚶 User Journey Tests:\n');
  for (const [name, test] of Object.entries(journeyTests)) {
    try {
      const result = await test();
      results.journeys.push(result);
      results.summary.totalTests++;

      if (result.passed) {
        results.summary.passedTests++;
        console.log(`✅ ${result.name}`);
      } else {
        results.summary.failedTests++;
        console.log(`❌ ${result.name}`);
        console.log(`   Failed steps:`, result.details.filter(s => !s.success));
      }
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      results.summary.failedTests++;
      results.summary.totalTests++;
    }
  }

  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${results.summary.totalTests}`);
  console.log(`Passed: ${results.summary.passedTests} (${Math.round(results.summary.passedTests / results.summary.totalTests * 100)}%)`);
  console.log(`Failed: ${results.summary.failedTests}`);

  // Save results
  const fs = await import('fs').then(m => m.promises);
  await fs.writeFile(
    '/home/projects/safeprompt/api/tests/results/website-component-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\nResults saved to: tests/results/website-component-results.json');

  return results;
}

// Export for use in other tests
export { componentTests, journeyTests, runWebsiteComponentTests };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runWebsiteComponentTests().catch(console.error);
}