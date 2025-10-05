# SafePrompt Business Strategy

## Mission Statement
Make AI applications secure by default with the simplest possible prompt injection protection that actually works.

## Problem We Solve

### The Pain
Developers building AI features face a dilemma:
- **Risk**: One malicious prompt can leak data, bypass restrictions, or damage reputation
- **Complexity**: Existing solutions require enterprise sales calls or complex integration
- **Cost**: Opaque pricing, often $1000s/month for basic protection
- **Performance**: Adding security shouldn't add 500ms to every request

### Our Solution
- One API endpoint
- One line of code to integrate
- One transparent price
- One promise: <100ms added latency

## Target Market

### Primary: Individual Developers (70% of focus)
**Who**: Developers building AI side projects, hackathon projects, or MVPs
**Size**: ~2M developers globally using OpenAI/Claude APIs
**Pain**: Want security but can't afford enterprise solutions
**Value Prop**: Free tier + simple integration + no sales calls

### Secondary: Small Startups (25% of focus)
**Who**: Pre-Series A startups adding AI features
**Size**: ~50K companies
**Pain**: Need production-ready security without complexity
**Value Prop**: Reliable, scalable, SOC2-ready solution

### Tertiary: Agencies & Consultants (5% of focus)
**Who**: Building AI features for clients
**Size**: ~10K firms
**Pain**: Need white-label security solution
**Value Prop**: Simple to explain and bill to clients

### Anti-Targets (Who we DON'T serve)
- Large enterprises wanting custom contracts
- Companies needing on-premise deployment
- Organizations requiring 100% guarantee (no such thing)
- Non-English primary markets (initially)

## Pricing Strategy

### Tiers (VALIDATED - Highly Profitable with Free Models)
```
Free         $0/mo       10,000 validations
Starter     $29/mo      100,000 validations  (Early Bird: $5/mo during beta)
Business    $99/mo    1,000,000 validations
Enterprise  Custom         Custom volume/SLA
```

**Unit Economics (Current State - Jan 2025):**
- Regex-only: $0.00001 per request
- With FREE AI models: $0.00001 per request (same as regex!)
- With cheapest paid AI: $0.000014 per request
- Gross margin at $29/50K: 99.97% with free models
- Break-even: 1 customer at any tier

### Why This Pricing?
- **Free**: Generous enough for real testing (not just toy examples)
- **$29**: Impulse purchase for individuals (less than ChatGPT Plus)
- **$99**: Team budget approval level
- **$499**: Still credit card territory
- **Enterprise**: We'll take their money but won't chase them

### Revenue Model
- Self-serve subscription (Stripe)
- Usage-based with monthly caps
- Annual plans with 20% discount
- No setup fees, no minimums

## Competitive Analysis

### Direct Competitors

**Lakera Guard**
- Strength: Well-funded, enterprise features
- Weakness: No transparent pricing, enterprise-focused
- Our Advantage: Developer-friendly, transparent

**Rebuff (Open Source)**
- Strength: Free, self-hostable
- Weakness: Requires infrastructure, maintenance
- Our Advantage: Managed service, always up-to-date

**Azure/AWS Solutions**
- Strength: Integrated with cloud platforms
- Weakness: Vendor lock-in, complex pricing
- Our Advantage: Platform agnostic, simple

### Indirect Competitors
- DIY regex patterns (not comprehensive)
- WAF rules (not AI-aware)
- Manual review (doesn't scale)

## Go-to-Market Strategy

### Phase 1: Private Beta (Weeks 1-4)
- 100 hand-selected developers
- Free usage for feedback
- Iterate on API based on usage

### Phase 2: Public Beta (Weeks 5-12)
- ProductHunt launch
- Hacker News Show HN
- Dev.to technical posts
- Twitter/X developer community

### Phase 3: General Availability (Week 13+)
- Paid tiers enabled
- Affiliate program (20% recurring)
- Integration marketplace listings
- Conference sponsorships

## Launch Strategy (Phase 6)

### Domain & Infrastructure
- **Domain**: safeprompt.dev (purchased, Cloudflare DNS Zone ID: d52a2b2821d830af1c9ace4cdc407a9f)
- **Legal Entity**: Under Reboot Media Inc (US company) for liability protection
- **Hosting**: Cloudflare Pages (frontend), Vercel Functions (API)
- **Repository**: Public repo under ianreboot for SDK/docs, private for core patterns

### Beta Pricing Model
- **Waitlist**: Free tier users join waitlist (creates scarcity/social proof)
- **Early Bird**: $5/month instant access with Starter tier limits (100,000 validations)
- **Value Prop**: "Get $29 Starter tier for only $5/month during beta"
- **Limited Tiers**: During beta, focus on Free (waitlist) and Early Bird (instant access)

### API Key Management System
- **Architecture**: Custom built on Supabase (preserves 100% margins)
- **Database Schema**:
  - Users table (email, signup_date, tier, stripe_customer_id)
  - API Keys table (key_hash, user_id, created_at, last_used, request_count)
  - Usage table (key_id, timestamp, endpoint, response_time, cached)
- **Payment**: Stripe for billing only (not key management)
- **Key Format**: `sp_live_` prefix for production, `sp_test_` for testing

### Website Strategy
- **Style**: Developer-first dark theme (Vercel aesthetic)
- **Hero Section**: Animated attack demonstration cycling through real examples
- **Social Proof**: Live counter "1,247 developers on waitlist"
- **Demo Components**:
  1. Attack Theater (showing real threats being blocked)
  2. Speed comparison (5ms with 100% accuracy)
  3. Live metrics (attacks blocked, false positives: 0)

### Origin Story Marketing
- **Hook**: "We discovered AI assistants processing contact forms are vulnerable"
- **Problem**: "Your Gmail AI summaries and Airtable automations can be hijacked"
- **Solution**: "SafePrompt protects your AI-powered business automation"
- **Broader Appeal**: Position as general prompt injection protection with form/CRM examples

### Developer Moat Strategy
**Why developers won't build their own:**
1. **Time Value**: 2 weeks to build = $5,000+ opportunity cost
2. **Maintenance Burden**: New attacks emerge daily
3. **Secret Advantage**: FREE AI model (they don't know)
4. **Compliance**: "We use SafePrompt" for audits
5. **Auto-Updates**: Protected against new threats automatically

### Regex System Architecture
- **Robust Design**: Pattern arrays easily extended without breaking
- **Current Structure**:
  - PROMPT_INJECTION_PATTERNS array
  - XSS_PATTERNS array
  - POLYGLOT_PATTERNS array
- **Adding Attacks**: Simply append to appropriate array
- **No Risk**: New patterns don't affect existing detection

## Marketing Channels

### Content Marketing (Primary)
- Technical blog posts with code examples
- "How we prevented X attack" case studies
- Open-source tools (prompt injection scanner)
- YouTube tutorials

### Community (Secondary)
- Discord server for users
- GitHub discussions
- Stack Overflow presence
- Reddit r/LocalLLaMA, r/OpenAI

### Paid (Minimal)
- Google Ads for "prompt injection" keywords
- Retargeting for site visitors
- Sponsor newsletters (TLDR, Pointer)

## Key Metrics

### Business Metrics
- MRR (Monthly Recurring Revenue)
- Customer Acquisition Cost
- Lifetime Value
- Churn Rate
- Free-to-Paid Conversion

### Product Metrics
- API Response Time
- False Positive Rate
- Validations per Customer
- SDK Adoption Rate

### Growth Metrics
- Sign-ups per Week
- Activation Rate (first API call)
- Retention (still active after 30 days)
- Expansion Revenue (tier upgrades)

## Success Milestones

### Month 1
- 100 beta users
- <100ms P95 latency
- 3 blog posts published

### Month 3
- 1,000 registered developers
- $5K MRR
- NPM package 1,000 weekly downloads

### Month 6
- 5,000 registered developers
- $25K MRR
- Python SDK released

### Year 1
- 20,000 registered developers
- $100K MRR
- Break-even on operations

## Competitive Moat

### Data Network Effect
Every validation improves our pattern detection. After 1M validations, we'll have the best real-world attack dataset.

### Developer Mindshare
Being the "Stripe of prompt security" - the default choice developers reach for.

### Switching Costs
Once integrated into production, changing security providers is risky.

## Risk Factors

### Technical Risks
- Major false positive incident → reputation damage
- AI model costs increase → margin pressure
- New attack vectors emerge → constant updates needed

### Market Risks
- OpenAI/Anthropic build native protection → reduced need
- Open source alternative gets good → commoditization
- Enterprise player goes downmarket → price war

### Mitigation Strategies
- Continuous model improvement
- Build community/brand beyond just API
- Add adjacent features (PII detection, content moderation)

## Exit Strategies (If needed)

### Acquisition Targets
- Cloudflare (add to Workers AI)
- Vercel (native Next.js integration)
- OpenAI/Anthropic (acqui-hire)

### Pivot Options
- General API security
- Content moderation
- AI observability platform

## Company Values

### Developer First
Every decision starts with "does this make developers' lives easier?"

### Transparent by Default
Pricing on website. Roadmap public. Mistakes acknowledged.

### Performance Obsessed
Every millisecond matters. Speed is a feature.

### Pragmatic Security
Perfect security doesn't exist. Good enough security does.

## Key Decisions & Rationale (WHY)

### 1. Why Custom API Management vs SaaS?
**Decision**: Build custom on Supabase vs Clerk/Unkey ($25-50/mo)
**Why**:
- Preserves 100% gross margins (critical for profitability)
- Full control over features and limits
- No vendor lock-in or price increases
- Supabase access already available (no additional cost)
- 1-2 days development vs $300-600/year ongoing

### 2. Why $5 Beta Pricing?
**Decision**: Waitlist (free) or $5/mo instant access
**Why**:
- Validates real demand (payment = serious interest)
- Creates urgency ("lock in $5 forever vs future $29")
- Filters tire-kickers from serious users
- Early revenue for reinvestment
- Psychological commitment increases retention

### 3. Why Public Repo for SDK Only?
**Decision**: Public SDK/docs, private core patterns
**Why**:
- Builds trust (open source SDK)
- Protects IP (attack patterns stay private)
- Prevents adversarial learning
- Standard practice (Stripe model)
- Easy contribution from community

### 4. Why Animated Attack Demo?
**Decision**: Live cycling through real attack examples
**Why**:
- Shows immediate value visually
- Technical audience appreciates real examples
- Differentiates from text-heavy competitors
- Creates "aha moment" quickly
- Uses our 2000+ test dataset effectively

### 5. Why Focus on Contact Forms Story?
**Decision**: Lead with "AI processing forms" vulnerability
**Why**:
- Concrete, relatable use case
- Every business has contact forms
- Gmail AI summaries are widely used
- Airtable automations growing fast
- Broader than just "ChatGPT apps"

### 6. Why Supabase Over Custom Database?
**Decision**: Use Supabase for all data needs
**Why**:
- Built-in auth and RLS
- Automatic API generation
- Real-time subscriptions included
- Scales to millions of users
- We already have access (no cost)

### 7. Why Not Offer Higher Tiers in Beta?
**Decision**: Only $5 tier during beta (50K limit)
**Why**:
- Focuses testing on core use case
- Simplifies support and debugging
- Creates upgrade path post-beta
- Avoids enterprise support expectations
- Maximizes learning from similar users

### 8. Why Developer-First Dark Theme?
**Decision**: Vercel/Linear aesthetic vs bright SaaS
**Why**:
- Target audience expectation
- Signals technical competence
- Reduces eye strain for coders
- Differentiates from enterprise tools
- Matches code editor environment

### 9. Why FREE Gemini Model?
**Decision**: Use google/gemini-2.0-flash-exp:free exclusively
**Why**:
- 100% gross margin (vs 60-80% with paid)
- Tested 47 models, only this one works with our API key
- 100% accuracy achieved in testing
- No risk of cost overruns
- Competitive advantage (others don't know)

### 10. Why Regex + AI Hybrid?
**Decision**: Regex first, AI for uncertain cases
**Why**:
- 5ms for obvious cases (95% of traffic)
- AI only when needed (5% of traffic)
- Reduces latency for most requests
- Fail-safe redundancy
- Cost optimization