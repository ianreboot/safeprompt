'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background text-foreground pt-20">
        {/* Hero Section */}
        <section className="pt-12 pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              The Story Behind SafePrompt
            </h1>
            <p className="text-xl text-muted-foreground">
              How building AI-powered websites for clients exposed a critical security gap
            </p>
          </motion.div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-8"
          >
            <div className="bg-card rounded-xl border border-border p-8">
              <h2 className="text-2xl font-semibold mb-4">The Real-World Discovery</h2>
              <p className="text-muted-foreground mb-4">
                Ian Ho runs Reboot Media, an agency building AI-powered websites for clients. The requests seemed simple
                enough: "Put a lead form on my site, have AI summarize the submissions, send them to my Gmail inbox."
              </p>
              <p className="text-muted-foreground mb-4">
                While building these systems, Ian realized something alarming: the inputs weren't sanitized. Malicious
                prompts from lead forms could hijack the AI summaries going to client inboxes. Even worse, advanced AI
                automation workflows that responded to leads were completely exposed to manipulation.
              </p>
              <p className="text-muted-foreground">
                What started as "simple" Gmail inbox summaries revealed a universal problem: every AI application
                processing user input was vulnerable. And there was no simple, affordable solution for indie developers
                and small businesses who just wanted to ship.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-8">
              <h2 className="text-2xl font-semibold mb-4">The Problem Goes Deeper</h2>
              <p className="text-muted-foreground mb-4">
                After discovering this in client projects, Ian realized it wasn't isolated. Every AI-powered application
                was vulnerable:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li><strong>Customer Support Bots:</strong> Being tricked into refunding money or revealing user data</li>
                <li><strong>Content Moderation:</strong> Being bypassed to spread harmful content</li>
                <li><strong>AI Assistants:</strong> Being manipulated to execute unauthorized commands</li>
                <li><strong>Automated Workflows:</strong> Having their logic corrupted to cause business damage</li>
                <li><strong>Even Simple Contact Forms:</strong> Being exploited when AI processes the submissions</li>
              </ul>
              <p className="text-muted-foreground">
                The rush to integrate AI everywhere had created a massive security blind spot. Developers were building
                amazing AI features but had no way to protect them from malicious prompts.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-8">
              <h2 className="text-2xl font-semibold mb-4">Ian Ho: The Right Background at the Right Time</h2>
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1">
                  <p className="text-muted-foreground mb-4">
                    Ian's background uniquely positioned him to solve this problem. As <strong>eBay's first technical
                    architect</strong>, he built systems at massive scale before modern frameworks existed. He managed
                    <strong>multi-million dollar ad campaigns</strong>, served as a <strong>Fractional CMO for startups
                    and small businesses</strong>, and was an <strong>early ChatGPT adopter</strong> who recognized
                    AI's potential immediately.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    "I've seen what works at scale," Ian reflects, "and I also know that indie developers
                    and small businesses can't afford $X,XXX/month solutions with complex sales processes. There needed to
                    be something in between - something that actually works for the people building with AI every day."
                  </p>
                  <p className="text-muted-foreground">
                    The vulnerability wasn't theoretical - it was impacting real client projects. Ian tried building DIY
                    regex defenses (20+ hours, 43% accuracy, broke constantly). Enterprise tools required sales calls and
                    enterprise pricing. Nothing existed for the indie developer or small business who just wanted to ship
                    secure AI features.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-8">
              <h2 className="text-2xl font-semibold mb-4">The Solution: Built in 3 Months</h2>
              <p className="text-muted-foreground mb-4">
                Ian built SafePrompt solo in 3 months. Using experience from eBay (technical architecture),
                multi-million dollar campaigns (pricing psychology), and early AI adoption (ChatGPT since November 2022).
                Solving real client problems, not theoretical ones.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li><strong>Simple:</strong> One API call to add protection</li>
                <li><strong>Fast:</strong> &lt;100ms pattern detection (67% of requests)</li>
                <li><strong>Accurate:</strong> 92.9% accuracy (vs 43% DIY regex)</li>
                <li><strong>Affordable:</strong> $5/mo tier for indie devs ($0.50 per 100K prompts)</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                "I'm not trying to build another enterprise security platform," Ian explains. "I'm building the
                protection that every developer can actually use - from solo indie hackers to Fortune 500 companies.
                Because prompt injection doesn't discriminate."
              </p>
              <p className="text-muted-foreground">
                SafePrompt came from real experience: active agency owner discovering a real vulnerability
                while building for real clients. No theory. Just shipping secure AI features.
              </p>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4">Why This Matters Now</h2>
              <p className="text-foreground mb-4">
                AI is everywhere. Every app is adding AI features. But most developers have no way to protect against prompt injection.
              </p>
              <p className="text-foreground mb-4">
                Real attacks are happening: Chevrolet sold a car for $1. Air Canada was sued for what their AI promised. Gmail's AI got hijacked.
              </p>
              <p className="text-foreground font-semibold">
                These attacks work. And there's still no simple solution for indie developers and small businesses.
                That's what SafePrompt fixes.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-8">
              <h2 className="text-2xl font-semibold mb-4">Currently in Beta</h2>
              <p className="text-muted-foreground mb-4">
                SafePrompt is in beta. Working with early adopters to refine detection algorithms and expand threat intelligence.
              </p>
              <p className="text-muted-foreground mb-4">
                What we believe:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>Security shouldn't require enterprise budgets</li>
                <li>Developers should build, not worry about attacks</li>
                <li>The best security is invisible - it just works</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                Every developer using SafePrompt helps improve the network defense. When one customer gets attacked,
                all customers benefit from the intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <a href="/#get-started" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg text-center font-semibold hover:bg-primary/90 transition">
                  Start Protecting Your AI
                </a>
                <a href="/contact" className="border border-border text-foreground px-6 py-3 rounded-lg text-center font-semibold hover:bg-card transition">
                  Get in Touch
                </a>
              </div>
            </div>

            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                SafePrompt is a product of Reboot Media Inc., based in Irvine, California.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Founded in 2025 in response to the growing threat of prompt injection attacks.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  )
}