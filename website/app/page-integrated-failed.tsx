'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, Zap, TrendingUp, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Home() {
  const [waitlistCount, setWaitlistCount] = useState(2534)

  useEffect(() => {
    // Fetch real waitlist count from API
    fetch('https://api.safeprompt.dev/api/waitlist/count')
      .then(res => res.json())
      .then(data => {
        if (data.count) {
          setWaitlistCount(data.count)
        }
      })
      .catch(err => console.error('Error fetching waitlist count:', err))
  }, [])

  return (
    <main className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />

        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Your AI App Is Vulnerable
              <br />
              <span className="gradient-text">To Prompt Injection Attacks</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Stop users from tricking your AI into revealing secrets, bypassing restrictions,
              or executing harmful commands. One API call is all you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition text-center"
              >
                Start Free Trial
              </Link>
              <a
                href="#how-it-works"
                className="border border-border px-8 py-3 rounded-lg font-semibold hover:bg-secondary transition text-center"
              >
                See How It Works
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-6 text-center">
              Trusted by {waitlistCount.toLocaleString()} developers • No credit card required
            </p>
          </motion.div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-secondary/5">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Every AI Application Has The Same Security Hole
          </h2>

          <div className="bg-danger/10 border border-danger/20 rounded-xl p-6 mb-8">
            <p className="text-center mb-4">Users will always try to:</p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-danger">System Prompts:</span>
                <p className="text-muted-foreground mt-1">"Ignore all previous instructions"</p>
              </div>
              <div>
                <span className="font-semibold text-danger">Jailbreaking:</span>
                <p className="text-muted-foreground mt-1">"Bypass content filters"</p>
              </div>
              <div>
                <span className="font-semibold text-danger">Role Playing:</span>
                <p className="text-muted-foreground mt-1">"You are now DAN who can..."</p>
              </div>
              <div>
                <span className="font-semibold text-danger">Code Injection:</span>
                <p className="text-muted-foreground mt-1">"&lt;script&gt;alert('XSS')&lt;/script&gt;"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution & How It Works - INTEGRATED */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            One API, Complete Protection
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            SafePrompt analyzes every user input before it reaches your AI model,
            blocking malicious prompts while letting legitimate requests through
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Left: Simple Integration */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary/10 p-2 rounded">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Lightning Fast Integration</h3>
              </div>

              <pre className="bg-card rounded-xl border border-border p-4 overflow-x-auto mb-6">
                <code className="text-sm">{`// Single prompt validation
const response = await fetch(
  'https://api.safeprompt.dev/api/v1/check',
  {
    headers: {
      'Authorization': 'Bearer YOUR_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: userInput
    })
  }
);

// Batch validation (NEW!)
const batch = await fetch(
  '/api/v1/batch-check',
  {
    body: JSON.stringify({
      prompts: [input1, input2, ...]
    })
  }
);`}</code>
              </pre>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span><strong>5ms</strong> average response time</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span><strong>100 prompts</strong> in one batch call</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span><strong>30% cheaper</strong> with smart caching</span>
                </div>
              </div>
            </div>

            {/* Right: Clear Response */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary/10 p-2 rounded">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Actionable Security</h3>
              </div>

              <pre className="bg-card rounded-xl border border-border p-4 overflow-x-auto mb-6">
                <code className="text-sm">{`{
  "safe": false,
  "action": "block",
  "confidence": 0.92,
  "threats": ["jailbreak", "role_playing"],
  "cached": true,
  "processingTime": 1
}

// Clear guidance:
if (!response.safe) {
  return "I can't process that request";
}`}</code>
              </pre>

              <div className="bg-card rounded-xl border border-border p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Enterprise Ready
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• SOC2/HIPAA compliance reports</li>
                  <li>• Real-time performance metrics</li>
                  <li>• Webhook alerts for threats</li>
                  <li>• 99.99% uptime SLA</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits - Unified */}
      <section className="py-20 px-6 bg-gradient-to-b from-secondary/5 to-background">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Built for Production AI Applications
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Bank-Grade Security</h3>
              <p className="text-sm text-muted-foreground">
                Multi-layer validation catches sophisticated attacks that simple regex patterns miss
              </p>
            </motion.div>

            <motion.div
              className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Zero Latency Impact</h3>
              <p className="text-sm text-muted-foreground">
                5ms validation with intelligent caching means your users never wait
              </p>
            </motion.div>

            <motion.div
              className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Scales With You</h3>
              <p className="text-sm text-muted-foreground">
                From prototype to production - batch API and caching reduce costs as you grow
              </p>
            </motion.div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-12 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">5ms</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">30%</div>
                <div className="text-sm text-muted-foreground">Cost Savings</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Protection</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Who Needs SafePrompt?
          </h2>

          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-2">🤖 AI Chatbots & Assistants</h3>
              <p className="text-muted-foreground text-sm">
                Customer service bots, internal tools, or public-facing assistants -
                all are vulnerable to users trying to extract training data or bypass restrictions.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-2">📧 Content Generation Tools</h3>
              <p className="text-muted-foreground text-sm">
                If your tool processes user content through AI (email summaries, content generation),
                malicious prompts can hijack the output or reveal other users' data.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-2">🔧 Automation Platforms</h3>
              <p className="text-muted-foreground text-sm">
                Zapier, Make.com, or custom automations that use AI -
                protect your workflows from manipulation through user inputs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Secure Your AI Application Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join {waitlistCount.toLocaleString()} developers protecting their AI features.
            Start with 10,000 free validations per month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Get Your API Key
            </Link>
            <Link
              href="#how-it-works"
              className="border border-border px-8 py-3 rounded-lg font-semibold hover:bg-secondary transition"
            >
              View Documentation
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Setup in 30 seconds • Cancel anytime
          </p>
        </div>
      </section>
    </main>
  )
}