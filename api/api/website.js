/**
 * Consolidated Website API Endpoint
 * Handles all website/frontend backend needs in a single function
 * to work within Vercel's 12-function limit
 */

import { Resend } from 'resend';
import { validateInternal } from '../lib/internal-validator.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
let supabase;
try {
  supabase = createClient(
    process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
    process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
} catch (error) {
  console.error('Supabase initialization error - waitlist will not work:', error);
  // Continue without Supabase - contact form will still work
}

// Environment-aware URLs for emails
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://safeprompt.dev';

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
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')

    // Remove control characters and invisible text patterns
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    // Remove zero-width characters and Unicode direction overrides
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')

    // Remove CSS injection patterns
    .replace(/style\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')

    // Remove common hiding techniques
    .replace(/font-size\s*:\s*0/gi, '')
    .replace(/font-size\s*:\s*1px/gi, '')
    .replace(/color\s*:\s*(white|#fff|transparent)/gi, '')
    .replace(/display\s*:\s*none/gi, '')
    .replace(/visibility\s*:\s*hidden/gi, '')
    .replace(/position\s*:\s*absolute[^;]*(left|top)\s*:\s*-\d+/gi, '')

    // Clean up
    .trim();
}

// Email validation with strict sanitization
function sanitizeEmail(email) {
  if (typeof email !== 'string') return null;

  // Remove any HTML/script attempts
  email = email.replace(/[<>\"\']/g, '').trim();

  // Strict email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return null;
  }

  // Check for suspicious patterns
  if (email.includes('..') || email.includes('--')) {
    return null;
  }

  return email.toLowerCase();
}

// Contact form handler
async function handleContact(data, clientIp, resend) {
  try {
    const { name, email, subject, message } = data;

    // Validate all fields are present
    if (!name || !email || !subject || !message) {
      return {
        success: false,
        error: 'All fields are required',
        code: 'MISSING_FIELDS'
      };
    }

    // Clean email first for basic validation
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return {
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      };
    }

    // Validate ALL fields with SafePrompt
    // Send as JSON string for complete context
    const validationData = JSON.stringify({
      name: name,
      email: cleanEmail,
      subject: subject,
      message: message
    });

    const validation = await validateInternal(validationData, {
      mode: 'optimized'
    });

    // Check SafePrompt validation result
    if (!validation.safe) {
      console.log(`[Contact] Blocked prompt injection from ${clientIp}:`, validation.threats);

      return {
        success: false,
        error: 'Your message could not be processed. Please remove any special formatting and try again.',
        code: 'VALIDATION_FAILED',
        threats: validation.threats // For debugging
      };
    }

    // Apply sanitization after validation
    const sanitizedName = sanitizeForEmail(name);
    const sanitizedSubject = sanitizeForEmail(subject);
    const sanitizedMessage = sanitizeForEmail(message);

    // Create email HTML
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p><strong>From:</strong> ${sanitizedName}</p>
          <p><strong>Email:</strong> ${cleanEmail}</p>
          <p><strong>Subject:</strong> ${sanitizedSubject}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #666;">Message:</h3>
          <p style="white-space: pre-wrap; word-break: break-word;">${sanitizedMessage}</p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

        <div style="color: #999; font-size: 12px;">
          <p><strong>Security Information:</strong></p>
          <ul>
            <li>IP Address: ${clientIp}</li>
            <li>SafePrompt Validation: ✓ Passed</li>
            <li>Threats Detected: ${validation.threats?.length || 0}</li>
          </ul>
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
    // Check if email already exists
    const { data: existingEntry, error: checkError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', cleanEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Supabase check error:', checkError);
      return {
        success: false,
        error: 'Failed to process request. Please try again.',
        code: 'DATABASE_ERROR'
      };
    }

    if (existingEntry) {
      return {
        success: false,
        error: 'This email is already on the waitlist',
        code: 'ALREADY_EXISTS'
      };
    }

    // Add to waitlist
    const { data: newEntry, error: insertError } = await supabase
      .from('waitlist')
      .insert([
        {
          email: cleanEmail,
          source: source,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return {
        success: false,
        error: 'Failed to add to waitlist. Please try again.',
        code: 'INSERT_FAILED'
      };
    }

    // Send welcome email
    const welcomeHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to the SafePrompt Waitlist! 🎉</h2>

        <p>Thanks for your interest in SafePrompt - the one-line defense against prompt injection attacks.</p>

        <h3 style="color: #666;">What happens next?</h3>
        <ul>
          <li>We'll notify you as soon as SafePrompt is ready for beta access</li>
          <li>You'll get early access to our API documentation</li>
          <li>Beta users get special pricing locked in forever</li>
        </ul>

        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #333; margin-top: 0;">While you wait:</h4>
          <p>Check out our blog post on <a href="${WEBSITE_URL}/blog/prevent-ai-email-attacks">how Gmail's AI can be weaponized against you</a> and learn why prompt injection protection is critical.</p>
        </div>

        <p>Questions? Just reply to this email.</p>

        <p>Best regards,<br>The SafePrompt Team</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

        <p style="color: #999; font-size: 12px;">
          You're receiving this because you signed up for the SafePrompt waitlist.
        </p>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: 'SafePrompt <noreply@safeprompt.dev>',
      to: cleanEmail,
      subject: "You're on the SafePrompt waitlist! 🚀",
      html: welcomeHtml,
    });

    if (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't fail the request - they're still on the waitlist
    }

    console.log(`[Waitlist] Added ${cleanEmail} from ${source}`);

    return {
      success: true,
      message: 'Successfully added to waitlist'
    };

  } catch (error) {
    console.error('Waitlist error:', error);
    return {
      success: false,
      error: 'An error occurred. Please try again later.',
      code: 'INTERNAL_ERROR'
    };
  }
}

// Main handler
export default async function handler(req, res) {
  // Enable CORS with strict origin for contact, open for waitlist
  const allowedOrigins = [
    WEBSITE_URL,
    'https://www.safeprompt.dev',
    'https://dev.safeprompt.dev',
    'https://dev-dashboard.safeprompt.dev',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
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
    result.code === 'INVALID_REQUEST' || result.code === 'INVALID_ACTION' ? 400 :
    result.code === 'SERVICE_UNAVAILABLE' ? 503 : 500;

  return res.status(statusCode).json(result);
}