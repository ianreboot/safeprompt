const { chromium } = require('playwright');

async function debugConsoleErrors() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const sites = [
    { name: 'Dashboard DEV', url: 'https://e778445b.safeprompt-dashboard-dev.pages.dev' },
    { name: 'Website DEV', url: 'https://97a2d944.safeprompt-dev.pages.dev' }
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

    page.on('pageerror', error => {
      errors.push(`PAGE ERROR: ${error.message}`);
    });

    try {
      await page.goto(site.url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await page.waitForTimeout(3000);

      console.log('\n📊 CONSOLE SUMMARY:');
      console.log(`  Total messages: ${consoleMessages.length}`);
      console.log(`  Errors: ${errors.length}`);
      console.log(`  Warnings: ${warnings.length}`);

      if (errors.length > 0) {
        console.log('\n❌ ERRORS FOUND:');
        errors.slice(0, 10).forEach((err, idx) => {
          console.log(`\n  ${idx + 1}. ${err.substring(0, 200)}`);
        });
        if (errors.length > 10) {
          console.log(`\n  ... and ${errors.length - 10} more errors`);
        }
      } else {
        console.log('\n✅ NO ERRORS DETECTED');
      }

      if (warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        warnings.slice(0, 3).forEach((warn, idx) => {
          console.log(`\n  ${idx + 1}. ${warn.substring(0, 150)}`);
        });
        if (warnings.length > 3) {
          console.log(`\n  ... and ${warnings.length - 3} more warnings`);
        }
      }

      const reactHydrationErrors = errors.filter(e =>
        e.includes('Minified React error #418') ||
        e.includes('Minified React error #423') ||
        e.includes('Hydration')
      );

      const cspErrors = errors.filter(e =>
        e.includes('Content Security Policy') ||
        e.includes('region1.google-analytics.com')
      );

      const supabaseWarnings = consoleMessages.filter(m =>
        m.text.includes('GoTrueClient') ||
        m.text.includes('Multiple')
      );

      if (reactHydrationErrors.length > 0) {
        console.log('\n🔴 REACT HYDRATION ERRORS:');
        console.log(`   Count: ${reactHydrationErrors.length}`);
      } else {
        console.log('\n✅ NO REACT HYDRATION ERRORS');
      }

      if (cspErrors.length > 0) {
        console.log('\n🔴 CSP ERRORS:');
        console.log(`   Count: ${cspErrors.length}`);
      } else {
        console.log('\n✅ NO CSP ERRORS');
      }

      if (supabaseWarnings.length > 0) {
        console.log('\n🟡 SUPABASE WARNINGS:');
        console.log(`   Count: ${supabaseWarnings.length}`);
      } else {
        console.log('\n✅ NO SUPABASE WARNINGS');
      }

    } catch (error) {
      console.log(`\n❌ FAILED TO LOAD PAGE: ${error.message}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\n' + '='.repeat(80));
  console.log('TESTING COMPLETE');
  console.log('='.repeat(80));
}

debugConsoleErrors().catch(console.error);
