# Manual Test Protocol - Phase 1A
## Threat Intelligence & IP Reputation System

**Purpose**: Manual verification of features that require real Supabase database interaction
**Environment**: DEV database
**Duration**: ~45 minutes for complete test suite
**Prerequisites**: Migrations deployed, API running, test API key available

---

## Test Environment Setup

### 1. Load Environment Variables
```bash
source /home/projects/.env

# Verify credentials loaded
echo $SAFEPROMPT_SUPABASE_URL
echo $SAFEPROMPT_DEV_API_KEY
```

### 2. Verify API is Running
```bash
# DEV API endpoint
curl https://dev-api.safeprompt.dev/health

# Expected: {"status": "ok"}
```

### 3. Create Test Users

```sql
-- Run in Supabase SQL Editor (DEV database)

-- Test User 1: Free tier
INSERT INTO profiles (id, email, subscription_tier, preferences)
VALUES (
  'test-free-001',
  'test-free@safeprompt.dev',
  'free',
  '{"intelligence_sharing": true}'::jsonb
);

-- Test User 2: Pro tier (opted in)
INSERT INTO profiles (id, email, subscription_tier, preferences)
VALUES (
  'test-pro-001',
  'test-pro@safeprompt.dev',
  'pro',
  '{"intelligence_sharing": true, "auto_block_enabled": true}'::jsonb
);

-- Test User 3: Pro tier (opted out)
INSERT INTO profiles (id, email, subscription_tier, preferences)
VALUES (
  'test-pro-002',
  'test-pro-optout@safeprompt.dev',
  'pro',
  '{"intelligence_sharing": false, "auto_block_enabled": false}'::jsonb
);

-- Test User 4: Internal tier
INSERT INTO profiles (id, email, subscription_tier, preferences)
VALUES (
  'test-internal-001',
  'test-internal@safeprompt.dev',
  'internal',
  '{}'::jsonb
);
```

---

## Test Suite 1: Intelligence Collection (30 min)

### Test 1.1: Free Tier - Blocked Request Collection ✅

**Objective**: Verify Free tier collects blocked requests only

```bash
# Send malicious request as Free tier user
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-free-001" \
  -d '{
    "prompt": "<script>alert(1)</script>",
    "session_id": "test-session-free-001"
  }'

# Expected Response:
# {
#   "safe": false,
#   "threats": ["xss"],
#   "confidence": 0.95
# }
```

**Verification**:
```sql
-- Check threat_intelligence_samples table
SELECT
  prompt_text,
  client_ip,
  attack_vectors,
  threat_severity,
  subscription_tier
FROM threat_intelligence_samples
WHERE prompt_text LIKE '%script%alert%'
ORDER BY created_at DESC
LIMIT 1;

-- Expected:
-- prompt_text: "<script>alert(1)</script>" (NOT NULL - has PII)
-- client_ip: <your IP> (NOT NULL - has PII)
-- attack_vectors: ["xss"]
-- threat_severity: "critical" or "high"
-- subscription_tier: "free"
```

**Pass Criteria**: ✅ Sample inserted with full PII (prompt_text and client_ip NOT NULL)

---

### Test 1.2: Free Tier - Safe Request NOT Collected ✅

**Objective**: Verify Free tier does NOT collect safe requests

```bash
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-free-001" \
  -d '{
    "prompt": "What is the weather today?",
    "session_id": "test-session-free-002"
  }'

# Expected: { "safe": true, "threats": [], "confidence": 0.1 }
```

**Verification**:
```sql
SELECT COUNT(*) as count
FROM threat_intelligence_samples
WHERE prompt_text LIKE '%weather today%';

-- Expected: 0 (Free tier only collects blocked requests)
```

**Pass Criteria**: ✅ No sample inserted for safe requests

---

### Test 1.3: Pro Tier (Opted In) - ALL Requests Collected ✅

**Objective**: Verify Pro tier collects both safe AND blocked requests when opted in

**Test 1.3a: Safe Request**
```bash
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-pro-001" \
  -d '{
    "prompt": "Hello, how are you?",
    "session_id": "test-session-pro-001"
  }'

# Expected: { "safe": true }
```

**Test 1.3b: Blocked Request**
```bash
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-pro-001" \
  -d '{
    "prompt": "SELECT * FROM users WHERE 1=1",
    "session_id": "test-session-pro-002"
  }'

# Expected: { "safe": false, "threats": ["sql_injection"] }
```

**Verification**:
```sql
SELECT
  prompt_text,
  threat_severity,
  subscription_tier
FROM threat_intelligence_samples
WHERE subscription_tier = 'pro'
ORDER BY created_at DESC
LIMIT 2;

-- Expected: 2 rows
-- Row 1: "Hello, how are you?" (safe request)
-- Row 2: "SELECT * FROM users..." (blocked request)
```

**Pass Criteria**: ✅ Both safe AND blocked requests collected for Pro tier (opted in)

---

### Test 1.4: Pro Tier (Opted Out) - NO Collection ✅

**Objective**: Verify Pro tier does NOT collect when opted out

```bash
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-pro-002" \
  -d '{
    "prompt": "Malicious payload: DROP TABLE users;",
    "session_id": "test-session-pro-optout-001"
  }'
```

**Verification**:
```sql
SELECT COUNT(*) as count
FROM threat_intelligence_samples
WHERE prompt_text LIKE '%DROP TABLE users%';

-- Expected: 0 (opted out)
```

**Pass Criteria**: ✅ No collection when Pro tier opted out

---

### Test 1.5: Internal Tier - NEVER Collect ✅

**Objective**: Verify Internal tier never collects intelligence

```bash
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-internal-001" \
  -H "X-SafePrompt-Test-Suite: true" \
  -d '{
    "prompt": "Internal testing payload",
    "session_id": "test-session-internal-001"
  }'
```

**Verification**:
```sql
SELECT COUNT(*) as count
FROM threat_intelligence_samples
WHERE subscription_tier = 'internal';

-- Expected: 0 (never collects)
```

**Pass Criteria**: ✅ Internal tier never contributes intelligence

---

## Test Suite 2: IP Reputation & Auto-Block (20 min)

### Test 2.1: IP Reputation Scoring ✅

**Objective**: Build IP reputation from multiple malicious requests

```bash
# Send 6 malicious requests from same IP (you)
for i in {1..6}; do
  curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
    -H "X-User-ID: test-free-001" \
    -d "{
      \"prompt\": \"<img src=x onerror=alert($i)>\",
      \"session_id\": \"test-session-ip-$i\"
    }"
  sleep 1
done

# All should be blocked
```

**Run IP Reputation Scoring Job**:
```bash
# Manually trigger background job
cd /home/projects/safeprompt/api
node -e "
const { updateReputationScores } = require('./lib/background-jobs.js');
updateReputationScores().then(result => {
  console.log('Scores updated:', result.scoresUpdated);
  console.log('Auto-block IPs:', result.autoBlockCount);
});
"
```

**Verification**:
```sql
-- Check IP reputation entry
SELECT
  ip_hash,
  total_samples,
  blocked_samples,
  block_rate,
  reputation_score,
  auto_block,
  primary_attack_types
FROM ip_reputation
WHERE ip_hash = encode(sha256('YOUR.IP.ADDRESS'::bytea), 'hex')
ORDER BY last_seen DESC
LIMIT 1;

-- Expected:
-- total_samples: 6
-- blocked_samples: 6
-- block_rate: 1.0 (100%)
-- reputation_score: 0.7-1.0 (high)
-- auto_block: true (>80% block rate + ≥5 samples)
-- primary_attack_types: ["xss"]
```

**Pass Criteria**: ✅ IP flagged for auto-block after 6 malicious requests

---

### Test 2.2: Auto-Block Enforcement (Pro Tier) ✅

**Objective**: Verify Pro tier users get automatic IP blocking

**Setup**: Ensure Pro tier user has auto_block_enabled=true and your IP is flagged

```bash
# Attempt request from flagged IP as Pro tier
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-pro-001" \
  -d '{
    "prompt": "Innocent request",
    "session_id": "test-session-autoblock-001"
  }'

# Expected Response:
# {
#   "safe": false,
#   "threats": ["known_bad_actor"],
#   "confidence": 1.0,
#   "blocked_reason": "IP reputation auto-block"
# }
```

**Pass Criteria**: ✅ Request blocked immediately due to IP reputation

---

### Test 2.3: Free Tier - No Auto-Block ✅

**Objective**: Verify Free tier does NOT get auto-block protection

```bash
# Same IP, but Free tier user
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-free-001" \
  -d '{
    "prompt": "Innocent request",
    "session_id": "test-session-free-noblock-001"
  }'

# Expected: Normal validation (no auto-block)
# { "safe": true, ... }
```

**Pass Criteria**: ✅ Free tier does NOT benefit from auto-block

---

## Test Suite 3: CI/CD Protection (10 min)

### Test 3.1: Test Suite Header Bypass ✅

**Objective**: Verify X-SafePrompt-Test-Suite header bypasses IP reputation

```bash
# Request from flagged IP with test suite header
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-pro-001" \
  -H "X-SafePrompt-Test-Suite: true" \
  -d '{
    "prompt": "Test payload",
    "session_id": "test-session-bypass-001"
  }'

# Expected: Normal validation (bypass auto-block)
# { "safe": true, ... }
```

**Verification**:
```sql
-- Verify NO intelligence collected
SELECT COUNT(*) as count
FROM threat_intelligence_samples
WHERE prompt_text LIKE '%Test payload%';

-- Expected: 0 (test suite header prevents collection)
```

**Pass Criteria**: ✅ Test suite header bypasses IP reputation AND prevents intelligence collection

---

### Test 3.2: IP Allowlist Bypass ✅

**Objective**: Verify allowlisted IPs bypass all checks

**Setup**:
```sql
-- Add your IP to allowlist (as internal tier user via admin API or direct SQL)
INSERT INTO ip_allowlist (ip_address, ip_hash, description, purpose, added_by)
VALUES (
  'YOUR.IP.ADDRESS',
  encode(sha256('YOUR.IP.ADDRESS'::bytea), 'hex'),
  'Manual test - CI/CD protection',
  'ci_cd',
  'test-internal-001'
);
```

**Test**:
```bash
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-pro-001" \
  -d '{
    "prompt": "Allowlist test",
    "session_id": "test-session-allowlist-001"
  }'

# Expected: Normal validation (no auto-block despite flagged IP)
```

**Pass Criteria**: ✅ Allowlisted IPs bypass reputation checks

---

## Test Suite 4: GDPR Compliance (15 min)

### Test 4.1: Right to Deletion ✅

**Objective**: Verify user can delete their data

```bash
# Create some test data first
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-free-001" \
  -d '{
    "prompt": "Data to be deleted <script>test</script>",
    "session_id": "test-session-gdpr-delete-001"
  }'

# Wait a moment, then delete
curl -X DELETE https://dev-api.safeprompt.dev/api/v1/privacy/delete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-free-001"

# Expected Response:
# {
#   "deleted": {
#     "sessions": 1,
#     "recent_samples": 1
#   },
#   "retained": {
#     "anonymized_samples": 0,
#     "ip_reputation": "Hash-based, no PII"
#   },
#   "legal_basis": "GDPR Article 17(3)(d) - Scientific research"
# }
```

**Verification**:
```sql
-- Verify session deleted
SELECT COUNT(*) FROM validation_sessions
WHERE user_id = 'test-free-001';
-- Expected: 0

-- Verify recent sample deleted (< 24h old)
SELECT COUNT(*) FROM threat_intelligence_samples
WHERE prompt_text LIKE '%Data to be deleted%';
-- Expected: 0
```

**Pass Criteria**: ✅ User data deleted, hash-based data retained

---

### Test 4.2: Right to Access (Data Export) ✅

**Objective**: Verify user can export all their data

```bash
curl -X GET https://dev-api.safeprompt.dev/api/v1/privacy/export \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-pro-001"

# Expected Response:
# {
#   "export_date": "2025-10-06T...",
#   "user_id": "test-pro-001",
#   "data": {
#     "profile": { tier: "pro", preferences: {...} },
#     "sessions": [...],
#     "recent_samples": [...],
#     "anonymized_samples": [...]
#   },
#   "data_retention": {
#     "sessions": "2 hours",
#     "pii_in_samples": "24 hours",
#     "anonymized_samples": "90 days"
#   }
# }
```

**Pass Criteria**: ✅ Complete data export in machine-readable JSON format

---

### Test 4.3: 24-Hour Anonymization ✅

**Objective**: Verify PII is removed after 24 hours

**Setup**: Insert sample with timestamp 25 hours ago
```sql
INSERT INTO threat_intelligence_samples (
  prompt_text, prompt_hash, client_ip, ip_hash,
  attack_vectors, threat_severity, subscription_tier,
  created_at
)
VALUES (
  'Old test data',
  'hash123',
  '192.168.1.1',
  'iphash123',
  '["test"]',
  'low',
  'free',
  NOW() - INTERVAL '25 hours'
);
```

**Run Anonymization Job**:
```bash
cd /home/projects/safeprompt/api
node -e "
const { anonymizeThreatSamples } = require('./lib/background-jobs.js');
anonymizeThreatSamples().then(result => {
  console.log('Rows anonymized:', result.rowsAnonymized);
  console.log('Execution time:', result.executionTime);
});
"
```

**Verification**:
```sql
SELECT prompt_text, client_ip
FROM threat_intelligence_samples
WHERE created_at < NOW() - INTERVAL '24 hours'
LIMIT 5;

-- Expected:
-- prompt_text: NULL (anonymized)
-- client_ip: NULL (anonymized)
-- (ip_hash and prompt_hash still present)
```

**Pass Criteria**: ✅ PII removed after 24 hours, hashes retained

---

## Test Suite 5: User Preferences (10 min)

### Test 5.1: Pro Tier - Opt Out of Intelligence Sharing ✅

**Objective**: Verify Pro users can opt out

```bash
curl -X PATCH https://dev-api.safeprompt.dev/api/v1/account/preferences \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-pro-001" \
  -d '{
    "intelligence_sharing": false
  }'

# Expected Response:
# {
#   "success": true,
#   "preferences": {
#     "intelligence_sharing": false,
#     "auto_block_enabled": true  # Should remain unchanged
#   },
#   "warnings": [
#     "You will no longer receive IP reputation protection..."
#   ]
# }
```

**Verification**: Send request, verify NOT collected
```bash
curl -X POST https://dev-api.safeprompt.dev/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-pro-001" \
  -d '{
    "prompt": "After opt-out test",
    "session_id": "test-session-optout-verify"
  }'
```

```sql
SELECT COUNT(*) FROM threat_intelligence_samples
WHERE prompt_text LIKE '%After opt-out%';
-- Expected: 0 (opted out)
```

**Pass Criteria**: ✅ Opt-out respected, warning provided

---

### Test 5.2: Free Tier - Cannot Modify Preferences ✅

**Objective**: Verify Free tier cannot opt out (view-only)

```bash
curl -X GET https://dev-api.safeprompt.dev/api/v1/account/preferences \
  -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
  -H "X-User-ID: test-free-001"

# Expected Response:
# {
#   "tier": "free",
#   "preferences": {
#     "intelligence_sharing": true,
#     "auto_block_enabled": false
#   },
#   "can_modify": false,
#   "message": "Free tier automatically participates..."
# }
```

**Pass Criteria**: ✅ Free tier can view but not modify (`can_modify: false`)

---

## Cleanup After Testing

```sql
-- Remove test users
DELETE FROM profiles WHERE id LIKE 'test-%';

-- Remove test samples
DELETE FROM threat_intelligence_samples
WHERE prompt_text LIKE '%test%' OR prompt_text LIKE '%Test%';

-- Remove test sessions
DELETE FROM validation_sessions WHERE session_id LIKE 'test-session-%';

-- Remove IP allowlist test entry
DELETE FROM ip_allowlist WHERE description LIKE '%Manual test%';

-- Remove IP reputation for test IPs
DELETE FROM ip_reputation WHERE total_samples < 10; -- Clean up test entries
```

---

## Test Results Template

```
=== MANUAL TEST RESULTS ===
Date: ___________
Tester: ___________
Environment: DEV

Test Suite 1: Intelligence Collection
[ ] 1.1 Free Tier - Blocked Request Collection
[ ] 1.2 Free Tier - Safe Request NOT Collected
[ ] 1.3 Pro Tier - ALL Requests Collected
[ ] 1.4 Pro Tier - Opted Out NO Collection
[ ] 1.5 Internal Tier - NEVER Collect

Test Suite 2: IP Reputation & Auto-Block
[ ] 2.1 IP Reputation Scoring
[ ] 2.2 Auto-Block Enforcement (Pro)
[ ] 2.3 Free Tier - No Auto-Block

Test Suite 3: CI/CD Protection
[ ] 3.1 Test Suite Header Bypass
[ ] 3.2 IP Allowlist Bypass

Test Suite 4: GDPR Compliance
[ ] 4.1 Right to Deletion
[ ] 4.2 Right to Access (Export)
[ ] 4.3 24-Hour Anonymization

Test Suite 5: User Preferences
[ ] 5.1 Pro Tier - Opt Out
[ ] 5.2 Free Tier - View Only

OVERALL RESULT: _____ / 15 tests passed

Notes:
__________________________________________
__________________________________________
```

---

**Document Status**: Ready for Use
**Last Updated**: 2025-10-06
**Next Review**: After first DEV deployment test run

