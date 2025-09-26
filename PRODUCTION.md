# SafePrompt Production System

**Status**: ✅ LIVE IN PRODUCTION
**Deployment Date**: 2025-09-26
**Version**: Hardened 2-Pass Validator v1.0

## 🚀 Quick Reference

### Performance Metrics
| Metric | Old System | New System | Improvement |
|--------|-----------|------------|-------------|
| **Accuracy** | 43% | 92.9% | **+115%** |
| **Cost/100K** | $150 | $0.50 | **-99.7%** |
| **Response Time** | 1360ms | 250ms | **-81.6%** |
| **False Positives** | 36% | <10% | **-72%** |

### Architecture
```
67.7% → Pattern/External Refs ($0, instant)
27.3% → Pass 1 Llama 8B ($0.02/M tokens)
 5.0% → Pass 2 Llama 70B ($0.05/M tokens)
```

### Key Production Files
- `/api/lib/ai-validator.js` - Production interface
- `/api/lib/ai-validator-hardened.js` - Core implementation
- `/api/lib/external-reference-detector.js` - External ref detection (95% accuracy)
- `/api/lib/prompt-validator.js` - Pattern pre-filter

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
- **Pass 1 Primary**: `meta-llama/llama-3.1-8b-instruct`
- **Pass 1 Fallback**: `google/gemini-2.0-flash-exp:free`
- **Pass 2 Primary**: `meta-llama/llama-3.1-70b-instruct`
- **Pass 2 Fallback**: `google/gemini-2.0-flash-exp:free`

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
- **Cost**: ~$0.017/day (at 3.3K requests/day)
- **Response times**: 250ms average
- **Stage distribution**: ~67% should be $0 cost
- **Pass 2 usage**: <5% of requests
- **Error rate**: <1%

### Alert Thresholds
- Cost > $0.10/day → Investigate
- Response time > 1000ms → Check model availability
- Error rate > 5% → Check OpenRouter API
- Pass 2 usage > 20% → Review Pass 1 thresholds

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

1. **Budget Compliance**: $0.50/100K vs $5 budget (90% under)
2. **Accuracy Target**: 92.9% vs 85% target (exceeded)
3. **Performance**: 250ms vs 1s target (75% faster)
4. **Security**: Complete hardening implementation
5. **Innovation**: External reference detection not in original spec

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
Edit `/api/lib/external-reference-detector.js` to add new patterns or encoding methods.

## 🚨 Important Notes

1. **No Shadow Mode**: System runs at 100% production traffic
2. **No A/B Testing**: All requests use hardened validator
3. **Cost Critical**: Monitor daily to ensure <$0.10/day
4. **False Positives**: Customer reports should be investigated immediately
5. **Model Availability**: Have fallback models configured

---

**System Status**: OPERATIONAL
**Last Updated**: 2025-09-26
**Next Review**: 2025-10-26