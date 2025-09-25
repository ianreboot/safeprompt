export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-xl border border-border p-8 lg:p-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
              <p className="text-muted-foreground">Effective Date: September 24, 2025</p>
              <p className="text-sm text-muted-foreground mt-2">Last Updated: September 24, 2025</p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>TL;DR:</strong> Use our API responsibly, pay your bills on time, don't try to break our service,
                  and understand that while we work hard to detect threats, no security is perfect. We're a startup doing
                  our best to provide value.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By using SafePrompt's API service ("Service"), you agree to these terms. If you're using the Service
                  for an organization, you're agreeing on their behalf.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">2. What We Provide</h2>
                <p className="text-muted-foreground mb-4">
                  SafePrompt provides prompt injection detection via API. We offer:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Real-time prompt validation</li>
                  <li>API access with your unique key</li>
                  <li>Dashboard for usage tracking</li>
                  <li>Documentation and basic support</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">3. Your Responsibilities</h2>
                <p className="text-muted-foreground mb-4">You agree to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Keep your API keys secure</li>
                  <li>Use the Service legally and ethically</li>
                  <li>Not attempt to reverse-engineer or resell our Service</li>
                  <li>Not overload our systems or exceed rate limits</li>
                  <li>Pay your subscription fees on time</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">4. Service Limitations</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>Important:</strong> Please understand:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>No security solution is 100% perfect</li>
                  <li>We significantly reduce, not eliminate, injection risks</li>
                  <li>You remain responsible for your application's overall security</li>
                  <li>We may have occasional downtime for maintenance</li>
                  <li>As a startup, we're continuously improving the service</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">5. Pricing & Payment</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Free tier:</strong> 10,000 validations/month</li>
                  <li><strong>Paid plans:</strong> Billed monthly via Stripe</li>
                  <li><strong>Refunds:</strong> Generally no refunds for partial months</li>
                  <li><strong>Price changes:</strong> We'll give 30 days notice</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">6. Privacy & Data</h2>
                <p className="text-muted-foreground">
                  We process prompts to detect threats but don't permanently store them. Your data is handled
                  according to our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                  We don't sell your data or use it to train models without permission.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  We own the Service and its technology. You own your content. Any feedback you provide
                  becomes ours to use freely. Don't use our name or logo without permission.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">8. Warranty Disclaimer</h2>
                <p className="text-muted-foreground uppercase">
                  The Service is provided "as is" without warranties of any kind. We don't guarantee it will
                  be error-free, uninterrupted, or meet all your needs. Use at your own risk.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-4 uppercase">
                  Our liability is limited to the amount you paid us in the past 12 months or $100,
                  whichever is greater. We're not liable for indirect, consequential, or punitive damages.
                </p>
                <p className="text-muted-foreground">
                  This means if a prompt injection gets through despite using our service, we're not liable
                  for any resulting damages beyond the limit above.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
                <p className="text-muted-foreground">
                  You'll defend and indemnify us from claims arising from your use of the Service,
                  violation of these terms, or violation of any laws or third-party rights.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">11. Dispute Resolution</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>Let's talk first:</strong> Before any legal action, contact us through our
                  <a href="/contact" className="text-primary hover:underline"> contact form</a> to try resolving issues informally.
                </p>
                <p className="text-muted-foreground">
                  If that doesn't work, disputes will be resolved through binding arbitration in Orange County,
                  California. No class actions allowed - disputes must be brought individually.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">12. Legal Fee Protection</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>Frivolous Claims:</strong> If you bring a claim against us that a court or arbitrator
                  determines to be frivolous, filed in bad faith, or brought for an improper purpose (such as to harass),
                  you agree to reimburse us for our reasonable attorney's fees and costs.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Prevailing Party:</strong> In any legal dispute, the prevailing party may be entitled to
                  recover reasonable attorney's fees and costs.
                </p>
                <p className="text-muted-foreground">
                  <strong>Good Faith Required:</strong> Before filing any legal action, you must attempt resolution
                  through our contact form and allow 30 days for response. This helps avoid unnecessary legal costs
                  for both parties.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">13. Account Termination</h2>
                <p className="text-muted-foreground">
                  Either party can terminate at any time. We may suspend or terminate accounts that violate
                  these terms or pose security risks. You're responsible for charges incurred before termination.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We may update these terms as we grow. We'll notify you of significant changes.
                  Continued use after changes means you accept them.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">15. General Provisions</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Governing law:</strong> California, USA</li>
                  <li><strong>Entire agreement:</strong> These terms + Privacy Policy</li>
                  <li><strong>Severability:</strong> Invalid provisions don't affect the rest</li>
                  <li><strong>No waiver:</strong> Not enforcing a right doesn't waive it</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">16. Beta Service Notice</h2>
                <p className="text-muted-foreground">
                  SafePrompt is currently in beta. This means:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Features may change or be discontinued</li>
                  <li>There may be bugs or issues</li>
                  <li>We especially appreciate feedback and patience</li>
                  <li>Early bird pricing will increase after beta</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">17. Contact Information</h2>
                <div className="bg-card/50 border border-border rounded-lg p-4">
                  <p className="text-muted-foreground mb-4">
                    For all inquiries, please use our <a href="/contact" className="text-primary hover:underline">contact form</a>.
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
                  <strong>Final Note:</strong> We're a small team building something we believe developers need.
                  These terms protect both of us while we grow. If you have specific concerns about any terms,
                  reach out through our <a href="/contact" className="text-primary hover:underline">contact form</a>
                  and we'll do our best to address them.
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
  )
}