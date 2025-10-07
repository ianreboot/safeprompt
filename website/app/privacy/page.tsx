import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background text-foreground pt-20">
        <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-xl border border-border p-8 lg:p-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground">Effective Date: September 24, 2025</p>
              <p className="text-sm text-muted-foreground mt-2">Last Updated: October 6, 2025 (Phase 1A Intelligence System)</p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>TL;DR:</strong> We process your prompts to detect threats. Blocked prompts are stored for 24 hours then automatically anonymized.
                  We use network intelligence to protect all customers (Pro tier can opt-out). We never sell your data.
                  For privacy concerns, use our <a href="/contact" className="text-primary hover:underline">contact form</a>.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">1. What We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect only what's necessary to provide our service and protect the network:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Account Info:</strong> Email address and password (hashed)</li>
                  <li><strong>API Usage:</strong> Request counts, response times, API keys</li>
                  <li><strong>Payment:</strong> Billing info via Stripe (we don't store card numbers)</li>
                  <li><strong>Prompts:</strong> Processed in memory only, not stored unless flagged as threats</li>
                  <li><strong>Blocked Prompts (Phase 1A):</strong> Prompt text + client IP stored for 24 hours, then automatically anonymized</li>
                  <li><strong>Client IP Addresses:</strong> Required for network defense, stored for 24 hours then deleted (hashes kept permanently)</li>
                  <li><strong>Session Data:</strong> Multi-turn validation history, stored for 2 hours then automatically deleted</li>
                  <li><strong>Attack Patterns:</strong> Cryptographic hashes stored permanently (no personally identifiable information)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Data</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Process your API requests</li>
                  <li>Bill you for the service</li>
                  <li>Send important account notifications</li>
                  <li>Improve our threat detection</li>
                  <li>Comply with legal requirements</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
                <p className="text-muted-foreground mb-4">
                  We use industry-standard security measures:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>TLS encryption for all API traffic</li>
                  <li>Encrypted database storage</li>
                  <li>Regular security updates</li>
                  <li>Limited access controls</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>Note:</strong> As a startup, we use trusted third-party services (Supabase, Cloudflare, Stripe)
                  that have their own security certifications.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">4. Your Prompts & Threat Intelligence (Phase 1A)</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>Important:</strong> Here's what happens to prompts you send us:
                </p>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold mb-2">Safe Prompts:</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Analyzed in real-time for threats</li>
                    <li>Not stored (processed in memory only)</li>
                    <li>Never used to train models</li>
                  </ul>
                </div>

                <div className="bg-danger/5 border border-danger/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Blocked Prompts (Threat Intelligence Collection):</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li><strong>First 24 hours:</strong> Full prompt text + client IP stored for analysis</li>
                    <li><strong>After 24 hours:</strong> Automatic anonymization - prompt text & IP deleted</li>
                    <li><strong>Permanent storage:</strong> Only cryptographic hashes (cannot identify users)</li>
                    <li><strong>Purpose:</strong> Network defense intelligence to protect all customers</li>
                    <li><strong>Free Tier:</strong> Contributes attack data automatically (required for service)</li>
                    <li><strong>Pro Tier:</strong> Can opt-out via dashboard preferences</li>
                  </ul>
                </div>

                <p className="text-muted-foreground mt-4 text-sm">
                  <strong>Legal Basis:</strong> Legitimate interest (network security) for Free tier, Consent for Pro tier.
                  See our <a href="/docs" className="text-primary hover:underline">full documentation</a> for technical details.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
                <p className="text-muted-foreground mb-4">We use these services to operate:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Stripe:</strong> Payment processing</li>
                  <li><strong>Supabase:</strong> Database and authentication</li>
                  <li><strong>Cloudflare:</strong> CDN and DDoS protection</li>
                  <li><strong>Vercel:</strong> API hosting</li>
                  <li><strong>Resend:</strong> Transactional emails</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">6. Your Rights (GDPR & CCPA)</h2>
                <p className="text-muted-foreground mb-4">You have the following rights:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Right to Access:</strong> View all data we have about you via dashboard or API</li>
                  <li><strong>Right to Deletion:</strong> Delete all identifiable data (&lt;24h old) immediately via API</li>
                  <li><strong>Right to Export:</strong> Download all your data in JSON format</li>
                  <li><strong>Right to Opt-Out (Pro Tier Only):</strong> Disable threat intelligence collection</li>
                  <li><strong>Right to Rectification:</strong> Update your account information</li>
                  <li><strong>Right to Object:</strong> Object to processing (Pro tier can opt-out)</li>
                </ul>

                <div className="bg-card/50 border border-border rounded-lg p-4 mt-4">
                  <h3 className="font-semibold mb-2">How to Exercise Your Rights:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• <strong>Via Dashboard:</strong> Settings → Privacy → Delete Data / Export Data</li>
                    <li>• <strong>Via API:</strong> <code>DELETE /api/v1/privacy/delete</code> or <code>GET /api/v1/privacy/export</code></li>
                    <li>• <strong>Via Email:</strong> <a href="/contact" className="text-primary hover:underline">Contact form</a></li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Note:</strong> Anonymized data (cryptographic hashes) cannot be deleted as it contains no personally identifiable information.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">7. Data Retention (Phase 1A Updated)</h2>
                <div className="bg-card/50 border border-border rounded-lg p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4">Data Type</th>
                        <th className="text-left py-2">Retention Period</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4"><strong>Session Data</strong></td>
                        <td className="py-2">2 hours (auto-deleted)</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4"><strong>Prompt Text (blocked)</strong></td>
                        <td className="py-2">24 hours (then anonymized)</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4"><strong>Client IP Addresses</strong></td>
                        <td className="py-2">24 hours (then anonymized)</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4"><strong>API Logs</strong></td>
                        <td className="py-2">30 days</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4"><strong>Usage Metrics</strong></td>
                        <td className="py-2">90 days</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4"><strong>Account Data</strong></td>
                        <td className="py-2">While active + 90 days</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4"><strong>Billing Records</strong></td>
                        <td className="py-2">7 years (legal requirement)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4"><strong>Attack Pattern Hashes</strong></td>
                        <td className="py-2">Indefinite (no PII)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Automatic Anonymization:</strong> Background jobs run hourly to delete personal data older than 24 hours.
                  This is mandatory and cannot be disabled (GDPR/CCPA compliance).
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">8. Compliance</h2>
                <p className="text-muted-foreground mb-4">
                  We aim to comply with major privacy regulations including GDPR and CCPA to the extent
                  applicable. As a small startup, we may not have all enterprise-level compliance
                  certifications, but we take privacy seriously and will work with you on any concerns.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our service is not for users under 16. If we learn we've collected data from a child,
                  we'll delete it immediately.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this policy as we grow. We'll notify you of significant changes via email
                  or dashboard notification.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
                <div className="bg-card/50 border border-border rounded-lg p-4">
                  <p className="text-muted-foreground mb-4">
                    For any privacy questions or to exercise your rights, please use our
                    <a href="/contact" className="text-primary hover:underline"> contact form</a>.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Company:</strong><br />
                    Reboot Media, Inc.<br />
                    17595 Harvard Ave C-738<br />
                    Irvine, CA 92614<br />
                    United States
                  </p>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Transparency Note:</strong> We're a small startup doing our best to protect your privacy.
                  If you have specific compliance requirements or concerns, please reach out through our
                  <a href="/contact" className="text-primary hover:underline"> contact form</a> and we'll work with you.
                </p>
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
