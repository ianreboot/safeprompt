export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-xl border border-border p-8 lg:p-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground">Effective Date: January 24, 2025</p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <p className="text-muted-foreground">
                Reboot Media, Inc. ("SafePrompt", "we", "us", or "our") is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, and safeguard your information when you use our
                services at https://safeprompt.dev.
              </p>

              <div>
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <h3 className="text-xl font-semibold mb-2">Account Information</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li>Email address for account creation and communication</li>
                  <li>Password (encrypted and never stored in plain text)</li>
                  <li>Payment information (processed securely through Stripe)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-2">API Usage Data</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li>API requests and response times</li>
                  <li>Threat detection results (aggregated for analytics)</li>
                  <li>Usage patterns and statistics</li>
                </ul>

                <h3 className="text-xl font-semibold mb-2">Prompt Data</h3>
                <p className="text-muted-foreground">
                  Prompts submitted for validation are processed in real-time. We may temporarily cache results
                  for up to 24 hours to improve performance. Prompt content is automatically deleted after 30 days.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>To provide and maintain our API services</li>
                  <li>To process payments and manage subscriptions</li>
                  <li>To send service updates and security notifications</li>
                  <li>To improve our threat detection algorithms</li>
                  <li>To provide customer support</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures to protect your data, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and updates</li>
                  <li>Restricted access to personal information</li>
                  <li>Secure API key management</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell, trade, or rent your personal information. We may share data with:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-2">
                  <li>Stripe for payment processing</li>
                  <li>Supabase for database services</li>
                  <li>Cloudflare for content delivery and DDoS protection</li>
                  <li>Law enforcement when required by law</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
                <p className="text-muted-foreground mb-2">You have the right to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your account and data</li>
                  <li>Export your data in a portable format</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">6. Cookies</h2>
                <p className="text-muted-foreground">
                  We use essential cookies for authentication and session management. We do not use tracking
                  or advertising cookies. You can disable cookies in your browser, but this may affect
                  functionality.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain account data for the duration of your subscription and 90 days after cancellation.
                  API logs are retained for 30 days. You may request immediate deletion of your data by
                  contacting support.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our services are not intended for users under 18 years of age. We do not knowingly collect
                  information from children.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy periodically. Changes will be posted on this page with
                  an updated effective date. Continued use of our services constitutes acceptance of the
                  updated policy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
                <p className="text-muted-foreground">
                  For privacy-related questions or concerns, please contact us through the form on our website.
                  We aim to respond within 48 hours.
                </p>
                <p className="text-muted-foreground mt-4">
                  Reboot Media, Inc.<br />
                  Operating as SafePrompt<br />
                  Delaware, United States
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