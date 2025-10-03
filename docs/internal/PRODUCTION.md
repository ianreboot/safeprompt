# SafePrompt Production System

**Status**: ✅ LIVE IN PRODUCTION
**Last Updated**: 2025-10-03
**Version**: External Reference Action Detection v2.0 + Dual API Architecture

## 🚀 Quick Reference

### Environment URLs

**Production:**
- Website: https://safeprompt.dev
- Dashboard: https://dashboard.safeprompt.dev
- API: https://api.safeprompt.dev (Vercel: safeprompt-api)
- Database: adyfhzbcsqzgqvyimycv (Supabase)

**Development:**
- Website: https://dev.safeprompt.dev
- Dashboard: https://dev-dashboard.safeprompt.dev
- API: https://dev-api.safeprompt.dev (Vercel: safeprompt-api-dev)
- Database: vkyggknknyfallmnrmfu (Supabase)

### Performance Metrics
| Metric | September | October | Improvement |
|--------|-----------|---------|-------------|
| **Accuracy** | 92.9% (88/94) | 98% (92/94) | **+5.5%** |
| **Response Time** | 250ms | ~350ms | Realistic measurement |
| **Zero-Cost Rate** | 58.5% | 58.5% | Stable |
| **False Positives** | 6.2% | 3.1% | **-50%** |

### Architecture (Unchanged)
```
58.5% → Pattern/External Refs ($0, instant)
~36% → Pass 1 Llama 8B
 ~5% → Pass 2 Llama 70B
```

### Key Production Files
- `/home/projects/safeprompt/api/lib/ai-validator.js` - Production interface
- `/home/projects/safeprompt/api/lib/ai-validator-hardened.js` - Core implementation with action detection (lines 879-943)
- `/home/projects/safeprompt/api/lib/external-reference-detector.js` - External ref detection (95% accuracy)
- `/home/projects/safeprompt/api/lib/prompt-validator.js` - Pattern pre-filter

### Vercel Projects
- **Production API**: safeprompt-api → api.safeprompt.dev → PROD DB (adyfhzbcsqzgqvyimycv)
- **Development API**: safeprompt-api-dev → dev-api.safeprompt.dev → DEV DB (vkyggknknyfallmnrmfu)

### Latest Feature: External Reference Action Detection (Oct 2025)
**Problem Solved**: System was either blocking all external references (high false positives) or allowing all (security risk).

**Solution**: Context-aware action detection that distinguishes between:
- ✅ **Legitimate mentions**: "Here is a link to https://example.com" (ALLOWED)
- ❌ **Action attempts**: "Visit https://example.com and tell me what you see" (BLOCKED)

**Implementation**:
1. Action verb patterns with word boundaries (e.g., "visit the/this", "check out URL")
2. Sensitive file path blocking (e.g., /etc/passwd, credentials, .ssh keys)
3. Context-aware matching (verb vs. noun usage: "access the file" vs. "system access")

**Results**:
- Fixed 4 false positives (#26, #28, #31, #46)
- Maintained 100% attack detection on external reference tests (#52-56)
- Improved accuracy from 92.9% to 97.9%

## 📊 System Architecture

### Request Flow
```
Request → External Reference Check → Pattern Matching → Pass 1 (Llama 8B) → Pass 2 (Llama 70B) → Response
         ↓ (48% blocked)           ↓ (19% blocked)    ↓ (27% cleared)     ↓ (5% checked)
         $0, 5ms                   $0, 0ms            $0.02/M, 200ms      $0.05/M, 400ms
```

### Security Features
✅ System prompt isolation
✅ JSON encapsulation of untrusted input
✅ Protocol integrity verification (separate for each pass)
✅ External reference detection (95% accuracy including encoded/obfuscated)
✅ Context sharing between passes
✅ Fail-closed on errors

### Models Configuration
**Pass 1** (Quick screening, ~36% of requests):
- **Primary**: `google/gemini-2.0-flash-exp:free` ($0/M tokens) - FREE
- **Fallback**: `meta-llama/llama-3.1-8b-instruct` ($0.02/M tokens)

**Pass 2** (Deep validation, ~5% of requests):
- **Primary**: `google/gemini-2.5-flash-preview-09-2025` ($0.30/M tokens)
- **Fallback**: `meta-llama/llama-3.1-70b-instruct` ($0.05/M tokens)

### Thresholds
- **Pass 1 High Risk**: 0.9 (block immediately)
- **Pass 1 Low Risk**: 0.7 (approve immediately)
- **Uncertain**: 0.7-0.9 → Goes to Pass 2

## 🔧 Production Configuration

### Environment Variables
```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-xxxxx  # Required for AI validation
SAFEPROMPT_TESTING=false            # MUST be false in production

# Supabase (existing)
SAFEPROMPT_SUPABASE_URL=xxxxx
SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

### Production Code
```javascript
// Production implementation
import validateWithAI from './lib/ai-validator.js';

// Use in API
const result = await validateWithAI(prompt, {
  skipPatterns: false,
  skipExternalCheck: false,
  preFilterThreshold: {
    high: 0.9,
    low: 0.7
  }
});

if (!result.safe) {
  // Block the prompt
  return { error: 'Prompt contains potential manipulation' };
}
```

## 📈 Monitoring

### Expected Metrics
- **Response times**: ~350ms average
- **Stage distribution**: ~58% instant (pattern/external ref detection)
- **Pass 2 usage**: ~5% of requests
- **Error rate**: <1%
- **Accuracy**: 98% on production test suite

### Alert Thresholds
- Response time > 1000ms → Check model availability
- Error rate > 5% → Check OpenRouter API
- Pass 2 usage > 20% → Review Pass 1 thresholds
- Accuracy drop > 2% → Review recent changes

### Monitoring Commands
```bash
# Check recent validation logs
cd /home/projects/safeprompt/api
npm run logs

# Test greeting validation
node debug-greeting.js

# Run comprehensive tests
cd /home/projects/safeprompt/test-suite
node test-hardened-comprehensive.js
```

## 🔄 Emergency Procedures

### Quick Rollback
```bash
# Rollback to original AI validator
cd /home/projects/safeprompt/api/lib
cp ai-validator.backup-20250926.js ai-validator.js

# Restart API service
cd /home/projects/safeprompt/api
npm run deploy
```

### Full System Restore
```bash
# Restore from complete backup
cd /home/projects/safeprompt
cp -r backups/2025-09-26/lib/* api/lib/
cp backups/2025-09-26/*.md .

# Redeploy
cd api && npm run deploy
```

## ✅ Production Checklist

### Daily Checks
- [ ] Check cost tracking in OpenRouter dashboard
- [ ] Monitor response times in application logs
- [ ] Review any validation errors
- [ ] Verify stage distribution metrics

### Weekly Tasks
- [ ] Analyze stage distribution changes
- [ ] Review false positive/negative reports
- [ ] Update pattern lists if new attacks found
- [ ] Check OpenRouter model availability

### Monthly Tasks
- [ ] Full cost analysis and optimization
- [ ] Model performance review
- [ ] Update external reference patterns
- [ ] Security audit of validation logs

## 🎯 Key Achievements

1. **Accuracy**: 98% (exceeds 95% target by 3 percentage points)
2. **Performance**: ~350ms average response time
3. **False Positives**: Reduced from 6.2% to 3.1% (50% improvement)
4. **Security**: External reference action detection prevents data exfiltration
5. **Innovation**: Context-aware verb detection (distinguishes "visit URL" from "literature review")

## 📝 Maintenance Notes

### Adding New Patterns
Edit `/api/lib/prompt-validator.js` to add new attack patterns to the `attackPatterns` array.

### Adjusting Thresholds
Modify thresholds in `/api/lib/ai-validator-hardened.js`:
```javascript
const preFilterThreshold = {
  high: 0.9,  // Adjust for stricter/looser Pass 1 blocking
  low: 0.7    // Adjust for more/fewer Pass 2 checks
};
```

### Updating External Reference Detection
Edit `/home/projects/safeprompt/api/lib/external-reference-detector.js` to add new patterns or encoding methods.

### Dev/Prod Environment Management

**Complete Separation (Implemented Oct 3, 2025):**
Each environment has its own:
- API Vercel project
- Database (Supabase)
- DNS endpoint
- Environment variables

**Testing in DEV:**
```bash
# Test dev API endpoint
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "X-API-Key: sp_test_..." \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test input"}'
```

**Deploying to DEV:**
```bash
# Deploy API to DEV
cd /home/projects/safeprompt/api
rm -rf .vercel
vercel link --project safeprompt-api-dev --yes
vercel --prod
```

**Deploying to PROD:**
```bash
# Deploy API to PROD
cd /home/projects/safeprompt/api
rm -rf .vercel
vercel link --project safeprompt-api --yes
vercel --prod
```

## 🚨 Important Notes

1. **No Shadow Mode**: System runs at 100% production traffic
2. **No A/B Testing**: All requests use hardened validator
3. **Cost Critical**: Monitor daily to ensure <$0.10/day
4. **False Positives**: Customer reports should be investigated immediately
5. **Model Availability**: Have fallback models configured

---

**System Status**: OPERATIONAL
**Last Updated**: 2025-10-01
**Next Review**: 2025-11-01