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
              <p className="text-sm text-muted-foreground mt-2">Last Updated: October 1, 2025</p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>TL;DR:</strong> We process your prompts to detect threats, don't store them permanently,
                  and don't sell your data. For any privacy concerns, use our <a href="/contact" className="text-primary hover:underline">contact form</a>.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">1. What We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect only what's necessary to provide our service:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Account Info:</strong> Email address and password (hashed)</li>
                  <li><strong>API Usage:</strong> Request counts, response times, API keys</li>
                  <li><strong>Payment:</strong> Billing info via Stripe (we don't store card numbers)</li>
                  <li><strong>Prompts:</strong> Processed in memory only, not stored unless flagged as threats</li>
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
                <h2 className="text-2xl font-semibold mb-4">4. Your Prompts</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>Important:</strong> Here's what happens to prompts you send us:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Analyzed in real-time for threats</li>
                  <li>Not stored permanently (unless flagged as actual threats)</li>
                  <li>Never used to train models without permission</li>
                  <li>Cached briefly (5 minutes) for performance</li>
                  <li>Metadata logged for 30 days (timestamps, threat scores)</li>
                </ul>
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
                <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                <p className="text-muted-foreground mb-4">You can:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Access your account data</li>
                  <li>Update your information</li>
                  <li>Delete your account</li>
                  <li>Export your data</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  To exercise these rights, use our <a href="/contact" className="text-primary hover:underline">contact form</a>
                  or manage settings in your dashboard.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Account data:</strong> While you have an account + 90 days</li>
                  <li><strong>API logs:</strong> 30 days</li>
                  <li><strong>Billing records:</strong> As required by law (typically 7 years)</li>
                  <li><strong>Threat patterns:</strong> Indefinitely (anonymized)</li>
                </ul>
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