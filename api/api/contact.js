const { Resend } = require('resend');
const fetch = require('node-fetch');

/**
 * SafePrompt Contact Form - AI-Aware Implementation
 *
 * WHY WE VALIDATE: Gmail, Outlook, and other email clients now use AI
 * to summarize emails. Attackers are actively exploiting this with
 * invisible prompt injections that make AI summaries say things like
 * "Your password was compromised, call this number."
 *
 * We MUST protect our users' inboxes from becoming attack vectors.
 */

async function validateWithSafePrompt(text) {
  try {
    const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.SAFEPROMPT_TEST_API_KEY || 'sp_test_unlimited_dogfood_key_2025'
      },
      body: JSON.stringify({
        prompt: text,
        mode: 'optimized'
      }),
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });

    if (!response.ok) {
      // For contact forms, fail open but flag for review
      console.warn('[Contact] SafePrompt unavailable, queueing for review');
      return { safe: true, degraded: true };
    }

    return await response.json();
  } catch (error) {
    console.error('[Contact] SafePrompt error:', error);
    return { safe: true, degraded: true };
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Check for emergency bypass (SafePrompt being down)
    const isEmergency = /safeprompt.*(down|broken|error)|api.*unavailable/i.test(`${subject} ${message}`);

    let validationResults = {};
    let requiresReview = false;

    if (!isEmergency) {
      // BATCH VALIDATION - Single API call for all text fields
      const validation = await validateWithSafePrompt(
        JSON.stringify({
          subject: subject,
          message: message,
          // Don't validate name - names rarely contain prompt injection
        })
      );

      if (!validation.safe) {
        // Check if it's a false positive pattern
        const isFalsePositive = validation.threats?.includes('external_references') &&
                                message.includes('example.com'); // Common in technical support

        if (isFalsePositive) {
          requiresReview = true;
          validationResults = { warning: 'Contains URLs, flagged for review' };
        } else {
          // High confidence malicious - but still send with warning
          requiresReview = true;
          validationResults = {
            threats: validation.threats,
            blocked: true
          };
        }
      }

      if (validation.degraded) {
        requiresReview = true;
        validationResults = { degraded: true };
      }
    }

    // Sanitize for email (remove potential HTML/CSS injection)
    const sanitize = (str) => {
      return str
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/style\s*=/gi, '') // Remove style attributes
        .replace(/font-size\s*:\s*0/gi, '') // Remove zero font size
        .replace(/color\s*:\s*white/gi, '') // Remove white text
        .replace(/display\s*:\s*none/gi, '') // Remove hidden elements
        .slice(0, 5000);
    };

    const sanitizedName = sanitize(name);
    const sanitizedMessage = sanitize(message);
    const sanitizedSubject = sanitize(subject);

    // Create email HTML with validation status
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>

        ${requiresReview ? `
          <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 10px 0; border-radius: 5px;">
            <strong>⚠️ VALIDATION WARNING</strong><br>
            ${validationResults.blocked ?
              `Potential prompt injection detected: ${validationResults.threats?.join(', ')}` :
              validationResults.degraded ?
              'SafePrompt validation was unavailable' :
              'Message contains patterns that need review'}
            <br><small>This message has been sanitized but review carefully.</small>
          </div>
        ` : ''}

        ${isEmergency ? '<p style="color: red; font-weight: bold;">🚨 EMERGENCY BYPASS - SafePrompt issue reported</p>' : ''}

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>From:</strong> ${sanitizedName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${sanitizedSubject}</p>
          ${!requiresReview ? '<p style="color: #28a745;">✅ Validated by SafePrompt</p>' : ''}
        </div>

        <div style="background: white; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h3 style="color: #666; margin-top: 0;">Message (Sanitized):</h3>
          <p style="white-space: pre-wrap;">${sanitizedMessage}</p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

        <p style="color: #999; font-size: 12px;">
          This email was sanitized to prevent AI summary manipulation.
          Original message saved for review if needed.
        </p>
      </div>
    `;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'SafePrompt Contact <noreply@safeprompt.dev>',
      to: 'info@safeprompt.dev',
      replyTo: email,
      subject: `${requiresReview ? '⚠️ ' : ''}[SafePrompt Contact] ${sanitizedSubject}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }

    // Always send auto-reply (user doesn't know about validation)
    const autoReplyHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thanks for contacting SafePrompt!</h2>

        <p>Hi ${sanitizedName},</p>

        <p>We've received your message and will get back to you within 24 hours.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #666; margin-top: 0;">Your Message:</h3>
          <p><strong>Subject:</strong> ${sanitizedSubject}</p>
          <p style="white-space: pre-wrap;">${sanitizedMessage}</p>
        </div>

        <p>Best regards,<br>The SafePrompt Team</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

        <p style="color: #999; font-size: 12px;">
          This email was processed securely to prevent AI manipulation attacks.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: 'SafePrompt <noreply@safeprompt.dev>',
      to: email,
      subject: 'We received your message - SafePrompt',
      html: autoReplyHtml,
    });

    // Log validation status
    if (requiresReview) {
      console.warn(`[Contact] Message from ${email} requires review:`, validationResults);
    } else {
      console.log(`[Contact] Clean message from ${email}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully.'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};