const { Resend } = require('resend');
const fetch = require('node-fetch');

/**
 * SafePrompt Contact Form - SECURE Implementation
 *
 * Security principles:
 * 1. NO bypasses - validate everything
 * 2. NO exposed API keys - use env vars
 * 3. Fail CLOSED - block if validation unavailable
 * 4. Validate ALL fields - names and emails can contain injections
 * 5. Rate limiting - prevent abuse
 */

// Rate limiting (in-memory for now, use Redis in production)
const rateLimiter = new Map();
const RATE_LIMIT = 5; // Max 5 submissions per IP per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();
  const userAttempts = rateLimiter.get(ip) || [];

  // Clean old attempts
  const recentAttempts = userAttempts.filter(time => now - time < RATE_WINDOW);

  if (recentAttempts.length >= RATE_LIMIT) {
    return false;
  }

  recentAttempts.push(now);
  rateLimiter.set(ip, recentAttempts);
  return true;
}

async function validateWithSafePrompt(fields) {
  // NEVER use hardcoded API keys
  const apiKey = process.env.SAFEPROMPT_API_KEY;

  if (!apiKey) {
    console.error('[Contact] No SafePrompt API key configured');
    return { safe: false, error: 'Validation service not configured' };
  }

  try {
    const response = await fetch('https://api.safeprompt.dev/api/v1/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        prompt: JSON.stringify(fields), // Validate ALL fields as JSON
        mode: 'optimized'
      }),
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });

    if (!response.ok) {
      // FAIL CLOSED - don't accept suspicious content when validation is down
      console.error('[Contact] SafePrompt API error:', response.status);
      return { safe: false, error: 'Validation service unavailable' };
    }

    const result = await response.json();
    return result;

  } catch (error) {
    // FAIL CLOSED on any error
    console.error('[Contact] SafePrompt error:', error);
    return { safe: false, error: error.message };
  }
}

// Advanced sanitization to prevent ALL injection types
function sanitizeForEmail(str) {
  if (typeof str !== 'string') return '';

  return str
    // Remove ALL HTML/XML tags and comments
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
    .replace(/<[^>]*>/g, '')

    // Remove dangerous CSS patterns
    .replace(/style\s*=/gi, '')
    .replace(/font-size\s*:\s*0/gi, '')
    .replace(/font-size\s*:\s*1px/gi, '') // Also catch 1px trick
    .replace(/color\s*:\s*(white|#fff|#ffffff|transparent)/gi, '')
    .replace(/opacity\s*:\s*0/gi, '')
    .replace(/display\s*:\s*none/gi, '')
    .replace(/visibility\s*:\s*hidden/gi, '')
    .replace(/position\s*:\s*absolute/gi, '') // Prevent overlays

    // Remove Unicode direction overrides (used to reverse text)
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')

    // Remove zero-width characters (used to hide content)
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')

    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')

    // Limit length
    .slice(0, 5000)
    .trim();
}

// Strict email validation and sanitization
function sanitizeEmail(email) {
  if (typeof email !== 'string') return null;

  // Remove any HTML/script attempts in email
  email = email.replace(/[<>\"\']/g, '').trim();

  // Strict email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return null;
  }

  // Additional check for suspicious patterns
  if (email.includes('..') || email.includes('--')) {
    return null;
  }

  return email.toLowerCase();
}

module.exports = async (req, res) => {
  // Enable CORS with strict origin
  const allowedOrigins = ['https://safeprompt.dev', 'https://www.safeprompt.dev'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting by IP
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.'
    });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate and sanitize email first
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Length limits BEFORE validation (save API calls)
    if (name.length > 100 || subject.length > 200 || message.length > 5000) {
      return res.status(400).json({ error: 'Input too long' });
    }

    // VALIDATE ALL FIELDS - no exceptions
    console.log('[Contact] Validating all fields with SafePrompt...');

    const validation = await validateWithSafePrompt({
      name: name,
      email: email,  // Yes, validate email too - could contain injections
      subject: subject,
      message: message
    });

    // FAIL CLOSED - if validation fails or unsafe, reject
    if (!validation.safe) {
      console.warn('[Contact] Blocked unsafe submission:', {
        from: clientIp,
        threats: validation.threats,
        email: cleanEmail
      });

      // Generic error message - don't reveal why we blocked
      return res.status(400).json({
        error: 'Your message could not be processed. Please rephrase and try again.',
        // In dev only: threats: validation.threats
      });
    }

    // Even after validation, sanitize everything
    const sanitizedName = sanitizeForEmail(name);
    const sanitizedSubject = sanitizeForEmail(subject);
    const sanitizedMessage = sanitizeForEmail(message);

    // Double-check sanitization worked
    if (!sanitizedName || !sanitizedSubject || !sanitizedMessage) {
      return res.status(400).json({
        error: 'Invalid characters detected. Please use plain text only.'
      });
    }

    // Create email HTML
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>From:</strong> ${sanitizedName}</p>
          <p><strong>Email:</strong> ${cleanEmail}</p>
          <p><strong>Subject:</strong> ${sanitizedSubject}</p>
          <p style="color: #28a745; font-size: 12px;">✅ Validated and sanitized by SafePrompt</p>
        </div>

        <div style="background: white; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h3 style="color: #666; margin-top: 0;">Message:</h3>
          <p style="white-space: pre-wrap; word-break: break-word;">${sanitizedMessage}</p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
          <p style="color: #6c757d; font-size: 11px; margin: 0;">
            <strong>Security Info:</strong><br>
            • All fields validated by SafePrompt<br>
            • HTML/CSS injection patterns removed<br>
            • Zero-width characters stripped<br>
            • Client IP: ${clientIp}<br>
            • Validation time: ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'SafePrompt Contact <noreply@safeprompt.dev>',
      to: 'info@safeprompt.dev',
      replyTo: cleanEmail,
      subject: `[Contact] ${sanitizedSubject.slice(0, 100)}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({
        error: 'Failed to send message. Please try again later.'
      });
    }

    // Send auto-reply
    const autoReplyHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thanks for contacting SafePrompt!</h2>

        <p>Hi ${sanitizedName},</p>

        <p>We've received your message and will get back to you within 24 hours.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #666; margin-top: 0;">Your Message:</h3>
          <p><strong>Subject:</strong> ${sanitizedSubject}</p>
          <p style="white-space: pre-wrap; word-break: break-word;">${sanitizedMessage}</p>
        </div>

        <p>Best regards,<br>The SafePrompt Team</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

        <p style="color: #999; font-size: 12px;">
          Your message was validated and processed securely by SafePrompt.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: 'SafePrompt <noreply@safeprompt.dev>',
      to: cleanEmail,
      subject: 'We received your message - SafePrompt',
      html: autoReplyHtml,
    });

    // Log successful submission
    console.log(`[Contact] Valid message from ${cleanEmail}`);

    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully.'
    });

  } catch (error) {
    console.error('Contact form error:', error);

    // Never expose internal errors
    return res.status(500).json({
      error: 'An error occurred. Please try again later.'
    });
  }
};