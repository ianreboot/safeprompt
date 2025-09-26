const { Resend } = require('resend');

/**
 * SafePrompt Contact Form - Correct Implementation
 *
 * This form does NOT use SafePrompt validation because:
 * 1. Messages go to info@safeprompt.dev (humans, not AI)
 * 2. We don't process support tickets with AI (yet)
 * 3. SafePrompt protects AI, not email inboxes
 *
 * If we later add AI support processing, we'll validate
 * at that point, not at form submission.
 */

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { name, email, subject, message } = req.body;

    // Standard validation only - no AI involved
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email format validation (local, not SafePrompt)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Length validation (local, not SafePrompt)
    if (message.length < 10) {
      return res.status(400).json({ error: 'Message is too short' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message is too long (max 5000 characters)' });
    }

    // Basic HTML sanitization (not SafePrompt's job)
    const sanitize = (str) => {
      return str.replace(/[<>]/g, '').slice(0, 1000);
    };

    const sanitizedName = sanitize(name);
    const sanitizedMessage = sanitize(message);
    const sanitizedSubject = sanitize(subject);

    // Check for emergency/urgent support needs
    const isUrgent = /urgent|emergency|down|broken|not.working/i.test(`${subject} ${message}`);

    // Create email HTML
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        ${isUrgent ? '<p style="color: red; font-weight: bold;">⚠️ URGENT/EMERGENCY DETECTED</p>' : ''}

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>From:</strong> ${sanitizedName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${sanitizedSubject}</p>
        </div>

        <div style="background: white; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h3 style="color: #666; margin-top: 0;">Message:</h3>
          <p style="white-space: pre-wrap;">${sanitizedMessage}</p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

        <p style="color: #999; font-size: 12px;">
          This email was sent from the SafePrompt contact form.
          ${isUrgent ? 'Marked as URGENT based on keywords.' : ''}
        </p>
      </div>
    `;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'SafePrompt Contact <noreply@safeprompt.dev>',
      to: 'info@safeprompt.dev',
      replyTo: email,
      subject: `${isUrgent ? '🚨 URGENT: ' : ''}[SafePrompt Contact] ${sanitizedSubject} - from ${sanitizedName}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
    }

    // Send auto-reply to user
    const autoReplyHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thanks for contacting SafePrompt!</h2>

        <p>Hi ${sanitizedName},</p>

        <p>We've received your message and will get back to you within 24 hours.</p>
        ${isUrgent ? '<p><strong>We see this is urgent and will prioritize your request.</strong></p>' : ''}

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #666; margin-top: 0;">Your Message:</h3>
          <p><strong>Subject:</strong> ${sanitizedSubject}</p>
          <p style="white-space: pre-wrap;">${sanitizedMessage}</p>
        </div>

        <p>In the meantime, you might find these resources helpful:</p>
        <ul>
          <li><a href="https://safeprompt.dev#documentation">Documentation</a></li>
          <li><a href="https://dashboard.safeprompt.dev">Dashboard</a></li>
        </ul>

        <p>Best regards,<br>The SafePrompt Team</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

        <p style="color: #999; font-size: 12px;">
          This is an automated response. Please do not reply to this email.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: 'SafePrompt <noreply@safeprompt.dev>',
      to: email,
      subject: 'We received your message - SafePrompt',
      html: autoReplyHtml,
    });

    // Log for potential future AI processing
    console.log(`[Contact] Received from ${email}: ${subject}`);

    // TODO: If we add AI support processing later:
    // await db.tickets.create({ name, email, subject, message });
    // processWithAI(ticketId); // This would validate with SafePrompt

    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully.'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};