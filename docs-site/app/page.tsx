import Link from 'next/link'
import DocsHeader from '@/components/DocsHeader'
import Footer from '@/components/Footer'

export default function DocsHome() {
  return (
    <main className="min-h-screen">
      <DocsHeader />

      <div className="container mx-auto max-w-5xl px-6 pt-32 pb-20">
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">SafePrompt Documentation</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            LLM security that's zero-config and production-ready
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-6 mb-16">
          <Link href="/quick-start" className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition group">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition">Quick Start</h2>
            <p className="text-muted-foreground mb-4">
              Get up and running in 5 minutes with our simple API integration.
            </p>
            <span className="text-primary group-hover:underline font-semibold">Get Started →</span>
          </Link>

          <Link href="/api-reference" className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition group">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition">API Reference</h2>
            <p className="text-muted-foreground mb-4">
              Complete API documentation with request/response examples in multiple languages.
            </p>
            <span className="text-primary group-hover:underline font-semibold">View API Docs →</span>
          </Link>

          <Link href="/api-reference#best-practices" className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition group">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition">Best Practices</h2>
            <p className="text-muted-foreground mb-4">
              Learn how to implement multi-turn protection, caching, and fail-open strategies.
            </p>
            <span className="text-primary group-hover:underline font-semibold">Learn More →</span>
          </Link>
        </section>

        <section className="bg-card/50 rounded-xl p-12">
          <h2 className="text-3xl font-bold text-center mb-8">What SafePrompt Protects Against</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Prompt Injection</h3>
              <p className="text-sm text-muted-foreground">
                Detects and blocks attempts to override system instructions
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Jailbreaks</h3>
              <p className="text-sm text-muted-foreground">
                Stops attempts to bypass safety guardrails
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Data Extraction</h3>
              <p className="text-sm text-muted-foreground">
                Prevents system prompt and sensitive data leakage
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Code Injection</h3>
              <p className="text-sm text-muted-foreground">
                Blocks XSS, SQL injection, and template attacks
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-12">
            SafePrompt uses a multi-layer validation pipeline that balances speed, accuracy, and cost through intelligent early-exit optimization.
          </p>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">0</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">External Reference Detection</h3>
                  <p className="text-muted-foreground mb-2">
                    Instant detection of URLs, IP addresses, and file paths with action-based blocking.
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-500">⚡ 0ms</span>
                    <span className="text-blue-500">🎯 5% of attacks</span>
                    <span className="text-purple-500">💰 $0 cost</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Pattern Matching</h3>
                  <p className="text-muted-foreground mb-2">
                    Fast regex detection of known attack patterns (XSS, SQL injection, template exploits).
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-500">⚡ &lt;10ms</span>
                    <span className="text-blue-500">🎯 67% of attacks</span>
                    <span className="text-purple-500">💰 $0 cost</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI Pass 1 (Google Gemini 2.0 Flash)</h3>
                  <p className="text-muted-foreground mb-2">
                    Fast AI model analyzes prompts that pass pattern detection for semantic threats.
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-yellow-500">⚡ 200-300ms</span>
                    <span className="text-blue-500">🎯 27% of requests</span>
                    <span className="text-purple-500">💰 $0.02/M tokens</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI Pass 2 (Google Gemini 2.5 Flash)</h3>
                  <p className="text-muted-foreground mb-2">
                    High-accuracy model handles edge cases and ambiguous prompts when Pass 1 is uncertain.
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-orange-500">⚡ 400-600ms</span>
                    <span className="text-blue-500">🎯 5% of requests</span>
                    <span className="text-purple-500">💰 $0.05/M tokens</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="text-lg font-semibold mb-3">Performance Profile</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span><strong>67% of requests:</strong> Instant response (&lt;10ms) via pattern/reference detection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span><strong>27% of requests:</strong> Fast AI validation (200-300ms) via Pass 1</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span><strong>5% of requests:</strong> Deep analysis (400-600ms) via Pass 2</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">→</span>
                <span><strong>Average:</strong> ~250ms response time with 98.9% accuracy</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
