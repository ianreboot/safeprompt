# SafePrompt Architecture

**Last Updated**: 2025-10-06 (Phase 1A Intelligence System Deployed)
**Version**: 1.0.0-beta with Phase 1A enhancements

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Validation Pipeline](#core-validation-pipeline)
3. [Phase 1A: Threat Intelligence System](#phase-1a-threat-intelligence-system)
4. [Database Architecture](#database-architecture)
5. [Deployment Architecture](#deployment-architecture)
6. [Security Model](#security-model)
7. [Performance Characteristics](#performance-characteristics)

---

## System Overview

SafePrompt is a multi-layer prompt injection detection service designed for high accuracy, low latency, and cost efficiency.

### High-Level Flow
```
User Input → API Gateway → Rate Limiting → Authentication
                                              ↓
                                    IP Reputation Check (Phase 1A)
                                              ↓
                                    Pattern Detection (67%)
                                              ↓
                                    External Reference Detection
                                              ↓
                                    AI Validation (33%)
                                              ↓
                                    Intelligence Collection (Phase 1A)
                                              ↓
                                    Response → User
```

### Key Design Principles
1. **Fail-Closed**: Block suspicious prompts by default
2. **Defense in Depth**: Multiple detection layers
3. **Cost Optimization**: 67% requests require $0 AI cost
4. **Privacy by Design**: 24-hour anonymization (Phase 1A)
5. **Network Intelligence**: Learn from attacks across all customers (Phase 1A)

---

## Core Validation Pipeline

### Stage 1: Pattern Detection (0ms, $0 cost)

**Purpose**: Instant detection of known attack patterns

**Components**:
- XSS pattern matching (`/api/lib/validators/xss-validator.js`)
- Template injection detection (`/api/lib/validators/template-validator.js`)
- SQL injection patterns
- Command injection patterns

**Coverage**: 67% of requests (instant block or pass)

**Example Patterns**:
```javascript
// XSS Detection
/<script[^>]*>|on\w+\s*=|javascript:/i

// Template Injection
/\{\{.*\}\}|\{\%.*\%\}/

// SQL Injection
/(\bUNION\b.*\bSELECT\b)|(\bOR\b.*=.*)/i
```

### Stage 2: External Reference Detection (5ms, $0 cost)

**Purpose**: Detect and block data exfiltration attempts

**File**: `/api/lib/external-reference-detector.js` (95% accuracy)

**Detection Methods**:
1. **URL Detection**: Plain, obfuscated, encoded URLs
2. **IP Address Detection**: IPv4, IPv6, defanged notation
3. **File Path Detection**: Local/UNC paths, sensitive files
4. **Action Verb Analysis**: "visit", "fetch", "access", "retrieve"

**Encoding Bypass Prevention**:
- ROT13: `uryyb → hello`
- Base64: `aHR0cDov... → http://...`
- Hex encoding: `%68%74%74%70...`
- Homoglyphs: `еxamplе.com` (Cyrillic 'е')

**Example**:
```
"Visit https://evil.com" → BLOCKED (URL + action verb)
"The URL is https://docs.aws.com" → ALLOWED (no action verb)
```

### Stage 3: AI Validation (200-600ms, minimal cost)

**Architecture**: 2-pass validation with intelligent escalation

#### Pass 1: Quick Screening (~36% of requests)
**Model**: Google Gemini 2.0 Flash (FREE) or Llama 3.1 8B Instruct (fallback)
**Response Time**: 200-300ms
**Purpose**: Fast triage of ambiguous cases

**Decision Logic**:
- `confidence >= 0.9` → Accept result
- `confidence < 0.9 OR protocol_integrity_fail` → Escalate to Pass 2

#### Pass 2: Deep Analysis (~5% of requests)
**Model**: Google Gemini 2.5 Flash or Llama 3.1 70B Instruct (fallback)
**Response Time**: 400-600ms
**Purpose**: High-confidence verdict for complex attacks

**Triggered When**:
- Pass 1 confidence < 0.9
- Protocol integrity violation detected
- Ambiguous business context

**File**: `/api/lib/ai-validator-hardened.js`

### Stage 4: Consensus Engine

**Purpose**: Reconcile multiple validator outputs

**Logic**:
1. Collect verdicts from all validators
2. If any validator says UNSAFE → UNSAFE (fail-closed)
3. Calculate weighted confidence score
4. Apply business context overrides (if applicable)

**File**: `/api/lib/consensus-engine.js`

---

## Phase 1A: Threat Intelligence System

**Deployed**: 2025-10-06
**Purpose**: Build competitive moat through network defense intelligence

### Architecture Overview

```
┌──────────────────────────────────────────────────┐
│ Validation Request                               │
│ X-User-IP: 203.0.113.45                         │
└───────────┬──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────┐
│ IP Reputation Check (Pro Tier)                   │
│ - Query ip_reputation table by hash              │
│ - If auto_block=true → Immediate rejection       │
│ - Otherwise → Continue validation                │
└───────────┬──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────┐
│ Core Validation Pipeline                         │
│ (Pattern → External Ref → AI)                    │
└───────────┬──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────┐
│ Intelligence Collection (Non-Blocking)           │
│ - Fire-and-forget async write                    │
│ - Store: prompt, IP, attack vectors, severity    │
│ - Respect opt-out preferences (Pro tier)         │
└───────────┬──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────┐
│ Background Jobs (Hourly)                         │
│ - Anonymize samples >24h old                     │
│ - Update IP reputation scores                    │
│ - Clean up expired sessions                      │
└──────────────────────────────────────────────────┘
```

### Key Components

#### 1. Intelligence Collector (`/api/lib/intelligence-collector.js`)
**Purpose**: Capture attack samples for network learning

**What's Collected**:
- Prompt text (24h retention)
- Client IP (24h retention)
- Attack vectors detected
- Threat severity (low/medium/high/critical)
- Confidence score
- Session ID
- User tier (free/pro)

**Privacy Protection**:
- Free tier: Only collects BLOCKED prompts
- Pro tier: Respects opt-out preference
- Test suite: Excluded via `X-SafePrompt-Test-Suite` header
- Automatic anonymization after 24 hours

#### 2. IP Reputation System (`/api/lib/ip-reputation.js`)
**Purpose**: Track and block malicious IP addresses

**Storage**: Hash-based, permanent
```sql
ip_reputation {
  ip_hash: SHA-256(IP + salt)
  total_samples: int
  blocked_samples: int
  block_rate: computed (blocked/total)
  reputation_score: 0-1 (lower = worse)
  auto_block: boolean
  primary_attack_types: text[]
}
```

**Auto-Block Logic** (Pro tier only):
- Threshold: block_rate > 0.7 AND total_samples >= 10
- Immediate rejection: No validation performed
- Opt-in required: User must explicitly enable

#### 3. Session Storage (`validation_sessions` table)
**Purpose**: Multi-turn attack detection

**Features**:
- Context priming detection (fake ticket references)
- RAG poisoning protection (malicious document injection)
- Session TTL: 2 hours
- Automatic cleanup via background job

#### 4. Background Jobs (`/api/lib/background-jobs.js`)
**Schedule**: Hourly via Vercel Cron

**Job 1: Anonymization**
```sql
UPDATE threat_intelligence_samples
SET prompt_text = NULL,
    client_ip = NULL,
    anonymized_at = NOW()
WHERE created_at < NOW() - INTERVAL '24 hours'
  AND anonymized_at IS NULL;
```

**Job 2: IP Reputation Scoring**
```sql
UPDATE ip_reputation
SET reputation_score = 1 - (blocked_samples::numeric / total_samples::numeric),
    auto_block = (block_rate > 0.7 AND total_samples >= 10)
WHERE last_seen > NOW() - INTERVAL '7 days';
```

**Job 3: Session Cleanup**
```sql
DELETE FROM validation_sessions
WHERE expires_at < NOW();
```

### Business Model

**Free Tier**:
- Contributes attack data automatically (no opt-out)
- No IP blocking capability
- Full validation accuracy

**Pro Tier** ($5-29/month):
- Opt-in for intelligence sharing (can disable)
- IP reputation blocking (requires opt-in)
- Multi-turn session tracking
- Same validation accuracy

### Privacy & Compliance

**GDPR/CCPA Compliant**:
- 24-hour anonymization: Full prompt text deleted after 24h
- Right to deletion: `/api/v1/privacy/delete` endpoint
- Right to access: `/api/v1/privacy/export` endpoint
- Permanent storage: Only cryptographic hashes (no PII)

**Legal Basis**:
- Free tier: Legitimate interest (network security)
- Pro tier: Contractual necessity + explicit consent for opt-in features

---

## Database Architecture

### Production Database (Supabase)
**URL**: https://adyfhzbcsqzgqvyimycv.supabase.co
**Region**: us-west-1

### Core Tables

#### 1. `profiles` (User Management)
```sql
profiles {
  id: uuid (auth.users foreign key)
  email: text
  api_key: text (unique)
  tier: text (free | starter | pro | business | internal)
  subscription_status: text
  subscription_tier: text
  usage_count: integer
  usage_limit: integer
  reset_date: timestamptz
  preferences: jsonb  -- Phase 1A
}
```

#### 2. `validation_sessions` (Phase 1A - Multi-Turn Detection)
```sql
validation_sessions {
  session_token: text (primary key)
  user_id: uuid (nullable)
  created_at: timestamptz
  last_activity: timestamptz
  expires_at: timestamptz (2-hour TTL)
  history: jsonb (array of validation events)
  flags: jsonb (suspicious pattern tracking)
  ip_fingerprint: text
  request_count: integer
}
```

#### 3. `threat_intelligence_samples` (Phase 1A - Attack Storage)
```sql
threat_intelligence_samples {
  id: uuid
  prompt_text: text (deleted after 24h)
  prompt_hash: text (permanent)
  client_ip: inet (deleted after 24h)
  ip_hash: text (permanent)
  attack_vectors: text[]
  threat_severity: text
  confidence_score: numeric(3,2)
  session_id: text
  subscription_tier: text
  created_at: timestamptz
  anonymized_at: timestamptz
}
```

#### 4. `ip_reputation` (Phase 1A - Network Defense)
```sql
ip_reputation {
  ip_hash: text (primary key)
  total_samples: integer
  blocked_samples: integer
  block_rate: numeric(3,2) (computed)
  reputation_score: numeric(3,2)
  auto_block: boolean
  primary_attack_types: text[]
  first_seen: timestamptz
  last_seen: timestamptz
}
```

#### 5. `ip_allowlist` (Phase 1A - CI/CD Protection)
```sql
ip_allowlist {
  id: uuid
  ip_address: inet (unique)
  ip_hash: text (unique)
  description: text
  purpose: text (ci_cd | internal_tools | security_research | customer_request)
  added_by: uuid
  added_at: timestamptz
  expires_at: timestamptz (nullable)
}
```

### RLS (Row-Level Security)

**Philosophy**: Fail-closed security with SECURITY DEFINER functions

**Example Policy**:
```sql
-- User can only see own profile
CREATE POLICY profiles_select ON profiles FOR SELECT
USING (auth.uid() = id OR is_internal_user());

-- SECURITY DEFINER function to avoid infinite recursion
CREATE FUNCTION is_internal_user() RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND tier = 'internal'
  );
$$;
```

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────┐
│ Cloudflare Pages (Frontend)                    │
│ - safeprompt.dev (website)                     │
│ - dashboard.safeprompt.dev (user dashboard)    │
│ - Global CDN, edge caching                     │
└────────────┬────────────────────────────────────┘
             │ HTTPS
             ▼
┌─────────────────────────────────────────────────┐
│ Vercel Serverless Functions (API)              │
│ - api.safeprompt.dev                           │
│ - /api/v1/validate (main endpoint)             │
│ - Node.js 20.x runtime                         │
│ - Auto-scaling, zero cold starts               │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ OpenRouter (AI Validation)                     │
│ - Pass 1: Gemini 2.0 Flash                     │
│ - Pass 2: Gemini 2.5 Flash                     │
│ - Automatic failover to Llama models           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Supabase (Database)                            │
│ - PostgreSQL 15 (managed)                      │
│ - PROD: adyfhzbcsqzgqvyimycv                   │
│ - Connection pooling (6543)                    │
│ - RLS policies enabled                         │
└─────────────────────────────────────────────────┘
```

### Development Environment

**Complete isolation**: Separate Cloudflare projects, Vercel projects, and Supabase databases

```
DEV URLs:
- dev.safeprompt.dev
- dev-dashboard.safeprompt.dev
- dev-api.safeprompt.dev

DEV Database:
- vkyggknknyfallmnrmfu.supabase.co
- Same schema as PROD
- Test data only
```

### Deployment Workflow

**Frontend (Cloudflare Pages)**:
```bash
npm run build
wrangler pages deploy out --project-name safeprompt --branch main
```

**API (Vercel)**:
```bash
vercel --token="$VERCEL_TOKEN" --prod
```

**Database (Supabase)**:
```bash
supabase db push  # Apply migrations
```

---

## Security Model

### Authentication
- **API Key**: `sp_live_` prefix, 64-character hex
- **Storage**: Hashed in database (SHA-256)
- **Rotation**: User-initiated via dashboard

### Authorization Tiers
| Tier | Validations/Month | IP Blocking | Intelligence Opt-Out |
|------|------------------|-------------|---------------------|
| Free | 1,000 | ❌ | ❌ |
| Pro | 10,000 | ✅ (opt-in) | ✅ |
| Business | 250,000 | ✅ (opt-in) | ✅ |
| Internal | Unlimited | ✅ | ✅ |

### Rate Limiting
- **Free**: 10 req/sec
- **Pro**: 50 req/sec
- **Business**: 100 req/sec

### CORS Policy
**Allowed Origins** (whitelist only):
- https://safeprompt.dev
- https://dashboard.safeprompt.dev
- https://dev.safeprompt.dev
- http://localhost:3000

**Never**: Wildcard (`*`) CORS headers

### Encryption
- **In Transit**: TLS 1.3
- **At Rest**: Supabase encryption-at-rest
- **Hashing**: SHA-256 with salt for IP addresses

---

## Performance Characteristics

### Response Time Distribution

```
Pattern Detection (67%):       <10ms    (median: 2ms)
External Ref Detection (15%):  <20ms    (median: 5ms)
AI Pass 1 (30%):                200-300ms
AI Pass 2 (5%):                 400-600ms

Overall P50: 250ms
Overall P95: 3.2s
Overall P99: 3.3s
```

### Cost Structure

```
Pattern/External Ref (82%): $0 per request
AI Pass 1 (13%):            $0.0002 per request
AI Pass 2 (5%):             $0.0005 per request

Average cost: $0.000080 per request
Cost at scale (1M req): ~$80/month
```

### Accuracy (94-test professional suite)

```
Overall Accuracy: 98.9% (93/94 tests passing)
Attack Detection: 96.8% (60/62 attacks blocked)
False Positives: 0% (32/32 legitimate approved)

Known Limitations:
- 2 ambiguous override tests (business context edge cases)
```

### Scalability

**Tested Load**:
- Peak: 50 req/sec sustained (890 requests over 5 minutes)
- Success Rate: 100%
- Zero errors under load

**Bottlenecks**:
- OpenRouter API latency (2-3s for Pass 2)
- Supabase connection pool (max 60 connections)

**Recommended Max**:
- 25 req/sec sustained (100-200 concurrent users)
- Scale horizontally via Vercel edge functions

---

## Monitoring & Observability

### Key Metrics

**Response Time**:
- P50, P95, P99 latency
- Breakdown by detection method

**Accuracy**:
- Attack detection rate
- False positive rate
- Confidence score distribution

**Intelligence System (Phase 1A)**:
- Samples collected per day
- Anonymization success rate
- IP reputation score distribution
- Auto-block rate

**Business Metrics**:
- API key usage by tier
- Rate limit violations
- Revenue per 1K requests

### Alerting

**Critical Alerts**:
- API error rate >1%
- Response time P95 >5s
- Database connection failures
- Anonymization job failures (legal compliance)

**Warning Alerts**:
- Response time P95 >3s
- Rate limit violations spike
- OpenRouter model failures

### Logging

**Structured Logs** (JSON format):
```json
{
  "timestamp": "2025-10-06T10:00:00Z",
  "level": "info",
  "service": "validation",
  "api_key_hash": "abc123...",
  "user_tier": "pro",
  "prompt_length": 42,
  "detection_method": "pattern_detection",
  "threats": ["xss_attack"],
  "confidence": 0.95,
  "processing_time_ms": 5,
  "ip_reputation_score": 0.92,
  "session_id": "sess_abc123"
}
```

---

## References

**Complete Phase 1A Details**: `/home/projects/safeprompt/docs/PHASE_1A_INTELLIGENCE_ARCHITECTURE.md`

**Related Documentation**:
- `/home/projects/safeprompt/CLAUDE.md` - Operations guide
- `/home/projects/safeprompt/docs/API.md` - API reference
- `/home/projects/safeprompt/docs/TESTING_REGIMENT.md` - Testing strategy

**Migration Files**:
- `/home/projects/safeprompt/supabase/migrations/` - Database schema

---

**Document Version**: 1.0 (Phase 1A complete)
**Next Update**: Phase 1B (session-based validation integration)
