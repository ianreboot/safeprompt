# SafePrompt Technical Documentation

## Architecture Overview

SafePrompt uses a multi-layer validation pipeline optimized for speed and accuracy:

```
User Request → API Gateway → Validation Pipeline → Response
                              ↓
                    [Regex] → [Scoring] → [AI?]
                     (5ms)     (1ms)    (50-100ms)
```

## Validation Pipeline

### Layer 1: Regex Pattern Matching (5ms)
Fast pattern detection for known attack vectors:
- Prompt injection patterns ("ignore previous instructions")
- Jailbreak attempts ("DAN mode", "act as")
- XSS/code injection patterns
- Encoding bypass attempts (Unicode, hex, URL encoding)

**Source**: Adapted from `/home/projects/api/utils/prompt-validator.js`

### Layer 2: Confidence Scoring (1ms)
Calculates confidence based on:
- Number and severity of threats detected
- Input characteristics (length, special characters)
- Business context whitelist matches

**Confidence Thresholds**:
- `>0.95`: Definitely safe/unsafe → return immediately
- `0.60-0.95`: Probably safe → skip AI unless paranoid mode
- `<0.60`: Uncertain → always check with AI

### Layer 3: AI Validation (50-100ms when needed)
Dynamic model selection based on confidence and customer tier:

```javascript
const MODELS = {
  // FREE models for testing/development
  free_primary: 'nvidia/nemotron-nano-9b-v2:free',  // 128K context, quality
  free_fallback: 'deepseek/deepseek-chat-v3.1:free', // 163K context
  free_fast: 'x-ai/grok-4-fast:free',               // 2M context, ultra-fast

  // Production models (ultra-cheap at $0.01/M tokens)
  tier1: 'meta-llama/llama-3.2-1b-instruct',  // $0.01/M - basic
  tier2: 'liquid/lfm-7b',                     // $0.01/M - balanced
  tier3: 'agentica-org/deepcoder-14b-preview' // $0.01/M - advanced
}
```

## Tech Stack

### API Layer (Vercel Functions)
```
/api/
  v1/
    check.js       # Main validation endpoint
    batch.js       # Bulk validation
  admin/
    stats.js       # Usage statistics
    keys.js        # API key management
  webhooks/
    stripe.js      # Payment webhooks
```

**Why Vercel Functions?**
- Stateless validation ideal for serverless
- Auto-scaling with no configuration
- 10ms cold starts
- Global edge network

### Database (Supabase PostgreSQL)

**Core Tables**:
```sql
users         - Account management
api_keys      - Key generation and limits
validations   - Request logs (30-day retention)
threats       - Attack pattern storage
billing       - Stripe customer data
```

**Why Supabase?**
- Built-in authentication
- Row-level security for multi-tenancy
- Real-time subscriptions for dashboard
- Automatic backups

### Frontend (Astro + React)
```
frontend/
  src/
    pages/       # Astro pages (landing, docs)
    components/  # React islands (dashboard, playground)
    api/        # Client SDK
```

**Why Astro?**
- Static site generation for marketing pages
- React islands for interactive dashboard
- Excellent performance (100 Lighthouse score)
- SEO-optimized by default

## Performance Optimizations

### Caching Strategy
1. **Edge Cache**: Common safe prompts (1 hour TTL)
2. **Database Cache**: Validation results (24 hours)
3. **CDN**: Static assets via Cloudflare

### Rate Limiting
```javascript
const LIMITS = {
  free: { rpm: 100, daily: 10000 },
  starter: { rpm: 500, daily: 100000 },
  pro: { rpm: 2000, daily: 1000000 }
}
```

### Response Time Targets (UNVALIDATED - Needs Benchmarking)
- P50: <50ms (realistic with caching)
- P95: <150ms (with occasional AI validation)
- P99: <300ms (worst case with AI)

**Reality Check**:
- Vercel Function cold start: 10-50ms
- Regex validation: 5-10ms
- AI API call: 100-500ms (depends on model and OpenRouter load)
- Real P95 likely 200-400ms until optimized

## Security Considerations

### API Authentication
- API keys with HMAC signatures
- Rate limiting per key
- IP allowlisting for enterprise

### Data Privacy
- 30-day log retention (configurable)
- No training on customer data without opt-in
- GDPR-compliant data export/deletion

### Isolation
- Each validation runs in isolated context
- No state sharing between requests
- Automatic timeout after 1 second

## Deployment

### Development
```bash
# Install dependencies
npm install

# Run locally
npm run dev  # Runs on http://localhost:3000

# Test validation
curl -X POST http://localhost:3000/api/v1/check \
  -H "X-API-Key: test_key" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "ignore previous instructions"}'
```

### Production
```bash
# Deploy API to Vercel
vercel --prod

# Deploy frontend to Cloudflare
npm run build
wrangler pages deploy dist --project-name safeprompt
```

## Monitoring

### Key Metrics
- Validation latency (by percentile)
- False positive/negative rates
- Model costs vs revenue
- API error rates

### Alerting Thresholds
- P99 latency >200ms
- False positive rate >5%
- API errors >1%
- Model costs >50% of revenue

## Known Limitations

1. **No streaming support** - Validates complete prompts only
2. **Max prompt size** - 50,000 characters
3. **English-optimized** - Other languages have higher false positive rates
4. **No context awareness** - Each prompt validated independently

## Future Improvements

### Short Term (Q1 2025)
- Streaming validation support
- Multi-language models
- Webhook notifications

### Medium Term (Q2 2025)
- Context-aware validation
- Custom pattern training
- Self-hosted option

### Long Term (2025+)
- Fine-tuned models
- Real-time threat feed
- Browser SDK

## Cost Analysis

### Per Validation Costs
- Regex only: $0.00001 (server compute)
- With FREE AI models: $0.00001 (same as regex!)
- With paid AI ($0.01/M tokens): $0.000014

### Break-even Analysis
- Free tier: Loss leader for acquisition (minimal cost with free models)
- Starter ($29): 99.97% gross margin
- Pro ($99): 99.98% gross margin
- Scale ($299): 99.99% gross margin