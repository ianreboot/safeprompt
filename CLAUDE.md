# SafePrompt - AI Assistant Instructions

## Project Overview
SafePrompt is a developer-first API service that prevents prompt injection attacks in AI applications. We provide a simple, fast, and transparent solution for developers who need to secure their LLM-powered features without complexity or enterprise sales cycles.

**Domain**: safeprompt.dev
**Repository**: https://github.com/ianreboot/safeprompt.git
**Status**: Pre-launch development (January 2025)

## Core Value Proposition
"Stop prompt injection in one line of code"
- **Fast**: <100ms response time (regex: 5ms, AI validation: 50-100ms)
- **Simple**: Single API endpoint, clear documentation
- **Transparent**: Public pricing, no sales calls
- **Accurate**: Multi-layer validation with confidence scoring

## Technical Architecture

### Stack
- **Frontend**: Astro + React islands + Tailwind → Cloudflare Pages
- **API**: Vercel Functions (stateless validation endpoints)
- **Database**: Supabase PostgreSQL (users, logs, billing)
- **AI**: OpenRouter (multi-model strategy for cost optimization)
- **Payments**: Stripe (subscriptions + usage-based billing)

### Validation Pipeline
1. **Regex Patterns** - Fast first pass (5ms) from `/home/projects/api/utils/prompt-validator.js`
2. **Confidence Scoring** - Determine if AI validation needed
3. **AI Validation** - Only when confidence is uncertain (OpenRouter with tiered models)
4. **Response** - Safe/unsafe verdict with confidence score

### Key Decisions Made
- **No WASM sandboxing** - Unnecessary complexity for MVP
- **Tiered AI models** - Start with cheapest (GPT-3.5), upgrade as needed
- **30-day log retention** - Balance between debugging and privacy
- **No enterprise features initially** - Focus on individual developers

## Business Strategy

### Target Customer
**Primary**: Individual developers building AI side projects
**Secondary**: Small startups (pre-Series A) adding AI features
**Anti-target**: Large enterprises wanting complex integrations

### Pricing Model
- **Free**: 10,000 validations/month
- **Starter**: $29/month - 100,000 validations
- **Pro**: $99/month - 1,000,000 validations
- **Scale**: $499/month - 10,000,000 validations

### Competitive Positioning
Unlike Lakera (enterprise) and Rebuff (open source), we focus on:
- Transparent pricing (no "contact sales")
- Developer experience (npm install → working in 30 seconds)
- Speed + accuracy balance (not paranoid mode by default)

## Current Implementation Status

### Completed
- [x] Domain registered: safeprompt.dev
- [x] Documentation drafted
- [x] Architecture designed (not validated)

### Available Assets
- Validation logic reference in `/home/projects/api/utils/prompt-validator.js`
- AI security validator in `/home/projects/api/utils/ai-security-validator.js`

### Critical Next Steps (Must Validate First)
1. **Proof of Concept** - Validate performance claims (<100ms with AI)
2. **Cost Analysis** - Verify unit economics work at scale
3. **False Positive Testing** - Reduce rate to <0.5% or implement learning mode
4. **Port validation logic** - Adapt from api project
5. **Beta user feedback** - Validate market demand

## File Structure
```
/home/projects/safeprompt/
├── CLAUDE.md          # This file
├── README.md          # Public project overview
├── docs/
│   ├── TECHNICAL.md   # Architecture, implementation details
│   ├── BUSINESS.md    # Strategy, market, pricing
│   └── API.md         # Endpoint documentation
├── api/               # Vercel Functions
├── frontend/          # Astro website + dashboard
└── packages/          # NPM packages (SDK)
```

## Development Commands

### Local Development
```bash
cd /home/projects/safeprompt

# API development
cd api && npm run dev

# Frontend development
cd frontend && npm run dev
```

### Deployment
```bash
# Deploy API to Vercel
cd api && vercel --prod

# Deploy frontend to Cloudflare Pages
cd frontend && npm run build
source /home/projects/.env && export CLOUDFLARE_API_TOKEN
wrangler pages deploy dist --project-name safeprompt --branch main
```

## Important Context
- We own the prompt validation code from Ultra Brain project
- Existing code in `/home/projects/api/utils/` can be reused
- OpenRouter API key available in `/home/projects/.env`
- Stripe integration patterns available from syncup project

## When Making Changes
1. Keep it simple - no over-engineering
2. Optimize for developer experience
3. Maintain <200ms response time target (validated at P95=67ms)
4. Document API changes in docs/API.md
5. Update this file with major decisions
6. **NO TEMPORAL FILES** - Update existing docs to reflect current state only
7. Test files go in `/home/projects/user-input/claude-safeprompt/`
8. Never reference historical states - document as deprecated if needed

## See Also
- `docs/TECHNICAL.md` - Implementation details
- `docs/BUSINESS.md` - Business strategy
- `docs/API.md` - API reference
- `docs/REALITY_CHECK.md` - Critical issues and validation requirements

## IMPORTANT: Documentation Reading Requirement
**ALL AI assistants working on this project MUST read ALL documents in the `/home/projects/safeprompt/docs/` folder before making any changes or recommendations.** These documents contain critical context about:
- Technical architecture and constraints
- Business model viability issues
- Performance reality checks
- Unit economics that need validation
- Go/no-go decision criteria

Failure to read these documents will result in repeating mistakes and building on false assumptions.