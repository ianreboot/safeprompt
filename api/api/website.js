/**
 * Consolidated Website API Endpoint
 * Handles all website/frontend backend needs in a single function
 * to work within Vercel's 12-function limit
 */

const { Resend } = require('resend');
const { validateInternal } = require('../lib/internal-validator.js');
// Supabase import - handle both CommonJS and ESM
let supabase;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(
    process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
    process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
} catch (error) {
  console.error('Supabase import error - waitlist will not work:', error);
  // Continue without Supabase - contact form will still work
}

// Rate limiting (in-memory for now, use Redis in production)
const rateLimiter = new Map();
const RATE_LIMIT = 5; // Max 5 requests per hour per IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip, action) {
  const now = Date.now();
  const key = `${ip}:${action}`;
  const userAttempts = rateLimiter.get(key) || [];

  // Clean old attempts
  const recentAttempts = userAttempts.filter(time => now - time < RATE_WINDOW);

  if (recentAttempts.length >= RATE_LIMIT) {
    return false;
  }

  recentAttempts.push(now);
  rateLimiter.set(key, recentAttempts);
  return true;
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
    .replace(/font-size\s*:\s*1px/gi, '')
    .replace(/color\s*:\s*(white|#fff|#ffffff|transparent)/gi, '')
    .replace(/opacity\s*:\s*0/gi, '')
    .replace(/display\s*:\s*none/gi, '')
    .replace(/visibility\s*:\s*hidden/gi, '')
    .replace(/position\s*:\s*absolute/gi, '')

    // Remove Unicode direction overrides
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')

    // Remove zero-width characters
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

  // Remove any HTML/script attempts
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

// Contact form handler
async function handleContact(data, clientIp, resend) {
  const { name, email, subject, message } = data;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return {
      success: false,
      error: 'All fields are required',
      code: 'MISSING_FIELDS'
    };
  }

  // Validate and sanitize email first
  const cleanEmail = sanitizeEmail(email);
  if (!cleanEmail) {
    return {
      success: false,
      error: 'Invalid email address',
      code: 'INVALID_EMAIL'
    };
  }

  // Length limits BEFORE validation (save API calls)
  if (name.length > 100 || subject.length > 200 || message.length > 5000) {
    return {
      success: false,
      error: 'Input too long',
      code: 'INPUT_TOO_LONG'
    };
  }

  // VALIDATE ALL FIELDS - no exceptions
  console.log('[Contact] Validating all fields with SafePrompt...');

  const validation = await validateInternal(JSON.stringify({
    name: name,
    email: email,
    subject: subject,
    message: message
  }), { mode: 'optimized' });

  // FAIL CLOSED - if validation fails or unsafe, reject
  if (!validation.safe) {
    console.warn('[Contact] Blocked unsafe submission:', {
      from: clientIp,
      threats: validation.threats,
      email: cleanEmail
    });

    return {
      success: false,
      error: 'Your message could not be processed. Please rephrase and try again.',
      code: 'VALIDATION_FAILED'
    };
  }

  // Even after validation, sanitize everything
  const sanitizedName = sanitizeForEmail(name);
  const sanitizedSubject = sanitizeForEmail(subject);
  const sanitizedMessage = sanitizeForEmail(message);

  // Double-check sanitization worked
  if (!sanitizedName || !sanitizedSubject || !sanitizedMessage) {
    return {
      success: false,
      error: 'Invalid characters detected. Please use plain text only.',
      code: 'SANITIZATION_FAILED'
    };
  }

  try {
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
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'SafePrompt Contact <noreply@safeprompt.dev>',
      to: 'info@safeprompt.dev',
      replyTo: cleanEmail,
      subject: `[Contact] ${sanitizedSubject.slice(0, 100)}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return {
        success: false,
        error: 'Failed to send message. Please try again later.',
        code: 'EMAIL_SEND_FAILED'
      };
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

    console.log(`[Contact] Valid message from ${cleanEmail}`);

    return {
      success: true,
      message: 'Your message has been sent successfully.'
    };

  } catch (error) {
    console.error('Contact form error:', error);
    return {
      success: false,
      error: 'An error occurred. Please try again later.',
      code: 'INTERNAL_ERROR'
    };
  }
}

// Waitlist handler
async function handleWaitlist(data, clientIp, resend) {
  const { email, source = 'website' } = data;

  if (!email) {
    return {
      success: false,
      error: 'Email is required',
      code: 'MISSING_EMAIL'
    };
  }

  // Standard email validation (NOT SafePrompt's job for structured data)
  const cleanEmail = sanitizeEmail(email);
  if (!cleanEmail) {
    return {
      success: false,
      error: 'Invalid email format',
      code: 'INVALID_EMAIL'
    };
  }

  // Check if Supabase is available
  if (!supabase) {
    console.error('Supabase not initialized - waitlist unavailable');
    return {
      success: false,
      error: 'Waitlist service temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE'
    };
  }

  try {
    // Check if email already exists in waitlist
    const { data: existing, error: checkError } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', cleanEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing email:', checkError);
      return {
        success: false,
        error: 'Database error',
        code: 'DATABASE_ERROR'
      };
    }

    if (existing) {
      return {
        success: false,
        error: 'Email already on waitlist',
        code: 'ALREADY_EXISTS'
      };
    }

    // Add to waitlist
    const { data: newEntry, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email: cleanEmail,
        source,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding to waitlist:', insertError);
      return {
        success: false,
        error: 'Failed to add to waitlist',
        code: 'INSERT_FAILED'
      };
    }

    // Send notification email to admin
    try {
      await resend.emails.send({
        from: 'SafePrompt <noreply@safeprompt.dev>',
        to: 'info@safeprompt.dev',
        subject: 'New Waitlist Signup',
        html: `
          <h2>New waitlist signup!</h2>
          <p><strong>Email:</strong> ${cleanEmail}</p>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <p>View all signups in Supabase dashboard.</p>
        `
      });

      // Send auto-reply to user
      await resend.emails.send({
        from: 'SafePrompt <noreply@safeprompt.dev>',
        to: cleanEmail,
        subject: 'Welcome to SafePrompt - You\'re on the list!',
        html: `
          <h2>Thanks for joining the SafePrompt waitlist!</h2>
          <p>We're excited to have you as part of our early community.</p>
          <p>We'll notify you as soon as we're ready for beta access. In the meantime:</p>
          <ul>
            <li>Check out our <a href="https://safeprompt.dev">website</a> for updates</li>
            <li>Follow our development progress</li>
            <li>Get ready to secure your AI applications!</li>
          </ul>
          <p>If you have any questions, feel free to reach out via our <a href="https://safeprompt.dev/contact">contact form</a>.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            SafePrompt - Stop prompt injection in one line of code<br>
            <a href="https://safeprompt.dev">safeprompt.dev</a>
          </p>
        `
      });

      console.log('Notification emails sent for:', cleanEmail);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the signup if email fails
    }

    return {
      success: true,
      message: 'Successfully added to waitlist',
      data: { id: newEntry.id }
    };

  } catch (error) {
    console.error('Waitlist error:', error);
    return {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    };
  }
}

// Main handler
module.exports = async (req, res) => {
  // Enable CORS with strict origin for contact, open for waitlist
  const allowedOrigins = ['https://safeprompt.dev', 'https://www.safeprompt.dev'];
  const origin = req.headers.origin;

  // Set CORS headers based on action
  if (req.body && req.body.action === 'contact' && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, data } = req.body;

  if (!action || !data) {
    return res.status(400).json({
      error: 'Missing action or data',
      code: 'INVALID_REQUEST'
    });
  }

  // Get client IP
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Check rate limit
  if (!checkRateLimit(clientIp, action)) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // Initialize Resend
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Route to appropriate handler
  let result;
  switch (action) {
    case 'contact':
      result = await handleContact(data, clientIp, resend);
      break;
    case 'waitlist':
      result = await handleWaitlist(data, clientIp, resend);
      break;
    default:
      result = {
        success: false,
        error: 'Invalid action',
        code: 'INVALID_ACTION'
      };
  }

  // Return appropriate status code
  const statusCode = result.success ? 200 :
    result.code === 'RATE_LIMIT_EXCEEDED' ? 429 :
    result.code === 'INTERNAL_ERROR' ? 500 : 400;

  return res.status(statusCode).json({
    ...result,
    action
  });
};