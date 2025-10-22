const { chromium } = require('playwright');

async function debugConsoleErrors() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const sites = [
    { name: 'Dashboard DEV', url: 'https://49d0499f.safeprompt-dashboard-dev.pages.dev' },
    { name: 'Website DEV', url: 'https://47c094c2.safeprompt-dev.pages.dev' },
    { name: 'Dashboard PROD', url: 'https://dashboard.safeprompt.dev' },
    { name: 'Website PROD', url: 'https://safeprompt.dev' }
  ];

  for (const site of sites) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TESTING: ${site.name}`);
    console.log(`URL: ${site.url}`);
    console.log('='.repeat(80));

    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleMessages = [];
    const errors = [];
    const warnings = [];

    // Capture all console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });

      if (type === 'error') {
        errors.push(text);
      } else if (type === 'warning') {
        warnings.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      errors.push(`PAGE ERROR: ${error.message}`);
    });

    try {
      // Visit page and wait for network to be idle
      await page.goto(site.url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait a bit for any async errors
      await page.waitForTimeout(3000);

      // Report findings
      console.log('\n📊 CONSOLE SUMMARY:');
      console.log(`  Total messages: ${consoleMessages.length}`);
      console.log(`  Errors: ${errors.length}`);
      console.log(`  Warnings: ${warnings.length}`);

      if (errors.length > 0) {
        console.log('\n❌ ERRORS FOUND:');
        errors.forEach((err, idx) => {
          console.log(`\n  ${idx + 1}. ${err}`);
        });
      } else {
        console.log('\n✅ NO ERRORS DETECTED');
      }

      if (warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        warnings.slice(0, 5).forEach((warn, idx) => {
          console.log(`\n  ${idx + 1}. ${warn.substring(0, 200)}...`);
        });
        if (warnings.length > 5) {
          console.log(`\n  ... and ${warnings.length - 5} more warnings`);
        }
      }

      // Check for specific error patterns
      const reactHydrationErrors = errors.filter(e =>
        e.includes('Minified React error #418') ||
        e.includes('Minified React error #423') ||
        e.includes('Hydration')
      );

      const supabaseWarnings = consoleMessages.filter(m =>
        m.text.includes('GoTrueClient') ||
        m.text.includes('Multiple')
      );

      if (reactHydrationErrors.length > 0) {
        console.log('\n🔴 REACT HYDRATION ERRORS DETECTED:');
        console.log(`   Count: ${reactHydrationErrors.length}`);
      }

      if (supabaseWarnings.length > 0) {
        console.log('\n🟡 SUPABASE WARNINGS DETECTED:');
        console.log(`   Count: ${supabaseWarnings.length}`);
        supabaseWarnings.forEach(w => console.log(`   - ${w.text.substring(0, 150)}`));
      }

      // Take screenshot
      const screenshotPath = `/tmp/screenshot-${site.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

    } catch (error) {
      console.log(`\n❌ FAILED TO LOAD PAGE: ${error.message}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\n' + '='.repeat(80));
  console.log('DEBUGGING COMPLETE');
  console.log('='.repeat(80));
}

debugConsoleErrors().catch(console.error);
