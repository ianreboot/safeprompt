'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import WaitlistForm from '@/components/WaitlistForm'
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
      })
  }, [])

  return (
    <main className="min-h-screen">
      {/* Simple Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold gradient-text">SafePrompt</span>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">BETA</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition">Pricing</a>
            <a href="#docs" className="text-muted-foreground hover:text-foreground transition">Documentation</a>
            <a href="https://dashboard.safeprompt.dev" className="text-muted-foreground hover:text-foreground transition">Dashboard</a>
            <a href="#get-started" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean and Simple */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Stop Prompt Injection
              <br />
              <span className="gradient-text">In One Line of Code</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Protect your AI applications from malicious prompts with a simple API call.
              Fast, accurate, and developer-friendly.
            </p>

            {/* Waitlist Counter - Simple */}
            {waitlistCount > 0 && (
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-lg border border-border">
                  <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-semibold">{waitlistCount.toLocaleString()}</span> developers on waitlist
                  </span>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <a href="#get-started" className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary/90 transition">
                Get API Key
              </a>
              <a href="#docs" className="border border-border text-foreground px-8 py-3 rounded-lg text-lg font-semibold hover:bg-card transition">
                View Documentation
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Simple Code Example */}
      <section className="py-20 px-6 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple Integration
          </h2>

          <div className="bg-card rounded-xl border border-border p-8">
            <pre className="overflow-x-auto">
              <code className="text-sm">{`// Check any user input before sending to AI
const response = await fetch('https://api.safeprompt.dev/v1/check', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: userInput })
});

const result = await response.json();
if (result.safe) {
  // Process with your AI
  await openai.complete(userInput);
} else {
  // Block the threat
  console.warn('Blocked:', result.threats);
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Features - Simple List */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose SafePrompt
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">5ms Response Time</h3>
              <p className="text-muted-foreground">
                Lightning-fast validation that won't slow down your application.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">99.9% Accurate</h3>
              <p className="text-muted-foreground">
                Industry-leading detection with minimal false positives.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-2">Simple API</h3>
              <p className="text-muted-foreground">
                One endpoint, clear responses. No complex configuration needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple, Transparent Pricing
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <PricingCard
              title="Free"
              price="$0"
              description="Perfect for testing"
              features={[
                '100 validations/day',
                'Basic protection',
                'Community support',
              ]}
              buttonText="Join Waitlist"
              buttonVariant="secondary"
            />

            <PricingCard
              title="Pro"
              price="$29"
              period="/month"
              description="For production applications"
              features={[
                '100,000 validations/month',
                'Advanced AI protection',
                'Priority support',
                '99.9% uptime SLA',
              ]}
              buttonText="Get Started"
              buttonVariant="primary"
              popular={true}
            />
          </div>
        </div>
      </section>

      {/* Documentation */}
      <section id="docs" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Quick Start Guide
          </h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start space-x-4">
                <span className="text-2xl font-bold text-primary">1</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Get Your API Key</h3>
                  <p className="text-muted-foreground mb-4">Sign up and access your API key from the dashboard.</p>
                  <a href="https://dashboard.safeprompt.dev" className="text-primary hover:underline">
                    Access Dashboard →
                  </a>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start space-x-4">
                <span className="text-2xl font-bold text-primary">2</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Make Your First Request</h3>
                  <pre className="bg-background p-4 rounded-lg overflow-x-auto mb-4">
                    <code className="text-sm">{`curl -X POST https://api.safeprompt.dev/v1/check \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Hello world"}'`}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start space-x-4">
                <span className="text-2xl font-bold text-primary">3</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Handle the Response</h3>
                  <pre className="bg-background p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm">{`{
  "safe": true,
  "confidence": 99.9,
  "threats": [],
  "processing_time_ms": 5
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Need help? Check out our full API reference or contact support.
            </p>
            <a href="/contact" className="text-primary hover:underline">
              Contact Support →
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="get-started" className="py-20 px-6 bg-gradient-to-b from-card/50 to-background">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Secure Your AI?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers protecting their applications.
          </p>

          <WaitlistForm />
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">SafePrompt</h3>
              <p className="text-muted-foreground text-sm">
                Protecting AI applications from prompt injection.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition text-sm">Pricing</a></li>
                <li><a href="#docs" className="text-muted-foreground hover:text-foreground transition text-sm">Documentation</a></li>
                <li><a href="https://api.safeprompt.dev/status" className="text-muted-foreground hover:text-foreground transition text-sm">API Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="/about" className="text-muted-foreground hover:text-foreground transition text-sm">About</a></li>
                <li><a href="/contact" className="text-muted-foreground hover:text-foreground transition text-sm">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/terms" className="text-muted-foreground hover:text-foreground transition text-sm">Terms</a></li>
                <li><a href="/privacy" className="text-muted-foreground hover:text-foreground transition text-sm">Privacy</a></li>
                <li><a href="https://dashboard.safeprompt.dev" className="text-muted-foreground hover:text-foreground transition text-sm">Dashboard</a></li>
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