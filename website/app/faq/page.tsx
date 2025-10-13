import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function FAQPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background text-foreground pt-20">
        <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-xl border border-border p-8 lg:p-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
              <p className="text-muted-foreground">Everything you need to know about SafePrompt</p>
              <p className="text-sm text-muted-foreground mt-2">Last Updated: October 6, 2025 (Phase 1A Intelligence System)</p>
            </div>

            <div className="space-y-8">
              {/* General Questions */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-primary">General Questions</h2>

                <div className="space-y-6">
                  <div className="bg-card/50 border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">What is prompt injection?</h3>
                    <p className="text-muted-foreground">
                      Prompt injection is a security vulnerability where attackers manipulate AI systems by inserting
                      malicious instructions into user inputs, causing the AI to perform unintended actions or reveal
                      sensitive information.
                    </p>
                  </div>

                  <div className="bg-card/50 border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">How does SafePrompt work?</h3>
                    <p className="text-muted-foreground mb-3">
                      SafePrompt uses a 3-stage validation system:
                    </p>
                    <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-4">
                      <li><strong>Pattern Detection</strong> - Fast regex patterns catch 67% of attacks instantly</li>
                      <li><strong>External Reference Detection</strong> - Identifies suspicious URLs, IPs, and commands</li>
                      <li><strong>AI Validation</strong> - 2-pass LLM analysis for complex attacks (98.9% accuracy)</li>
                    </ol>
                  </div>

                  <div className="bg-card/50 border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">How fast is SafePrompt?</h3>
                    <p className="text-muted-foreground">
                      Pattern detection: <span className="text-foreground font-semibold">&lt;5ms</span><br />
                      External reference detection: <span className="text-foreground font-semibold">&lt;50ms</span><br />
                      AI validation: <span className="text-foreground font-semibold">250ms average</span><br />
                      Overall: <span className="text-foreground font-semibold">67% of requests complete in &lt;100ms</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Phase 1A - Data Collection & Privacy */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-primary">🧠 Data Collection & Privacy (Phase 1A)</h2>

                <div className="space-y-6">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">What data does SafePrompt collect for threat intelligence?</h3>
                    <p className="text-muted-foreground mb-3">
                      We collect validation results (safe/unsafe), attack patterns, and metadata. For Free tier, only blocked
                      requests. For paid tiers (if opted in), all requests. Personal data (actual prompts and IP addresses) is
                      automatically deleted after 24 hours. Only anonymized hashes are retained for pattern analysis.
                    </p>
                    <div className="space-y-3">
                      <div className="bg-card/50 rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2">Data Collection Details:</h4>
                        <ul className="list-disc list-inside text-muted-foreground text-sm space-y-2 ml-4">
                          <li><strong>Free Tier:</strong> Only blocked requests collected automatically</li>
                          <li><strong>Paid Tiers (Early Bird/Starter/Business):</strong> All requests if opted in (default: ON, can disable)</li>
                          <li><strong>First 24 hours:</strong> Full prompt text + client IP stored for analysis</li>
                          <li><strong>After 24 hours:</strong> Automatic anonymization - prompt text & IP deleted permanently</li>
                          <li><strong>Permanent storage:</strong> Only cryptographic hashes (SHA-256, no PII, cannot reverse)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">What is "threat intelligence collection"?</h3>
                    <p className="text-muted-foreground mb-3">
                      When SafePrompt blocks an attack on one customer, it learns from it and protects all customers.
                      This creates a network effect where the entire community benefits from collective defense.
                    </p>
                    <p className="text-muted-foreground">
                      Example: If Customer A gets attacked with a novel prompt injection, SafePrompt immediately
                      recognizes and blocks that same pattern for Customer B, C, D... without any configuration changes.
                    </p>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">How does 24-hour anonymization work?</h3>
                    <p className="text-muted-foreground mb-3">
                      Every hour, automated background jobs run to anonymize data older than 24 hours:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                      <li><strong>Prompt text deleted:</strong> The actual malicious prompt is permanently removed</li>
                      <li><strong>IP address deleted:</strong> Client IP addresses are permanently removed</li>
                      <li><strong>Hashes remain:</strong> Only cryptographic hashes (one-way, irreversible) are kept</li>
                      <li><strong>No way to reverse:</strong> Hashes cannot be used to reconstruct original prompts or identify users</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3">
                      This process is automatic, mandatory, and cannot be disabled (GDPR/CCPA compliance).
                    </p>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">Why should I contribute to threat intelligence?</h3>
                    <p className="text-muted-foreground mb-3">
                      <strong>Network Effect Benefits:</strong>
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                      <li><strong>Zero-day protection:</strong> Get protected from brand new attacks you've never seen</li>
                      <li><strong>Faster detection:</strong> Patterns detected across network applied instantly</li>
                      <li><strong>IP reputation:</strong> Malicious IPs blocked automatically based on global activity</li>
                      <li><strong>Multi-turn attacks:</strong> Context-based attacks detected across customer base</li>
                    </ul>
                    <p className="text-muted-foreground mt-3">
                      Think of it like antivirus definitions - when one customer gets attacked, everyone's defenses improve.
                    </p>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">Can I opt out of intelligence sharing?</h3>
                    <p className="text-muted-foreground mb-3">
                      Paid tier users can disable intelligence sharing in Privacy Settings. Free tier users contribute blocked
                      requests as part of the service (this helps protect all users). Disabling on paid tiers keeps IP blocking active.
                    </p>
                    <div className="space-y-3">
                      <div className="bg-card/50 rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2">Free Tier:</h4>
                        <p className="text-sm text-muted-foreground">
                          <strong>No opt-out.</strong> Intelligence contribution is required for free service. This is how we can
                          offer a free tier - by building a collective defense network. Only blocked requests are contributed.
                        </p>
                      </div>
                      <div className="bg-card/50 rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2">Paid Tiers (Early Bird/Starter/Business):</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Opt-out available.</strong> Dashboard → Settings → Privacy → "Contribute to Network Intelligence" toggle OFF
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                          <li>• Validation accuracy remains identical (same detection models)</li>
                          <li>• IP blocking remains active (you still benefit from protection)</li>
                          <li>• You just don't contribute your data to the network</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">How does IP auto-blocking work?</h3>
                    <p className="text-muted-foreground mb-3">
                      When an IP address has &gt;80% block rate across ≥5 requests, we automatically block future requests
                      from that IP (paid tiers only). We use cryptographic hashes, so the actual IP cannot be reversed.
                      You can allowlist specific IPs in your dashboard.
                    </p>
                    <div className="space-y-3">
                      <div className="bg-card/50 rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2">Free Tier:</h4>
                        <p className="text-sm text-muted-foreground">
                          ❌ No automatic IP blocking<br />
                          ✅ Still benefit from network intelligence (detection improves)<br />
                          ✅ Can manually block IPs via dashboard
                        </p>
                      </div>
                      <div className="bg-card/50 rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2">Paid Tiers (Early Bird/Starter/Business):</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          ✅ Automatic IP blocking available (opt-in)<br />
                          ✅ Enable in Dashboard → Settings → Security<br />
                          ✅ Privacy-first: Only hashed IPs stored
                        </p>
                        <p className="text-xs text-muted-foreground">
                          IP reputation score is based on attack patterns across all customers. High-confidence malicious IPs are blocked automatically.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">Is SafePrompt GDPR compliant?</h3>
                    <p className="text-muted-foreground mb-3">
                      <strong>Yes.</strong> You can export or delete your data anytime from the dashboard. We delete personal
                      data after 24 hours, retaining only anonymized hashes under GDPR Article 17(3)(d) scientific research exception.
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                      <li><strong>Data Export:</strong> Dashboard → Settings → Privacy → Export Data (JSON format)</li>
                      <li><strong>Data Deletion:</strong> Dashboard → Settings → Privacy → Delete Data (immediate for &lt;24h data)</li>
                      <li><strong>API Access:</strong> Programmatic export/delete via REST API endpoints</li>
                      <li><strong>Anonymization:</strong> Automatic after 24 hours (prompt text + IP addresses deleted)</li>
                      <li><strong>Hash Retention:</strong> Only cryptographic hashes remain (no PII, cannot reverse)</li>
                    </ul>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">What's the benefit of network defense for Free users?</h3>
                    <p className="text-muted-foreground mb-3">
                      Free users help build the threat intelligence database by contributing blocked requests. While you don't
                      get IP blocking, you benefit from improved pattern detection as the system learns from attacks.
                      Upgrading to a paid tier adds IP auto-blocking.
                    </p>
                    <div className="space-y-3">
                      <div className="bg-card/50 rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2">Free Tier Benefits:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                          <li>✅ Same validation accuracy as paid tiers</li>
                          <li>✅ Benefit from network-wide pattern detection</li>
                          <li>✅ Protection from novel attacks discovered across network</li>
                          <li>✅ Automatic GDPR export/delete capabilities</li>
                          <li>❌ No automatic IP blocking capability</li>
                        </ul>
                      </div>
                      <div className="bg-card/50 rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2">Why Contribute?</h4>
                        <p className="text-sm text-muted-foreground">
                          By contributing blocked requests, you help protect the entire SafePrompt community. Think of it
                          like antivirus definitions - when one user gets attacked, everyone's protection improves. All
                          data is anonymized after 24 hours (only hashes remain).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Plans */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-primary">Pricing & Plans</h2>

                <div className="space-y-6">
                  <div className="bg-card/50 border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">Is there a free tier?</h3>
                    <p className="text-muted-foreground mb-3">
                      Yes! <strong>1,000 validations/month</strong> completely free.
                    </p>
                    <p className="text-muted-foreground">
                      Free tier includes network intelligence protection, but requires contributing blocked prompts
                      to threat intelligence (no opt-out, 24h anonymization applies).
                    </p>
                  </div>

                  <div className="bg-card/50 border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">What are the paid tier options?</h3>
                    <p className="text-muted-foreground mb-3">
                      <strong>Early Bird: $5/month</strong> (limited to first 50 users, price locked forever)<br/>
                      <strong>Starter: $29/month</strong> (same features as Early Bird)<br/>
                      <strong>Business: $99/month</strong> (250K validations/month)
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                      <li>10,000 validations/month</li>
                      <li>Priority support</li>
                      <li>Automatic IP blocking (opt-in)</li>
                      <li>Intelligence sharing opt-out</li>
                      <li>Lock in $5/mo forever (first 50 users only)</li>
                    </ul>
                  </div>

                  <div className="bg-card/50 border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">How do I integrate SafePrompt?</h3>
                    <p className="text-muted-foreground mb-3">
                      Integration takes less than 5 minutes:
                    </p>
                    <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-4">
                      <li>Sign up and get your API key from the dashboard</li>
                      <li>Make a POST request to our validation endpoint</li>
                      <li>Check the response for threat detection</li>
                    </ol>
                    <p className="text-muted-foreground mt-3">
                      We provide SDKs for popular languages and comprehensive documentation with code examples.
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Questions */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-primary">Technical Questions</h2>

                <div className="space-y-6">
                  <div className="bg-card/50 border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">What's the accuracy rate?</h3>
                    <p className="text-muted-foreground">
                      <strong>98.9% accuracy</strong> on professional test suite (93/94 tests passed)<br />
                      Based on 2-pass AI validation with context sharing between passes.
                    </p>
                  </div>

                  <div className="bg-card/50 border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">Do you support multi-turn conversations?</h3>
                    <p className="text-muted-foreground mb-3">
                      <strong>Yes!</strong> SafePrompt can track conversation context across multiple requests to detect
                      multi-turn attacks (context priming, RAG poisoning).
                    </p>
                    <p className="text-muted-foreground">
                      Pass a <code className="bg-background px-2 py-1 rounded text-sm">session_token</code> to enable
                      session-based validation. Session data is automatically deleted after 2 hours of inactivity.
                    </p>
                  </div>

                  <div className="bg-card/50 border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">What makes SafePrompt different?</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                      <li><strong>Developer-first:</strong> Simple API, no enterprise complexity</li>
                      <li><strong>Transparent pricing:</strong> No sales calls, clear pricing on website</li>
                      <li><strong>Fast:</strong> 67% of requests complete in &lt;100ms</li>
                      <li><strong>Accurate:</strong> 98.9% detection rate with low false positives</li>
                      <li><strong>Network intelligence:</strong> Collective defense across all customers</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center">
                <p className="text-foreground mb-3">
                  <strong>Still have questions?</strong>
                </p>
                <p className="text-muted-foreground mb-4">
                  We're here to help! Reach out through our contact form and we'll get back to you quickly.
                </p>
                <a href="/contact" className="text-primary hover:underline font-semibold">
                  Contact Support →
                </a>
              </div>
            </div>

            <div className="mt-8 text-center">
              <a href="/" className="text-primary hover:underline">← Back to Home</a>
            </div>
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </>
  )
}
