export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-xl border border-border p-8 lg:p-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground">Effective Date: September 24, 2025</p>
              <p className="text-sm text-muted-foreground mt-2">Last Updated: September 24, 2025</p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>Your Privacy Rights:</strong> This policy explains how we collect, use, and protect your data.
                  For immediate privacy concerns, contact privacy@safeprompt.dev. We respond to all privacy requests
                  within 48 hours and comply with GDPR, CCPA, and other privacy regulations.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">1. Introduction and Scope</h2>
                <p className="text-muted-foreground mb-4">
                  Reboot Media, Inc. ("SafePrompt", "we", "us", or "our") respects your privacy and is committed to
                  protecting your personal data. This Privacy Policy describes our practices regarding the collection,
                  use, storage, sharing, and protection of your information when you use our prompt injection detection
                  services ("Service") at safeprompt.dev and related domains.
                </p>
                <p className="text-muted-foreground">
                  <strong>Applicability:</strong> This policy applies to all users of our Service, including free and
                  paid subscribers, API users, website visitors, and anyone who interacts with our Service.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

                <h3 className="text-xl font-semibold mb-3">2.1 Information You Provide</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li><strong>Account Data:</strong> Email address, name, company name (optional), password (hashed using bcrypt)</li>
                  <li><strong>Payment Information:</strong> Billing details processed by Stripe (we don't store card numbers)</li>
                  <li><strong>API Configuration:</strong> API key preferences, webhook endpoints, rate limit settings</li>
                  <li><strong>Support Communications:</strong> Inquiries, feedback, and correspondence with our team</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">2.2 Information Collected Automatically</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li><strong>API Usage Metrics:</strong> Request volumes, response times, error rates, endpoint usage patterns</li>
                  <li><strong>Threat Detection Data:</strong> Aggregated statistics on threat types, patterns, and frequencies</li>
                  <li><strong>Technical Data:</strong> IP addresses, user agents, API client versions, SDK information</li>
                  <li><strong>Performance Metrics:</strong> Latency measurements, uptime monitoring, service health data</li>
                  <li><strong>Security Logs:</strong> Authentication attempts, API key usage, rate limiting events</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">2.3 Prompt Data Processing</h3>
                <p className="text-muted-foreground mb-4">
                  <strong>Important:</strong> Prompts submitted for validation are processed with the following guarantees:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Ephemeral Processing:</strong> Prompts are analyzed in memory and not stored by default</li>
                  <li><strong>Temporary Caching:</strong> Results cached for up to 5 minutes for performance only</li>
                  <li><strong>No Training Use:</strong> Customer prompts are NEVER used to train our models without explicit consent</li>
                  <li><strong>Threat Samples:</strong> Only confirmed threat patterns (with PII removed) may be retained for security research</li>
                  <li><strong>Audit Logs:</strong> Metadata (timestamps, threat scores) retained for 30 days for security</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">3. Legal Basis for Processing</h2>
                <p className="text-muted-foreground mb-4">We process your data based on the following legal grounds:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Contract Performance:</strong> To provide the Service you've subscribed to</li>
                  <li><strong>Legitimate Interests:</strong> For security, fraud prevention, and service improvement</li>
                  <li><strong>Legal Obligations:</strong> To comply with laws, regulations, and legal processes</li>
                  <li><strong>Consent:</strong> Where you've explicitly agreed (e.g., marketing communications)</li>
                  <li><strong>Vital Interests:</strong> To protect against imminent security threats</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>

                <h3 className="text-xl font-semibold mb-3">4.1 Service Delivery</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li>Process and respond to API requests</li>
                  <li>Provide threat detection and prevention services</li>
                  <li>Manage your account and authentication</li>
                  <li>Process payments and maintain billing records</li>
                  <li>Provide technical support and respond to inquiries</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">4.2 Service Improvement</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li>Enhance threat detection algorithms and accuracy</li>
                  <li>Optimize API performance and reliability</li>
                  <li>Develop new features based on usage patterns</li>
                  <li>Conduct security research (using anonymized data)</li>
                  <li>Generate aggregated industry threat reports</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">4.3 Security and Compliance</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Monitor for abuse, fraud, and unauthorized access</li>
                  <li>Enforce rate limits and prevent service disruption</li>
                  <li>Investigate security incidents and vulnerabilities</li>
                  <li>Comply with legal obligations and respond to lawful requests</li>
                  <li>Protect our intellectual property and enforce our terms</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>We do not sell your personal data.</strong> We share information only as follows:
                </p>

                <h3 className="text-xl font-semibold mb-3">5.1 Service Providers</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li><strong>Stripe:</strong> Payment processing (PCI-DSS compliant)</li>
                  <li><strong>Supabase:</strong> Database and authentication services</li>
                  <li><strong>Cloudflare:</strong> CDN, DDoS protection, and edge computing</li>
                  <li><strong>AWS:</strong> Cloud infrastructure (SOC 2 certified)</li>
                  <li><strong>SendGrid:</strong> Transactional email delivery</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">5.2 Legal Requirements</h3>
                <p className="text-muted-foreground mb-4">We may disclose information when required to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li>Comply with valid legal processes (subpoenas, court orders)</li>
                  <li>Protect our rights, property, or safety</li>
                  <li>Prevent fraud or cybersecurity threats</li>
                  <li>Enforce our Terms of Service</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">5.3 Business Transfers</h3>
                <p className="text-muted-foreground">
                  In the event of a merger, acquisition, or asset sale, your data may be transferred. We will provide
                  notice before your personal information becomes subject to a different privacy policy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
                <p className="text-muted-foreground mb-4">
                  We implement comprehensive security measures to protect your data:
                </p>

                <h3 className="text-xl font-semibold mb-3">6.1 Technical Safeguards</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li><strong>Encryption:</strong> TLS 1.3 for data in transit, AES-256 for data at rest</li>
                  <li><strong>Access Controls:</strong> Role-based permissions, multi-factor authentication</li>
                  <li><strong>API Security:</strong> Key rotation, rate limiting, IP allowlisting</li>
                  <li><strong>Infrastructure:</strong> SOC 2 compliant hosting, regular security audits</li>
                  <li><strong>Monitoring:</strong> 24/7 threat detection, intrusion prevention systems</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">6.2 Organizational Measures</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li>Regular security training for all personnel</li>
                  <li>Strict data access policies and NDAs</li>
                  <li>Incident response procedures and breach protocols</li>
                  <li>Regular third-party security assessments</li>
                  <li>Vulnerability disclosure program</li>
                </ul>

                <p className="text-muted-foreground">
                  <strong>Security Incidents:</strong> In case of a data breach affecting your personal information,
                  we will notify you within 72 hours and provide details about the incident and mitigation steps.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">7. Your Privacy Rights</h2>
                <p className="text-muted-foreground mb-4">
                  You have the following rights regarding your personal data:
                </p>

                <h3 className="text-xl font-semibold mb-3">7.1 Universal Rights</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request erasure of your personal data</li>
                  <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                  <li><strong>Restriction:</strong> Limit how we process your data</li>
                  <li><strong>Objection:</strong> Opt-out of certain processing activities</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">7.2 Regional Rights</h3>

                <div className="bg-card/50 border border-border rounded-lg p-4 mb-4">
                  <h4 className="font-semibold mb-2">California Residents (CCPA/CPRA)</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Right to know categories and sources of data collected</li>
                    <li>Right to know business purposes for collection</li>
                    <li>Right to non-discrimination for exercising rights</li>
                    <li>Right to opt-out of sale (we don't sell data)</li>
                    <li>Right to limit use of sensitive personal information</li>
                  </ul>
                </div>

                <div className="bg-card/50 border border-border rounded-lg p-4 mb-4">
                  <h4 className="font-semibold mb-2">EU/UK Residents (GDPR)</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Right to withdraw consent at any time</li>
                    <li>Right to lodge complaints with supervisory authorities</li>
                    <li>Right to object to automated decision-making</li>
                    <li>Right to be informed about cross-border transfers</li>
                  </ul>
                </div>

                <p className="text-muted-foreground">
                  <strong>Exercising Your Rights:</strong> Submit requests to privacy@safeprompt.dev or through your
                  account dashboard. We'll respond within 30 days (or as required by law). We may need to verify your
                  identity before processing requests.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
                <p className="text-muted-foreground mb-4">
                  We retain data only as long as necessary for legitimate business purposes:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Account Data:</strong> Duration of service + 90 days after closure</li>
                  <li><strong>API Logs:</strong> 30 days for security monitoring</li>
                  <li><strong>Threat Intelligence:</strong> Indefinitely (anonymized)</li>
                  <li><strong>Billing Records:</strong> 7 years for tax compliance</li>
                  <li><strong>Support Tickets:</strong> 2 years for quality assurance</li>
                  <li><strong>Marketing Data:</strong> Until opt-out + 30 days</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>Deletion Requests:</strong> When you request deletion, we remove your data within 30 days,
                  except where retention is required by law or for legitimate business purposes (e.g., fraud prevention).
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
                <p className="text-muted-foreground mb-4">
                  Your data may be transferred to and processed in the United States where our servers are located.
                  We ensure appropriate safeguards for international transfers:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Standard Contractual Clauses for EU data transfers</li>
                  <li>Compliance with Privacy Shield principles (where applicable)</li>
                  <li>Encryption of all data in transit</li>
                  <li>Contractual obligations with processors</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">10. Cookies and Tracking</h2>
                <p className="text-muted-foreground mb-4">
                  We use minimal cookies essential for Service functionality:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li><strong>Authentication Cookies:</strong> Maintain your login session</li>
                  <li><strong>Security Cookies:</strong> Prevent CSRF attacks</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings</li>
                  <li><strong>Analytics (Optional):</strong> Understand usage patterns (can be disabled)</li>
                </ul>
                <p className="text-muted-foreground">
                  We do not use advertising cookies or sell data to advertisers. You can control cookies through your
                  browser settings, though this may affect functionality.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our Service is not directed to individuals under 16. We do not knowingly collect personal information
                  from children. If we become aware of such collection, we will delete the data immediately and terminate
                  the associated account. Parents may contact us at privacy@safeprompt.dev to request removal.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">12. Do Not Track</h2>
                <p className="text-muted-foreground">
                  We respect Do Not Track (DNT) browser signals. When DNT is enabled, we disable analytics cookies and
                  limit data collection to essential service functionality only.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">13. Third-Party Links</h2>
                <p className="text-muted-foreground">
                  Our Service may contain links to third-party websites. We are not responsible for their privacy practices.
                  We encourage you to review the privacy policies of any third-party sites you visit.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">14. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy to reflect changes in our practices or legal requirements. Material
                  changes will be notified via email and/or Service announcement at least 30 days before taking effect.
                  Your continued use after changes constitutes acceptance.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
                <div className="bg-card/50 border border-border rounded-lg p-4">
                  <p className="text-muted-foreground mb-4">
                    For privacy questions, concerns, or to exercise your rights:
                  </p>
                  <p className="text-muted-foreground mb-2">
                    <strong>Privacy Team:</strong> privacy@safeprompt.dev<br />
                    <strong>Data Protection Officer:</strong> dpo@safeprompt.dev<br />
                    <strong>Security Issues:</strong> security@safeprompt.dev
                  </p>
                  <p className="text-muted-foreground mt-4">
                    <strong>Mailing Address:</strong><br />
                    Reboot Media, Inc.<br />
                    Attn: Privacy Team<br />
                    17595 Harvard Ave C-738<br />
                    Irvine, CA 92614<br />
                    United States
                  </p>
                  <p className="text-muted-foreground mt-4">
                    <strong>Response Time:</strong> We respond to all privacy inquiries within 48 hours and resolve
                    requests within 30 days or as required by applicable law.
                  </p>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Privacy Promise:</strong> We believe privacy is a fundamental right. We collect only what's
                  necessary, protect it vigorously, and give you control over your data. If you have any concerns about
                  our privacy practices, please contact us immediately.
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