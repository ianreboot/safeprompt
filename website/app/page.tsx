'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TypeAnimation } from 'react-type-animation'
import AttackTheater from '@/components/AttackTheater'
import WaitlistForm from '@/components/WaitlistForm'
import SpeedComparison from '@/components/SpeedComparison'
import LiveMetrics from '@/components/LiveMetrics'
import CodeDemo from '@/components/CodeDemo'
import PricingCard from '@/components/PricingCard'

export default function Home() {
  const [waitlistCount, setWaitlistCount] = useState(0)

  useEffect(() => {
    // Fetch real waitlist count from API
    fetch('https://api.safeprompt.dev/api/waitlist/count')
      .then(res => res.json())
      .then(data => {
        if (data.count) {
          setWaitlistCount(data.count)
        }
      })
      .catch(err => {
        console.error('Failed to fetch waitlist count:', err)
        // Don't show fake numbers - better to show nothing
      })
  }, [])

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold gradient-text">SafePrompt</span>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">BETA</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition">Pricing</a>
            <a href="https://dashboard.safeprompt.dev" className="text-muted-foreground hover:text-foreground transition">Dashboard</a>
            <a href="#docs" className="text-muted-foreground hover:text-foreground transition">Docs</a>
            <a href="#get-started" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Stop Prompt Injection
              <br />
              <span className="gradient-text">In One Line of Code</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Your AI is processing contact forms, Gmail summaries, and Airtable automations.
              One malicious prompt could compromise everything. SafePrompt stops attacks before they start.
            </p>

            {/* Waitlist Counter */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              {waitlistCount > 0 && (
                <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-lg border border-border">
                  <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-semibold">{waitlistCount.toLocaleString()}</span> developers on waitlist
                  </span>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <a href="#get-started" className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary/90 transition glow-primary">
                Get Instant Access - $5/mo
              </a>
              <a href="#get-started" className="border border-border text-foreground px-8 py-3 rounded-lg text-lg font-semibold hover:bg-card transition">
                Join Free Waitlist
              </a>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Early bird pricing: Lock in $5/month forever (Future price: $29/mo)
            </p>

            {/* Clear instructions about what happens next */}
            <div className="mt-8 p-4 bg-card/50 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">How it works:</span> After payment, you'll receive an email with instructions to access your dashboard at <span className="text-primary">dashboard.safeprompt.dev</span> where you can view your API key and start integrating SafePrompt.
              </p>
            </div>
          </motion.div>

          {/* Attack Theater Demo */}
          <AttackTheater />
        </div>
      </section>

      {/* How It Works */}
      <section id="features" className="py-20 px-6 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-center mb-12">
              How SafePrompt <span className="gradient-text">Protects You</span>
            </h2>

            {/* Speed Comparison */}
            <SpeedComparison />

            {/* Code Demo */}
            <div className="mt-12">
              <CodeDemo />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Metrics */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-center mb-12">
              Real-Time <span className="gradient-text">Protection</span>
            </h2>
            <LiveMetrics />
          </motion.div>
        </div>
      </section>

      {/* Why Developers Choose SafePrompt */}
      <section className="py-20 px-6 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why Developers <span className="gradient-text">Choose SafePrompt</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-xl border border-border"
            >
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">5ms Processing Time</h3>
              <p className="text-muted-foreground">
                Don't sacrifice performance for security. Our regex-first approach means instant validation for 95% of requests (network latency excluded).
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-xl border border-border"
            >
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">99.9% Accuracy</h3>
              <p className="text-muted-foreground">
                Industry-leading accuracy with minimal false positives. Our AI-enhanced validation catches sophisticated attacks that regex alone would miss.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-xl border border-border"
            >
              <div className="text-3xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold mb-2">Auto-Updates</h3>
              <p className="text-muted-foreground">
                New attack vectors emerge weekly. We handle the updates so you stay protected without lifting a finger.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-xl border border-border"
            >
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Transparent Pricing</h3>
              <p className="text-muted-foreground">
                No enterprise sales calls. No hidden fees. Just simple, predictable pricing that scales with your usage.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-xl border border-border"
            >
              <div className="text-3xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold mb-2">Compliance Ready</h3>
              <p className="text-muted-foreground">
                "We use SafePrompt" satisfies security audits. Show you take AI security seriously with industry-standard protection.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-xl border border-border"
            >
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">1-Minute Setup</h3>
              <p className="text-muted-foreground">
                Install SDK, add API key, wrap your prompts. That's it. No complex configuration or infrastructure changes.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              title="Waitlist"
              price="Free"
              description="Join the queue for free tier access"
              features={[
                '100 validations/day',
                'Basic regex protection',
                'Community support',
                'API documentation',
              ]}
              buttonText="Join Waitlist"
              buttonVariant="secondary"
            />

            <PricingCard
              title="Early Bird"
              price="$5"
              period="/month forever"
              description="Instant access with beta pricing"
              features={[
                '50,000 validations/month',
                'AI-enhanced protection',
                'Priority support',
                '5ms average response',
                '100% accuracy guarantee',
                'Auto-updates',
              ]}
              buttonText="Get Instant Access"
              buttonVariant="primary"
              popular={true}
            />
          </div>

          <p className="text-center text-muted-foreground mt-8">
            After beta: Starter $29/mo • Pro $99/mo • Enterprise $299/mo
          </p>
        </div>
      </section>

      {/* Documentation Section */}
      <section id="docs" className="py-20 px-6 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Quick Start <span className="gradient-text">Documentation</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Quick Start */}
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="text-xl font-semibold mb-4">1. Get your API key</h3>
              <p className="text-muted-foreground mb-4">
                Sign up and access your API key from the dashboard
              </p>
              <pre className="bg-background p-4 rounded-lg overflow-x-auto">
                <code className="text-sm text-muted-foreground">
{`// Your API key from dashboard
const API_KEY = 'sp_live_YOUR_KEY';`}
                </code>
              </pre>
            </div>

            {/* JavaScript Example */}
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="text-xl font-semibold mb-4">2. JavaScript/TypeScript</h3>
              <pre className="bg-background p-4 rounded-lg overflow-x-auto">
                <code className="text-sm text-muted-foreground">
{`async function checkPrompt(userInput) {
  const response = await fetch('https://api.safeprompt.dev/v1/check', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt: userInput })
  });
  return response.json();
}`}
                </code>
              </pre>
            </div>

            {/* Usage Example */}
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="text-xl font-semibold mb-4">3. Validate user input</h3>
              <pre className="bg-background p-4 rounded-lg overflow-x-auto">
                <code className="text-sm text-muted-foreground">
{`// Check user input before sending to AI
const result = await checkPrompt(userInput);

if (!result.safe) {
  console.error('Blocked:', result.threats);
  throw new Error('Potential injection detected');
}

// Safe to use with your AI
await openai.complete(userInput);`}
                </code>
              </pre>
            </div>

            {/* cURL Example */}
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="text-xl font-semibold mb-4">4. Or use cURL</h3>
              <pre className="bg-background p-4 rounded-lg overflow-x-auto">
                <code className="text-sm text-muted-foreground">
{`curl -X POST https://api.safeprompt.dev/v1/check \\
  -H "Authorization: Bearer sp_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "User input here"}'`}
                </code>
              </pre>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Need help? Check out our full documentation or reach out to support.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <a href="https://dashboard.safeprompt.dev" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition">
                Access Dashboard
              </a>
              <a href="mailto:support@safeprompt.dev" className="border border-border text-foreground px-6 py-2 rounded-lg hover:bg-card transition">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="get-started" className="py-20 px-6 bg-gradient-to-b from-card/50 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Your AI Is At Risk <span className="gradient-text">Right Now</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Every unprotected prompt is a potential vulnerability. Join the growing community of developers
            securing their AI applications.
          </p>

          <WaitlistForm />

          {/* Clear process explanation */}
          <div className="mt-8 p-6 bg-card rounded-xl border border-border max-w-2xl mx-auto text-left">
            <h3 className="font-semibold text-lg mb-4">What happens next?</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start space-x-3">
                <span className="text-primary font-semibold">1.</span>
                <div>
                  <strong className="text-foreground">Choose your option:</strong> Join the free waitlist or get instant access for $5/month
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary font-semibold">2.</span>
                <div>
                  <strong className="text-foreground">Complete payment:</strong> If you chose early bird access, you'll be redirected to Stripe for secure payment
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary font-semibold">3.</span>
                <div>
                  <strong className="text-foreground">Check your email:</strong> You'll receive a welcome email with instructions
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary font-semibold">4.</span>
                <div>
                  <strong className="text-foreground">Access your dashboard:</strong> Log in at <a href="https://dashboard.safeprompt.dev" className="text-primary hover:underline">dashboard.safeprompt.dev</a> to view your API key
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-primary font-semibold">5.</span>
                <div>
                  <strong className="text-foreground">Start integrating:</strong> Use our SDK or API directly to protect your AI applications
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            No spam. Unsubscribe anytime. Questions? Email <a href="mailto:support@safeprompt.dev" className="text-primary hover:underline">support@safeprompt.dev</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 gradient-text">SafePrompt</h3>
              <p className="text-muted-foreground text-sm">
                Developer-first prompt injection protection.
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                A product of Reboot Media Inc.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-muted-foreground hover:text-foreground transition">Features</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition">Pricing</a></li>
                <li><a href="https://dashboard.safeprompt.dev" className="text-muted-foreground hover:text-foreground transition">Dashboard</a></li>
                <li><a href="#docs" className="text-muted-foreground hover:text-foreground transition">Documentation</a></li>
                <li><a href="https://api.safeprompt.dev/status" className="text-muted-foreground hover:text-foreground transition">API Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="/blog" className="text-muted-foreground hover:text-foreground transition">Blog</a></li>
                <li><a href="https://github.com/ianreboot/safeprompt" className="text-muted-foreground hover:text-foreground transition">GitHub</a></li>
                <li><a href="/security" className="text-muted-foreground hover:text-foreground transition">Security</a></li>
                <li><a href="/terms" className="text-muted-foreground hover:text-foreground transition">Terms</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><a href="https://twitter.com/safeprompt" className="text-muted-foreground hover:text-foreground transition">Twitter</a></li>
                <li><a href="https://discord.gg/safeprompt" className="text-muted-foreground hover:text-foreground transition">Discord</a></li>
                <li><a href="mailto:support@safeprompt.dev" className="text-muted-foreground hover:text-foreground transition">support@safeprompt.dev</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2025 Reboot Media Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}