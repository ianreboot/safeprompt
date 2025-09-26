import { createClient } from '@supabase/supabase-js';

/**
 * SafePrompt Waitlist - Correct Implementation
 *
 * This form does NOT use SafePrompt validation because:
 * 1. Email addresses NEVER go to AI
 * 2. SafePrompt doesn't validate email formats
 * 3. This is structured data, not freeform text
 */

const supabase = createClient(
  process.env.SAFEPROMPT_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  // Handle CORS
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
    const { email, source = 'website' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Standard email validation (NOT SafePrompt's job)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists in waitlist
    const { data: existing, error: checkError } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing email:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing) {
      return res.status(400).json({ error: 'Email already on waitlist' });
    }

    // Add to waitlist - no validation needed for emails
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email,
        source,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding to waitlist:', error);
      return res.status(500).json({ error: 'Failed to add to waitlist' });
    }

    // Send notification email to admin
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'SafePrompt <noreply@safeprompt.dev>',
        to: 'info@safeprompt.dev',
        subject: 'New Waitlist Signup',
        html: `
          <h2>New waitlist signup!</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <p>View all signups in Supabase dashboard.</p>
        `
      });

      // Send auto-reply to user
      await resend.emails.send({
        from: 'SafePrompt <noreply@safeprompt.dev>',
        to: email,
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

      console.log('Notification emails sent for:', email);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the signup if email fails
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully added to waitlist',
      id: data.id
    });

  } catch (error) {
    console.error('Waitlist error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}