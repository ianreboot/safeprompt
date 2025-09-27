'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import IntentRouter from '@/components/IntentRouter'
import CodeSelector from '@/components/CodeSelector'
import LogoText from '@/components/LogoText'
import { Shield, Zap, Clock, Users, ArrowRight, Check, AlertCircle } from 'lucide-react'

export default function ImprovedHome() {
  const [activeIntent, setActiveIntent] = useState<'free' | 'waitlist' | 'earlybird' | null>(null)
  const [waitlistCount, setWaitlistCount] = useState(247) // Mock for now

  return (
    <main className="min-h-screen">
      {/* Intent Router Modal */}
      <IntentRouter intent={activeIntent} onClose={() => setActiveIntent(null)} />

      {/* Navigation - Simplified */}
      <nav className="fixed top-0 w-full z-40 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <LogoText size="md" />
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">BETA</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition">
              How it Works
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition">
              Pricing
            </a>
            <a href="https://dashboard.safeprompt.dev" className="text-muted-foreground hover:text-foreground transition">
              Sign In
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clear Value Prop */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          {/* Alert Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-danger/10 border border-danger/30 rounded-lg p-4 mb-8 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-danger mt-0.5" />
            <div>
              <p className="font-semibold text-danger">Your AI is vulnerable to prompt injection</p>
              <p className="text-sm text-muted-foreground mt-1">
                Without protection, users can manipulate your AI to reveal secrets, bypass restrictions, or execute harmful commands.
              </p>
            </div>
          </motion.div>

          {/* Main Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Stop Prompt Injection
              <br />
              <span className="gradient-text">In One API Call</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Validate user prompts before they reach your AI. Block injection attacks, jailbreaks, and data extraction attempts instantly.
            </p>

            {/* Live Demo Stats */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">5ms</span> avg response
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{waitlistCount}</span> developers waiting
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Three Clear CTAs Section */}
      <section className="py-12 px-6 bg-card/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-8">Choose Your Access Path</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free Tier */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card rounded-xl border border-border p-6 relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Free API Key</h3>
                  <p className="text-xs text-muted-foreground">Start testing immediately</p>
                </div>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>10,000 requests/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Full API access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </li>
              </ul>

              <button
                onClick={() => setActiveIntent('free')}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                Get Free API Key
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-center text-muted-foreground mt-3">
                Instant access • 2 min setup
              </p>
            </motion.div>

            {/* Early Bird */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card rounded-xl border-2 border-primary p-6 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                BEST VALUE
              </div>

              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="font-semibold">Early Bird Access</h3>
                  <p className="text-xs text-muted-foreground">Lock in $5/mo forever</p>
                </div>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>100,000 requests/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="line-through text-muted-foreground">$29</span>
                  <span className="text-primary font-bold">$5/mo forever</span>
                </li>
              </ul>

              <button
                onClick={() => setActiveIntent('earlybird')}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Get Early Access
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-center text-muted-foreground mt-3">
                Limited beta pricing • Instant access
              </p>
            </motion.div>

            {/* Waitlist */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card rounded-xl border border-border p-6 relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-8 h-8 text-purple-500" />
                <div>
                  <h3 className="font-semibold">Join Waitlist</h3>
                  <p className="text-xs text-muted-foreground">Get notified at launch</p>
                </div>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Early access to features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Launch day bonuses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>No commitment required</span>
                </li>
              </ul>

              <button
                onClick={() => setActiveIntent('waitlist')}
                className="w-full bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
              >
                Join Waitlist
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-center text-muted-foreground mt-3">
                {waitlistCount} developers waiting
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Simple 3 Steps */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Protection in 3 Simple Steps
          </h2>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Intercept User Input</h3>
                <p className="text-muted-foreground mb-3">
                  Before sending prompts to your AI, validate them with SafePrompt
                </p>
                <div className="bg-card rounded-lg p-4 border border-border">
                  <code className="text-sm">
                    POST /api/v1/validate {"{"} "prompt": userInput {"}"}
                  </code>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex gap-6"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Get Instant Analysis</h3>
                <p className="text-muted-foreground mb-3">
                  Multi-layer validation in 5ms average response time
                </p>
                <div className="bg-card rounded-lg p-4 border border-border">
                  <code className="text-sm text-safe">
                    {"{"} "safe": true, "confidence": 0.99, "threats": [] {"}"}
                  </code>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex gap-6"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Process or Block</h3>
                <p className="text-muted-foreground mb-3">
                  Safe prompts continue to your AI, threats get blocked instantly
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-safe/10 border border-safe/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-safe mb-1">✓ Safe</p>
                    <p className="text-xs">Process with AI</p>
                  </div>
                  <div className="bg-danger/10 border border-danger/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-danger mb-1">✗ Threat</p>
                    <p className="text-xs">Block & log</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Integration Example */}
      <section className="py-20 px-6 bg-card/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            One Line of Code
          </h2>

          <CodeSelector />

          <div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">5ms</div>
              <p className="text-sm text-muted-foreground">Average response</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">99.9%</div>
              <p className="text-sm text-muted-foreground">Accuracy rate</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">30%</div>
              <p className="text-sm text-muted-foreground">Cost savings via cache</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Simplified */}
      <section id="pricing" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground mb-12">No hidden fees. No surprise charges. Cancel anytime.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-4">Plan</th>
                  <th className="pb-4">Price</th>
                  <th className="pb-4">Requests</th>
                  <th className="pb-4">Support</th>
                  <th className="pb-4"></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-4 font-semibold">Free</td>
                  <td className="py-4">$0/mo</td>
                  <td className="py-4">10,000/mo</td>
                  <td className="py-4">Community</td>
                  <td className="py-4">
                    <button
                      onClick={() => setActiveIntent('free')}
                      className="text-primary hover:underline"
                    >
                      Get started →
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-border bg-primary/5">
                  <td className="py-4 font-semibold">
                    Early Bird
                    <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded">BETA</span>
                  </td>
                  <td className="py-4">
                    <span className="font-bold">$5/mo</span>
                    <span className="text-muted-foreground line-through ml-2">$29</span>
                  </td>
                  <td className="py-4">100,000/mo</td>
                  <td className="py-4">Priority</td>
                  <td className="py-4">
                    <button
                      onClick={() => setActiveIntent('earlybird')}
                      className="text-primary hover:underline font-semibold"
                    >
                      Lock in price →
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 font-semibold">Pro</td>
                  <td className="py-4">$29/mo</td>
                  <td className="py-4">500,000/mo</td>
                  <td className="py-4">Priority</td>
                  <td className="py-4 text-muted-foreground">Coming soon</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 font-semibold">Enterprise</td>
                  <td className="py-4">Custom</td>
                  <td className="py-4">Unlimited</td>
                  <td className="py-4">Dedicated</td>
                  <td className="py-4 text-muted-foreground">Contact us</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center">
            <div>
              <LogoText size="lg" />
              <p className="text-sm text-muted-foreground mt-2">
                © 2025 Reboot Media Inc.
              </p>
            </div>
            <div className="flex gap-6">
              <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</a>
              <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</a>
              <a href="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}