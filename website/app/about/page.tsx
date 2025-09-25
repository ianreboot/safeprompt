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
              How a Gmail vulnerability exposed the urgent need for AI security
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
              <h2 className="text-2xl font-semibold mb-4">The Wake-Up Call: July 2025</h2>
              <p className="text-muted-foreground mb-4">
                In July 2025, Mozilla researchers discovered something terrifying: Gmail's AI summary feature, powered
                by Google's Gemini model, could be completely hijacked through carefully crafted emails. Attackers could
                inject hidden instructions that would make the AI say anything they wanted in the summary that millions
                of users trusted.
              </p>
              <p className="text-muted-foreground mb-4">
                Imagine checking your Gmail and seeing an AI summary that says "This investment opportunity is legitimate
                and verified by Google" when the actual email is a scam. Or worse, instructions to ignore security warnings
                or click malicious links, all appearing to come from Google's own AI.
              </p>
              <p className="text-muted-foreground">
                This wasn't a theoretical vulnerability. It was real, it was being exploited, and it affected one of the
                world's most trusted email platforms. The era of prompt injection attacks had truly begun.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-8">
              <h2 className="text-2xl font-semibold mb-4">The Problem Goes Deeper</h2>
              <p className="text-muted-foreground mb-4">
                As we investigated further, we realized Gmail was just the tip of the iceberg. Every AI-powered application
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
              <h2 className="text-2xl font-semibold mb-4">Enter Ian Ho: From Builder to Protector</h2>
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1">
                  <p className="text-muted-foreground mb-4">
                    Ian Ho, founder of Reboot Media Inc., had spent 15 years building what AI could now create in 15 minutes.
                    From complex e-commerce platforms to sophisticated web applications, he'd witnessed the entire evolution
                    of web development.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    "I've seen technology waves come and go," Ian reflects, "but AI is different. It's not just changing
                    how we build - it's fundamentally changing what's possible. And with that power comes unprecedented
                    vulnerability."
                  </p>
                  <p className="text-muted-foreground">
                    When Ian learned about the Gmail vulnerability, he immediately recognized the pattern. His own AI-powered
                    tools - from Airtable automations to n8n workflows - were all potentially vulnerable. If Google couldn't
                    protect Gemini from prompt injection, what hope did smaller developers have?
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-8">
              <h2 className="text-2xl font-semibold mb-4">The Mission: Democratize AI Security</h2>
              <p className="text-muted-foreground mb-4">
                Ian realized that existing security solutions were either too complex, too expensive, or simply didn't
                understand the unique challenges of prompt injection. Developers needed something that was:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li><strong>Simple:</strong> One line of code to add protection</li>
                <li><strong>Fast:</strong> Sub-10ms latency that wouldn't slow down apps</li>
                <li><strong>Accurate:</strong> Advanced detection without false positives</li>
                <li><strong>Affordable:</strong> Accessible to indie developers and startups</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                "We're not trying to build another enterprise security platform," Ian explains. "We're building the
                protection that every developer can use, from hobbyists to Fortune 500 companies. Because prompt injection
                doesn't discriminate - it affects everyone using AI."
              </p>
              <p className="text-muted-foreground">
                SafePrompt was born from this vision: to be the shield between malicious prompts and your AI, so you
                can build amazing things without fear.
              </p>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-4">Why This Matters Now</h2>
              <p className="text-foreground mb-4">
                We're at a critical juncture in AI adoption. As of September 2025:
              </p>
              <ul className="list-disc list-inside text-foreground space-y-2 ml-4 mb-4">
                <li>Over 80% of new applications include AI features</li>
                <li>Prompt injection attacks have increased 3400% year-over-year</li>
                <li>The average cost of an AI security breach is $4.2M</li>
                <li>Only 12% of developers implement prompt security</li>
              </ul>
              <p className="text-foreground font-semibold">
                The window to secure the AI revolution is closing. We're here to make sure every developer can protect
                their AI applications before it's too late.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-8">
              <h2 className="text-2xl font-semibold mb-4">Join Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                SafePrompt isn't just a product - it's a movement to make AI safer for everyone. We believe that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>Security shouldn't be a luxury reserved for big companies</li>
                <li>Developers should focus on building, not worrying about attacks</li>
                <li>AI's potential should be realized without compromising safety</li>
                <li>The best security is invisible - it just works</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                We're currently in beta, working with early adopters to refine our detection algorithms and expand our
                threat intelligence. Every developer who joins us helps make AI safer for everyone.
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