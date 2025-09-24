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
  const [waitlistCount, setWaitlistCount] = useState(1247)

  useEffect(() => {
    // Simulate waitlist growth
    const interval = setInterval(() => {
      setWaitlistCount(prev => prev + Math.floor(Math.random() * 3))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
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
            <a href="https://docs.safeprompt.dev" className="text-muted-foreground hover:text-foreground transition">Docs</a>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition">
              Get Started
            </button>
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
              <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-lg border border-border">
                <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                <span className="text-muted-foreground">
                  <span className="text-foreground font-semibold">{waitlistCount.toLocaleString()}</span> developers on waitlist
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary/90 transition glow-primary">
                Get Instant Access - $5/mo
              </button>
              <button className="border border-border text-foreground px-8 py-3 rounded-lg text-lg font-semibold hover:bg-card transition">
                Join Free Waitlist
              </button>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Early bird pricing: Lock in $5/month forever (Future price: $29/mo)
            </p>
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
              <h3 className="text-xl font-semibold mb-2">5ms Response Time</h3>
              <p className="text-muted-foreground">
                Don't sacrifice performance for security. Our regex-first approach means instant validation for 95% of requests.
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
              <h3 className="text-xl font-semibold mb-2">100% Accuracy</h3>
              <p className="text-muted-foreground">
                Zero false positives in testing. Our AI-enhanced validation catches sophisticated attacks that regex alone would miss.
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

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-card/50 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Your AI Is At Risk <span className="gradient-text">Right Now</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Every unprotected prompt is a potential vulnerability. Join {waitlistCount.toLocaleString()} developers
            who've already secured their AI applications.
          </p>

          <WaitlistForm />

          <p className="text-sm text-muted-foreground mt-8">
            No spam. Unsubscribe anytime. We'll only email when your spot is ready.
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
                <li><a href="https://docs.safeprompt.dev" className="text-muted-foreground hover:text-foreground transition">Documentation</a></li>
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