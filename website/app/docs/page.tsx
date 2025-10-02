import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Book, Code, Zap, Shield } from 'lucide-react'
import Link from 'next/link'

export default function DocsIndex() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Everything you need to integrate SafePrompt into your application.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* API Reference */}
            <Link
              href="https://github.com/ianreboot/safeprompt/blob/main/docs/API.md"
              target="_blank"
              className="group block p-6 bg-card border border-border rounded-lg hover:border-primary transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <Code className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">API Reference</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Complete API documentation with endpoints, parameters, and response formats.
              </p>
              <span className="text-primary group-hover:underline">
                View API Docs →
              </span>
            </Link>

            {/* Technical Overview */}
            <Link
              href="https://github.com/ianreboot/safeprompt/blob/main/docs/TECHNICAL.md"
              target="_blank"
              className="group block p-6 bg-card border border-border rounded-lg hover:border-primary transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Technical Overview</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Learn how SafePrompt's validation pipeline works under the hood.
              </p>
              <span className="text-primary group-hover:underline">
                View Technical Docs →
              </span>
            </Link>

            {/* Quick Start Guide */}
            <div className="group block p-6 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Quick Start</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Get started in 60 seconds with our simple integration guide.
              </p>
              <div className="mt-4 p-4 bg-black rounded border border-border font-mono text-sm">
                <p className="text-muted-foreground mb-2">// 1. Install (optional)</p>
                <p className="mb-3">npm install @safeprompt/client</p>
                <p className="text-muted-foreground mb-2">// 2. Validate</p>
                <p className="text-primary">const safe = await safeprompt.check(input)</p>
              </div>
            </div>

            {/* Playground */}
            <Link
              href="/playground"
              className="group block p-6 bg-card border border-border rounded-lg hover:border-primary transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <Book className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Interactive Playground</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Test SafePrompt with real attack examples and see how it protects your AI.
              </p>
              <span className="text-primary group-hover:underline">
                Try Playground →
              </span>
            </Link>
          </div>

          {/* Support Section */}
          <div className="mt-12 p-6 bg-card border border-border rounded-lg">
            <h2 className="text-2xl font-semibold mb-3">Need Help?</h2>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact" className="text-primary hover:underline">
                Contact Support →
              </Link>
              <Link href="https://github.com/ianreboot/safeprompt" target="_blank" className="text-primary hover:underline">
                View on GitHub →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
