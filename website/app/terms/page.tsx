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
              <p className="text-muted-foreground">
                PLEASE READ THESE TERMS OF SERVICE ("TERMS") CAREFULLY BEFORE USING THE SAFEPROMPT API SERVICE,
                WEBSITE, AND RELATED SERVICES (COLLECTIVELY, THE "SERVICE") OPERATED BY REBOOT MEDIA, INC.,
                A CALIFORNIA CORPORATION ("SAFEPROMPT", "US", "WE", OR "OUR"). YOUR ACCESS TO AND USE OF THE
                SERVICE IS CONDITIONED ON YOUR ACCEPTANCE OF AND COMPLIANCE WITH THESE TERMS.
              </p>

              <div>
                <h2 className="text-2xl font-semibold mb-4">1. Service Description and Scope</h2>
                <p className="text-muted-foreground mb-4">
                  SafePrompt provides enterprise-grade prompt injection detection and prevention services for AI applications.
                  The Service includes:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Real-time prompt validation API with sub-10ms response times</li>
                  <li>Multi-layer threat detection using proprietary pattern matching and AI analysis</li>
                  <li>API key provisioning, rotation, and management</li>
                  <li>Developer dashboard with real-time analytics and threat monitoring</li>
                  <li>Comprehensive API documentation and SDKs (when available)</li>
                  <li>Technical support based on subscription tier</li>
                  <li>99.9% uptime SLA for paid plans</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>Service Dependencies:</strong> Our Service relies on cloud infrastructure providers (AWS, Cloudflare),
                  third-party AI models, and other technology partners. Service availability may be affected by these dependencies,
                  and we shall not be liable for interruptions caused by third-party service failures beyond our reasonable control.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">2. Account Registration and Security</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>2.1 Account Creation:</strong> You must provide accurate, complete, and current information during
                  registration. You are responsible for maintaining the confidentiality of your account credentials, including
                  API keys, and for all activities under your account.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>2.2 API Key Security:</strong> You must implement industry-standard security practices for storing
                  and transmitting API keys, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li>Never exposing API keys in client-side code or public repositories</li>
                  <li>Using environment variables or secure key management systems</li>
                  <li>Rotating keys regularly and immediately upon suspected compromise</li>
                  <li>Restricting API key access to authorized personnel only</li>
                </ul>
                <p className="text-muted-foreground">
                  <strong>2.3 Account Termination:</strong> We reserve the right to suspend or terminate accounts that violate
                  these Terms, engage in abusive behavior, or pose a security risk to the Service or other users.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">3. Acceptable Use Policy</h2>
                <p className="text-muted-foreground mb-4">
                  You agree to use the Service only for lawful purposes and in accordance with these Terms. You SHALL NOT:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Attempt to bypass, disable, or defeat the Service's security measures</li>
                  <li>Use the Service to test, develop, or improve competing prompt injection services</li>
                  <li>Submit malicious payloads designed to compromise our infrastructure</li>
                  <li>Exceed rate limits or attempt to overload the Service</li>
                  <li>Resell, sublicense, or redistribute the Service without written permission</li>
                  <li>Use automated systems to scrape or harvest data from the Service</li>
                  <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                  <li>Use the Service for any illegal, fraudulent, or unauthorized purpose</li>
                  <li>Violate any applicable laws, regulations, or third-party rights</li>
                  <li>Submit content that contains personal data without proper authorization</li>
                  <li>Misrepresent your affiliation with SafePrompt or any other entity</li>
                  <li>Engage in any activity that could damage our reputation or business interests</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">4. Service Accuracy and Limitations</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>4.1 Detection Accuracy:</strong> While SafePrompt maintains a 99.9% accuracy rate in controlled testing,
                  no security solution provides absolute protection. The Service is designed to significantly reduce, not eliminate,
                  prompt injection risks.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>4.2 Shared Responsibility Model:</strong> You acknowledge that:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li>SafePrompt provides a security layer, not complete security</li>
                  <li>You remain responsible for implementing comprehensive application security</li>
                  <li>You must validate and sanitize all user inputs beyond our Service</li>
                  <li>You should implement defense-in-depth strategies</li>
                  <li>You must monitor and respond to security incidents</li>
                </ul>
                <p className="text-muted-foreground">
                  <strong>4.3 False Positives/Negatives:</strong> The Service may occasionally produce false positives
                  (blocking legitimate content) or false negatives (missing threats). You agree to implement appropriate
                  error handling and fallback mechanisms.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">5. Data Processing and Privacy</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>5.1 Data Handling:</strong> Prompts submitted for validation are:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li>Processed in memory with no permanent storage by default</li>
                  <li>Temporarily cached (up to 5 minutes) for performance optimization</li>
                  <li>Logged (metadata only) for security monitoring and debugging</li>
                  <li>Never used for model training without explicit written consent</li>
                  <li>Subject to our Privacy Policy</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  <strong>5.2 Data Residency:</strong> Data is processed in US data centers. By using the Service,
                  you consent to data transfer to and processing in the United States.
                </p>
                <p className="text-muted-foreground">
                  <strong>5.3 Compliance:</strong> You represent that your use of the Service complies with all applicable
                  data protection laws, including GDPR, CCPA, and other privacy regulations.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property Rights</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>6.1 Our Property:</strong> The Service, including all software, algorithms, APIs, documentation,
                  and content, is protected by copyright, trade secret, patent, and other intellectual property laws.
                  All rights not expressly granted are reserved.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>6.2 Your Content:</strong> You retain all rights to content you submit for validation. By using
                  the Service, you grant us a limited, non-exclusive license to process your content solely for providing
                  the Service.
                </p>
                <p className="text-muted-foreground">
                  <strong>6.3 Feedback:</strong> Any suggestions, feedback, or improvements you provide become our property
                  and may be used without compensation or attribution.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">7. Payment Terms</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>7.1 Subscription Fees:</strong> Paid plans are billed monthly in advance. Prices are subject to
                  change with 30 days' notice. Early Bird pricing is promotional and may increase after beta period.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>7.2 Payment Processing:</strong> Payments are processed by Stripe. You agree to Stripe's terms
                  and authorize recurring charges for subscription plans.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>7.3 Refunds:</strong> Subscription fees are non-refundable except as required by law. No refunds
                  for partial months, unused API calls, or service credits.
                </p>
                <p className="text-muted-foreground">
                  <strong>7.4 Taxes:</strong> Fees exclude applicable taxes. You are responsible for all taxes related to
                  your use of the Service, except for our income taxes.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">8. Service Level Agreement (Paid Plans)</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>8.1 Uptime Commitment:</strong> We guarantee 99.9% uptime for paid plans, calculated monthly.
                  Downtime excludes scheduled maintenance (with 24-hour notice) and force majeure events.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>8.2 Service Credits:</strong> If we fail to meet the SLA, you may be eligible for service credits:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li>99.0-99.9% uptime: 10% credit</li>
                  <li>95.0-99.0% uptime: 25% credit</li>
                  <li>Below 95.0% uptime: 50% credit</li>
                </ul>
                <p className="text-muted-foreground">
                  <strong>8.3 Credit Request:</strong> Credits must be requested within 30 days of the incident. Credits
                  apply to future invoices only and do not entitle refunds.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">9. DISCLAIMER OF WARRANTIES</h2>
                <p className="text-muted-foreground uppercase">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED
                  WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTIES
                  ARISING FROM COURSE OF DEALING OR USAGE OF TRADE.
                </p>
                <p className="text-muted-foreground mt-4 uppercase">
                  WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, COMPLETELY SECURE, OR MEET YOUR
                  SPECIFIC REQUIREMENTS. WE DO NOT WARRANT THE ACCURACY, COMPLETENESS, OR USEFULNESS OF ANY INFORMATION
                  PROVIDED THROUGH THE SERVICE.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">10. LIMITATION OF LIABILITY</h2>
                <p className="text-muted-foreground mb-4 uppercase">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL SAFEPROMPT, ITS OFFICERS, DIRECTORS, EMPLOYEES,
                  AGENTS, OR AFFILIATES BE LIABLE FOR:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4 uppercase">
                  <li>ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
                  <li>LOSS OF PROFITS, REVENUE, DATA, OR USE</li>
                  <li>BUSINESS INTERRUPTION OR REPUTATIONAL HARM</li>
                  <li>SECURITY BREACHES OR PROMPT INJECTION ATTACKS THAT OCCUR DESPITE USING OUR SERVICE</li>
                  <li>ANY DAMAGES RESULTING FROM YOUR RELIANCE ON THE SERVICE</li>
                  <li>FAILURE OF THE SERVICE TO DETECT OR PREVENT ANY SPECIFIC THREAT</li>
                </ul>
                <p className="text-muted-foreground mb-4 uppercase">
                  OUR TOTAL LIABILITY FOR ALL CLAIMS RELATED TO THE SERVICE SHALL NOT EXCEED THE GREATER OF $100 OR THE
                  AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
                </p>
                <p className="text-muted-foreground">
                  <strong>Statutory Damage Waiver:</strong> To the extent permitted by law, you waive any right to statutory
                  damages under consumer protection, privacy, data breach notification, or similar laws. Recovery is limited
                  to actual damages proven with reasonable certainty.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
                <p className="text-muted-foreground mb-4">
                  You agree to indemnify, defend, and hold harmless SafePrompt and its officers, directors, employees,
                  agents, and affiliates from any claims, damages, losses, liabilities, costs, and expenses (including
                  reasonable attorneys' fees) arising from:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Your use or misuse of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any rights of another party</li>
                  <li>Your violation of any applicable laws or regulations</li>
                  <li>Content you submit through the Service</li>
                  <li>Any security breach resulting from your failure to secure API keys</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">12. Dispute Resolution and Arbitration</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>12.1 Informal Resolution:</strong> Before filing any legal action, you agree to contact us at
                  legal@safeprompt.dev to attempt informal resolution. We will attempt to resolve disputes within 60 days.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>12.2 Binding Arbitration:</strong> Any dispute not resolved informally shall be resolved through
                  binding arbitration under the American Arbitration Association's Commercial Arbitration Rules. Arbitration
                  shall occur in Orange County, California.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>12.3 Class Action Waiver:</strong> YOU WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTIONS, CLASS
                  ARBITRATIONS, OR OTHER REPRESENTATIVE PROCEEDINGS. DISPUTES MUST BE BROUGHT INDIVIDUALLY.
                </p>
                <p className="text-muted-foreground">
                  <strong>12.4 Injunctive Relief:</strong> Either party may seek injunctive relief in court for violations
                  of intellectual property rights or confidentiality obligations.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">13. Anti-Abuse and Fee-Shifting Provisions</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>13.1 Prevailing Party Fees:</strong> In any legal proceeding, the prevailing party is entitled
                  to recover reasonable attorneys' fees and costs.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>13.2 Frivolous Claims:</strong> If any claim against us is found to be frivolous, brought in bad
                  faith, or primarily for harassment, you agree to pay:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                  <li>All our attorneys' fees and costs</li>
                  <li>A penalty of $25,000 or triple your claimed damages, whichever is greater</li>
                  <li>Any court-imposed sanctions</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  <strong>13.3 Security Testing:</strong> Unauthorized penetration testing, vulnerability scanning, or security
                  research without written permission constitutes a violation of the Computer Fraud and Abuse Act and these
                  Terms. We reserve the right to pursue criminal and civil remedies.
                </p>
                <p className="text-muted-foreground">
                  <strong>13.4 Responsible Disclosure:</strong> Security researchers must follow responsible disclosure practices
                  and provide 90 days for remediation before public disclosure.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">14. Export Controls and Sanctions</h2>
                <p className="text-muted-foreground">
                  The Service may not be used in violation of U.S. export controls or sanctions. You represent that you are
                  not on any prohibited party list and will not use the Service in embargoed countries.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">15. Force Majeure</h2>
                <p className="text-muted-foreground">
                  We shall not be liable for failures caused by circumstances beyond our reasonable control, including but
                  not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military
                  authorities, fire, floods, accidents, pandemics, strikes, or shortages of transportation, facilities, fuel,
                  energy, labor, or materials.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">16. Governing Law and Venue</h2>
                <p className="text-muted-foreground">
                  These Terms are governed by California law, excluding conflict of law principles. Any legal action not
                  subject to arbitration shall be brought exclusively in the state or federal courts located in Orange County,
                  California. You consent to personal jurisdiction and venue in these courts.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">17. Modifications to Terms</h2>
                <p className="text-muted-foreground">
                  We may modify these Terms at any time. Material changes will be notified via email or Service announcement
                  30 days before taking effect. Continued use after changes constitutes acceptance. If you disagree with
                  changes, you must stop using the Service.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">18. Severability and Waiver</h2>
                <p className="text-muted-foreground">
                  If any provision is held invalid or unenforceable, it shall be modified to the minimum extent necessary
                  or deleted, and remaining provisions continue in effect. Our failure to enforce any right or provision
                  does not constitute waiver.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">19. Complete Agreement</h2>
                <p className="text-muted-foreground">
                  These Terms, together with our Privacy Policy and any service-specific agreements, constitute the entire
                  agreement between you and SafePrompt regarding the Service and supersede all prior agreements and understandings.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">20. Contact Information</h2>
                <div className="bg-card/50 border border-border rounded-lg p-4 mt-4">
                  <p className="text-muted-foreground mb-2">
                    <strong>Reboot Media, Inc.</strong><br />
                    17595 Harvard Ave C-738<br />
                    Irvine, CA 92614<br />
                    United States
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Legal Inquiries:</strong> legal@safeprompt.dev<br />
                    <strong>Support:</strong> support@safeprompt.dev<br />
                    <strong>Security Issues:</strong> security@safeprompt.dev
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">21. Acknowledgment</h2>
                <p className="text-muted-foreground">
                  BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE
                  TERMS OF SERVICE. IF YOU ARE USING THE SERVICE ON BEHALF OF AN ORGANIZATION, YOU REPRESENT THAT YOU
                  HAVE AUTHORITY TO BIND THAT ORGANIZATION TO THESE TERMS.
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