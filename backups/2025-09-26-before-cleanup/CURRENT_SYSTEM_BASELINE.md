# SafePrompt Current System Baseline
**Captured**: 2025-09-26

## System Architecture

### API Endpoints
- **Main Validation Endpoint**: `/api/v1/validate` (POST)
  - Location: `/home/projects/safeprompt/api/api/v1/validate.js`
  - Supports single and batch validation
  - Multiple modes: standard, optimized, ai-only, with-cache
  - API key authentication via X-API-Key header
  - Supabase integration for usage tracking

### Current Implementation
1. **Primary Validator**: Regex-based pattern matching
   - Location: `/home/projects/safeprompt/api/lib/prompt-validator.js`
   - Uses pattern matching for prompt injection, XSS, polyglot payloads
   - Business context whitelist for legitimate security discussions
   - Confidence scoring system (0.01-0.99)
   - Processing time: ~1-5ms (regex only)

2. **AI Validator** (optional, triggered by mode):
   - Location: `/home/projects/safeprompt/api/lib/ai-validator.js`
   - Currently using: `google/gemini-2.0-flash-exp:free` (FREE model)
   - Fallback models configured but not Llama
   - Simple single-pass validation
   - No external reference detection
   - No hardening measures

### Current Models Configuration
```javascript
const MODELS = {
  free_primary: 'google/gemini-2.0-flash-exp:free',    // $0 - Currently active
  fallback_mini: 'openai/gpt-4o-mini',                 // $0.15/M tokens
  fallback_gpt: 'openai/gpt-3.5-turbo',               // $0.50/M tokens
};
```

### Current Performance Metrics (Estimated)
- **Regex-only mode**:
  - Cost: $0
  - Speed: 1-5ms
  - Accuracy: ~40-60% (misses sophisticated attacks)

- **AI mode (Gemini Free)**:
  - Cost: $0 (free tier)
  - Speed: 500-1500ms
  - Accuracy: ~70-80% (single-pass, no context)

### Current Limitations
1. No external reference detection
2. No encoding/obfuscation detection beyond basic patterns
3. No 2-pass validation with context sharing
4. No system prompt isolation
5. No JSON encapsulation of untrusted input
6. No protocol integrity verification
7. Single model approach (no intelligent fallback)
8. No conversation memory or cross-session detection

### Files to Replace/Upgrade
1. **Primary**: `/home/projects/safeprompt/api/lib/ai-validator.js`
   - Replace with: `ai-validator-hardened.js`

2. **Add New**: `/home/projects/safeprompt/api/lib/external-reference-detector.js`
   - New capability not in current system

### Integration Points
The validation is called via:
```javascript
import { validatePrompt } from '../../lib/prompt-validator.js';

// When useAI is true, it internally calls ai-validator.js
const result = await validatePrompt(prompt, {
  useAI: mode === 'ai-only' || mode === 'optimized',
  includeStats: include_stats
});
```

### Database Schema (Supabase)
- **profiles** table:
  - api_key_hash (SHA256 hashed)
  - api_requests_used (counter)
  - api_requests_limit (monthly limit)
  - subscription_status (active/inactive)
  - last_used_at (timestamp)

### Environment Variables Required
```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxx  # In /home/projects/.env
SAFEPROMPT_SUPABASE_URL=xxxxx
SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY=xxxxx
SAFEPROMPT_TESTING=true  # Enable testing backdoors
```

### Cache Implementation
- Simple in-memory Map cache
- Max size: 1000 entries
- TTL: 1 hour
- Cache key: MD5 hash of `prompt:mode`

## Migration Strategy
1. The hardened validator should be a drop-in replacement for `ai-validator.js`
2. Need to maintain the same export interface
3. Add external-reference-detector as a new dependency
4. Update model configuration to use Llama models
5. Implement 2-pass logic within the validator
6. Maintain backward compatibility with existing API response format