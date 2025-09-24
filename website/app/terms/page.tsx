export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-xl border border-border p-8 lg:p-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
              <p className="text-muted-foreground">Effective Date: January 24, 2025</p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <p className="text-muted-foreground">
                Please read these Terms of Service ("Terms") carefully before using the https://safeprompt.dev website
                and API services (the "Service") operated by Reboot Media, Inc. ("us", "we", or "our").
              </p>

              <div>
                <h2 className="text-2xl font-semibold mb-4">1. Description of Service</h2>
                <p className="text-muted-foreground mb-4">
                  SafePrompt provides prompt injection detection and prevention services for AI applications, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Real-time prompt validation API</li>
                  <li>Multi-layer threat detection (regex patterns and AI analysis)</li>
                  <li>API key management and usage tracking</li>
                  <li>Developer dashboard and analytics</li>
                  <li>Documentation and integration support</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">2. Accuracy and Limitations</h2>
                <p className="text-muted-foreground">
                  While SafePrompt achieves high accuracy in detecting prompt injection attempts, no security solution
                  is 100% effective. We do not guarantee complete protection against all forms of prompt injection.
                  Users remain responsible for implementing comprehensive security measures in their applications.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">3. API Usage and Rate Limits</h2>
                <p className="text-muted-foreground">
                  API usage is subject to the limits of your subscription plan. Exceeding these limits may result in
                  temporary service suspension. We reserve the right to adjust rate limits to maintain service quality
                  for all users.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">4. Data Processing</h2>
                <p className="text-muted-foreground">
                  Prompts submitted for validation are processed in real-time and may be temporarily cached for
                  performance optimization. We do not store prompt content beyond 30 days and never use customer
                  data for model training without explicit consent.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">5. Payment and Refunds</h2>
                <p className="text-muted-foreground">
                  Subscription fees are billed monthly in advance. No refunds are provided for partial months.
                  You may cancel your subscription at any time, with access continuing until the end of the current
                  billing period.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  SafePrompt shall not be liable for any indirect, incidental, special, consequential, or punitive
                  damages resulting from your use or inability to use the Service, including damages from security
                  breaches that may occur despite using our Service.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms, please contact us through the form on our website.
                  We aim to respond to all inquiries within 48 hours.
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