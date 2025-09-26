# SafePrompt Integration Best Practices

## What SafePrompt Does (and Doesn't Do)

### ✅ **Our Job: Protect Against Prompt Injection**
SafePrompt has ONE job: **Detect malicious instructions that could compromise your AI systems**.

We protect against:
- Prompt injection attacks ("Ignore previous instructions...")
- Jailbreak attempts ("DAN mode", "Developer mode override")
- System prompt extraction attempts
- Instruction manipulation
- Context hijacking

### ❌ **Not Our Job: Standard Validation**
We DON'T handle:
- Email format validation (use regex)
- Phone number validation (use libphonenumber)
- Required field checks (use HTML5/JS)
- Length validation (use maxlength)
- Data type validation (use typeof)
- Profanity filtering (use bad-words library)
- Spam detection (use Akismet)

## The Critical Question: "Will This Touch AI?"

Before integrating SafePrompt, ask yourself:

**"Will this user input ever be sent to an AI model?"**

- ✅ **YES**: Use SafePrompt
- ❌ **NO**: Don't use SafePrompt

### Examples:

**Use SafePrompt:**
```javascript
// ✅ Chat messages sent to ChatGPT/Claude
const userMessage = "Help me write a poem";
await validateWithSafePrompt(userMessage);

// ✅ Support tickets processed by AI
const ticketContent = "My issue is...";
await validateWithSafePrompt(ticketContent);

// ✅ Content that AI will analyze
const reviewText = "This product is...";
await validateWithSafePrompt(reviewText);
```

**Don't Use SafePrompt:**
```javascript
// ❌ Email addresses (never sent to AI)
const email = "user@example.com";  // Just validate format locally

// ❌ Passwords (never sent to AI)
const password = "SecurePass123";  // Hash it, don't validate with us

// ❌ Static dropdown selections
const country = "United States";  // Pre-defined options are safe

// ❌ Phone numbers, zip codes, dates
const phone = "555-1234";  // Structured data, not AI input
```

## Recommended Integration Pattern

### Pattern 1: Pre-AI Validation (Recommended)

**Validate ONLY when sending to AI, not on form submission:**

```javascript
// WRONG - Validating too early
async function handleContactForm(formData) {
  // ❌ Don't validate here
  const validation = await safeprompt.validate(formData.message);
  if (!validation.safe) return;

  // Store in database
  await saveToDatabase(formData);
}

// RIGHT - Validate before AI processing
async function handleContactForm(formData) {
  // ✅ Save raw input first
  await saveToDatabase(formData);

  // Later, when processing with AI...
  const ticket = await getTicket(id);

  // ✅ Validate ONLY before sending to AI
  const validation = await safeprompt.validate(ticket.message);
  if (!validation.safe) {
    console.warn('Skipping AI processing - potential injection');
    return manualProcess(ticket);
  }

  // Safe to send to AI
  const aiResponse = await openai.complete(ticket.message);
}
```

### Pattern 2: Batch Validation for Efficiency

**If you must validate multiple fields, batch them:**

```javascript
// INEFFICIENT - Multiple API calls
const nameCheck = await validate(name);      // 50ms
const subjectCheck = await validate(subject); // 50ms
const messageCheck = await validate(message); // 50ms
// Total: 150ms+ latency

// EFFICIENT - Single batched call
const validation = await safeprompt.validateBatch({
  inputs: [
    { id: 'message', text: formData.message },
    { id: 'subject', text: formData.subject }
    // Don't include name/email - they don't go to AI
  ]
});
// Total: 50ms latency

// Parse response
const unsafe = validation.results.filter(r => !r.safe);
if (unsafe.length > 0) {
  return {
    error: `Please revise the ${unsafe[0].id} field`,
    field: unsafe[0].id
  };
}
```

### Pattern 3: Context-Aware Validation

**Tell us the context for better accuracy:**

```javascript
// BETTER - Provide context
const validation = await safeprompt.validate({
  text: userInput,
  context: 'customer_support', // or 'code_generation', 'content_creation'
  sensitivity: 'high'          // or 'medium', 'low'
});

// This helps us understand:
// - "DELETE FROM users" in code_generation context = probably legitimate SQL
// - "DELETE FROM users" in customer_support context = likely injection
```

## Integration Checklist

### 🎯 **Where to Integrate**

1. **AI Agent Tools** - Any user input sent to LLM agents
2. **Chatbots** - Messages sent to AI chat systems
3. **AI-Powered Search** - Queries processed by semantic search
4. **Content Generation** - Prompts for AI writers
5. **Code Assistants** - Input to Copilot-style tools
6. **Support Automation** - Tickets processed by AI

### 🚫 **Where NOT to Integrate**

1. **Login Forms** - Usernames/passwords don't go to AI
2. **Payment Forms** - Credit cards don't go to AI
3. **Profile Settings** - Structured data doesn't go to AI
4. **Search Boxes** - Unless it's AI-powered search
5. **Email Signup** - Email addresses don't go to AI

## Critical Implementation Tips

### 1. **Fail Smartly**
```javascript
const SAFEPROMPT_CONFIG = {
  timeout: 3000,        // 3 second max
  fallbackBehavior: 'allow_with_logging', // Not 'block'

  // Smart fallback based on context
  getFallback: (context) => {
    if (context === 'payment_description') {
      return 'allow'; // Don't block payments
    }
    if (context === 'public_chat') {
      return 'block'; // Protect public content
    }
    return 'queue_for_review';
  }
};
```

### 2. **Don't Leak Security Details**
```javascript
// BAD - Helps attackers
if (!validation.safe) {
  return {
    error: `Blocked: ${validation.threats.join(', ')}` // ❌ "sql_injection, prompt_injection"
  };
}

// GOOD - Generic message
if (!validation.safe) {
  logSecurityEvent(validation); // Log full details internally
  return {
    error: 'Your message contains content that our system cannot process. Please rephrase.'
  };
}
```

### 3. **Cache Aggressively**
```javascript
// Same input within 5 minutes? Don't re-validate
const cache = new LRU({
  max: 1000,
  ttl: 1000 * 60 * 5  // 5 minutes
});

async function validate(text) {
  const hash = crypto.createHash('md5').update(text).digest('hex');

  if (cache.has(hash)) {
    metrics.cacheHit();
    return cache.get(hash);
  }

  const result = await safeprompt.validate(text);
  cache.set(hash, result);
  return result;
}
```

### 4. **Monitor Everything**
```javascript
// Track what matters
const metrics = {
  validationRequests: 0,
  blockedThreats: 0,
  falsePositives: 0,  // User complained
  apiLatency: [],
  bypassedDueToTimeout: 0
};

// Alert on anomalies
if (metrics.blockedThreats > 100) {
  alert('Potential attack in progress');
}
if (metrics.falsePositives > 10) {
  alert('Review validation sensitivity');
}
```

## The Golden Rule

**"Validate at the point of AI interaction, not at the point of user input"**

This approach:
- ✅ Reduces latency (no validation on every keystroke)
- ✅ Saves API calls (only validate what goes to AI)
- ✅ Improves accuracy (you have full context)
- ✅ Allows human review (store first, validate later)
- ✅ Prevents data loss (never lose user input)

## Example: Correct Contact Form Integration

```javascript
// contact-form.js - Frontend
async function submitContact(formData) {
  // DO NOT validate with SafePrompt here
  // Just do standard validation

  if (!formData.email.includes('@')) {
    return { error: 'Invalid email format' };
  }

  if (formData.message.length < 10) {
    return { error: 'Message too short' };
  }

  // Send to backend
  return await fetch('/api/contact', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
}

// contact-api.js - Backend
async function handleContact(req, res) {
  const { email, subject, message } = req.body;

  // Save raw input immediately
  const ticketId = await db.tickets.create({
    email,
    subject,
    message,
    status: 'pending'
  });

  // Return success to user immediately
  res.json({ success: true, ticketId });

  // Process async with AI (if configured)
  if (config.ai.enabled) {
    processWithAI(ticketId); // This will validate
  }
}

// ai-processor.js - AI Processing
async function processWithAI(ticketId) {
  const ticket = await db.tickets.get(ticketId);

  // NOW validate before sending to AI
  const validation = await safeprompt.validate(
    ticket.message,
    { context: 'support_ticket' }
  );

  if (!validation.safe) {
    // Don't process with AI
    await db.tickets.update(ticketId, {
      status: 'needs_human_review',
      flagged_reason: 'potential_injection'
    });
    return;
  }

  // Safe to use AI
  const aiResponse = await openai.createCompletion({
    prompt: `Analyze this support ticket: ${ticket.message}`
  });

  await db.tickets.update(ticketId, {
    ai_analysis: aiResponse,
    status: 'ai_processed'
  });
}
```

## Questions to Ask Yourself

1. **"If SafePrompt is down, should my form still work?"**
   - YES → Implement fallback behavior
   - NO → You're using it wrong

2. **"Am I validating data that will never touch AI?"**
   - YES → Remove SafePrompt from that flow
   - NO → Carry on

3. **"Am I showing users why they were blocked?"**
   - YES → Stop! Use generic messages
   - NO → Good

4. **"Do I validate before or after saving to database?"**
   - BEFORE → Wrong! Save first, validate before AI
   - AFTER → Correct

5. **"How many ms of latency am I adding?"**
   - >100ms → You're validating too much
   - <50ms → Good
   - 0ms (async) → Best

## Summary

SafePrompt is NOT a general input validator. It's a specialized tool for one thing: **preventing prompt injection attacks on AI systems**.

Use it:
- ✅ Sparingly (only for AI-bound text)
- ✅ Efficiently (batch when needed)
- ✅ Intelligently (with context)
- ✅ Asynchronously (don't block users)

Don't use it:
- ❌ For email validation
- ❌ For required field checks
- ❌ For profanity filtering
- ❌ For spam detection
- ❌ For anything that doesn't touch AI

Remember: **Your users don't care about prompt injection - they care about their message being delivered. Protect your AI without punishing your users.**