#!/bin/bash
# Phase 1A Manual Test Protocol - Automated Runner
# This script automates the API testing portion of the manual test protocol
# SQL verification steps require Supabase Dashboard access

set -e

# Load environment
source /home/projects/.env

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_RUN=0

echo -e "${BLUE}=== Phase 1A Manual Test Protocol ===${NC}"
echo -e "${BLUE}Environment: DEV${NC}"
echo -e "${BLUE}API Endpoint: https://dev-api.safeprompt.dev${NC}"
echo ""

# Function to run test
run_test() {
    local test_name="$1"
    local curl_cmd="$2"
    local expected_pattern="$3"

    echo -e "${YELLOW}Running: $test_name${NC}"

    response=$(eval "$curl_cmd")

    if echo "$response" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        echo -e "Response: $response"
        ((TESTS_FAILED++))
    fi

    ((TESTS_RUN++))
    echo ""
}

echo -e "${BLUE}⚠️  PREREQUISITES (Manual Steps Required):${NC}"
echo "1. Create test users via Supabase Dashboard SQL Editor"
echo "   - Go to: https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/sql/new"
echo "   - Copy/paste: /home/projects/safeprompt/test-users.sql"
echo "   - Run the SQL (creates 4 test users with UUIDs)"
echo "   - SAVE the returned UUIDs"
echo ""
echo "2. Set environment variables with the test user UUIDs:"
echo "   export TEST_FREE_ID=\"<uuid-from-first-result>\""
echo "   export TEST_PRO_ID=\"<uuid-from-second-result>\""
echo "   export TEST_PRO_OPTOUT_ID=\"<uuid-from-third-result>\""
echo "   export TEST_INTERNAL_ID=\"<uuid-from-fourth-result>\""
echo ""
echo "3. Ensure API is deployed and running"
echo ""
read -p "Press Enter when prerequisites are complete..."
echo ""

# Verify environment variables are set
if [ -z "$TEST_FREE_ID" ] || [ -z "$TEST_PRO_ID" ] || [ -z "$TEST_PRO_OPTOUT_ID" ] || [ -z "$TEST_INTERNAL_ID" ]; then
    echo -e "${RED}ERROR: Test user IDs not set!${NC}"
    echo "Please set all test user environment variables:"
    echo "  export TEST_FREE_ID=\"...\""
    echo "  export TEST_PRO_ID=\"...\""
    echo "  export TEST_PRO_OPTOUT_ID=\"...\""
    echo "  export TEST_INTERNAL_ID=\"...\""
    exit 1
fi

echo -e "${GREEN}Test user IDs configured:${NC}"
echo "  FREE: $TEST_FREE_ID"
echo "  PRO: $TEST_PRO_ID"
echo "  PRO_OPTOUT: $TEST_PRO_OPTOUT_ID"
echo "  INTERNAL: $TEST_INTERNAL_ID"
echo ""

echo -e "${BLUE}=== Test Suite 1: Intelligence Collection ===${NC}"

# Test 1.1: Free Tier - Blocked Request Collection
run_test "1.1 Free Tier - Blocked Request Collection" \
    "curl -s -X POST https://dev-api.safeprompt.dev/api/v1/validate \
        -H 'Content-Type: application/json' \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_FREE_ID' \
        -d '{\"prompt\":\"<script>alert(1)</script>\",\"session_id\":\"test-session-free-001\"}'" \
    '"safe":false'

# Test 1.2: Free Tier - Safe Request NOT Collected
run_test "1.2 Free Tier - Safe Request NOT Collected" \
    "curl -s -X POST https://dev-api.safeprompt.dev/api/v1/validate \
        -H 'Content-Type: application/json' \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_FREE_ID' \
        -d '{\"prompt\":\"What is the weather today?\",\"session_id\":\"test-session-free-002\"}'" \
    '"safe":true'

# Test 1.3a: Pro Tier - Safe Request (Opted In)
run_test "1.3a Pro Tier - Safe Request Collection" \
    "curl -s -X POST https://dev-api.safeprompt.dev/api/v1/validate \
        -H 'Content-Type: application/json' \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_PRO_ID' \
        -d '{\"prompt\":\"Hello, how are you?\",\"session_id\":\"test-session-pro-001\"}'" \
    '"safe":true'

# Test 1.3b: Pro Tier - Blocked Request (Opted In)
run_test "1.3b Pro Tier - Blocked Request Collection" \
    "curl -s -X POST https://dev-api.safeprompt.dev/api/v1/validate \
        -H 'Content-Type: application/json' \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_PRO_ID' \
        -d '{\"prompt\":\"SELECT * FROM users WHERE 1=1\",\"session_id\":\"test-session-pro-002\"}'" \
    '"safe":false'

# Test 1.4: Pro Tier - Opted Out
run_test "1.4 Pro Tier - Opted Out NO Collection" \
    "curl -s -X POST https://dev-api.safeprompt.dev/api/v1/validate \
        -H 'Content-Type: application/json' \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_PRO_OPTOUT_ID' \
        -d '{\"prompt\":\"DROP TABLE users;\",\"session_id\":\"test-session-pro-optout-001\"}'" \
    '"safe":false'

# Test 1.5: Internal Tier - Never Collect
run_test "1.5 Internal Tier - NEVER Collect" \
    "curl -s -X POST https://dev-api.safeprompt.dev/api/v1/validate \
        -H 'Content-Type: application/json' \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_INTERNAL_ID' \
        -H 'X-SafePrompt-Test-Suite: true' \
        -d '{\"prompt\":\"Internal testing payload\",\"session_id\":\"test-session-internal-001\"}'" \
    '"safe":true'

echo -e "${BLUE}=== SQL Verification Required (Manual) ===${NC}"
echo "1. Check threat_intelligence_samples for XSS prompt (Test 1.1)"
echo "2. Verify NO safe request from Free tier (Test 1.2)"
echo "3. Verify BOTH safe AND blocked from Pro opted-in (Test 1.3)"
echo "4. Verify NO collection from Pro opted-out (Test 1.4)"
echo "5. Verify NO collection from Internal tier (Test 1.5)"
echo ""
read -p "Press Enter when SQL verification is complete..."
echo ""

echo -e "${BLUE}=== Test Suite 2: IP Reputation & Auto-Block ===${NC}"

# Test 2.1: IP Reputation Scoring (send 6 malicious requests)
echo -e "${YELLOW}Running: 2.1 IP Reputation Scoring (6 malicious requests)${NC}"
for i in {1..6}; do
    curl -s -X POST https://dev-api.safeprompt.dev/api/v1/validate \
        -H 'Content-Type: application/json' \
        -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
        -H 'X-User-ID: $TEST_FREE_ID' \
        -d "{\"prompt\":\"<img src=x onerror=alert($i)>\",\"session_id\":\"test-session-ip-$i\"}" \
        > /dev/null
    echo "  Request $i/6 sent"
    sleep 1
done
echo -e "${GREEN}✅ 6 malicious requests sent${NC}"
((TESTS_RUN++))
echo ""

echo -e "${BLUE}=== Manual Step: Run Background Job ===${NC}"
echo "Execute reputation scoring job:"
echo "  cd /home/projects/safeprompt/api"
echo "  node -e \"const { updateReputationScores } = require('./lib/background-jobs.js'); updateReputationScores().then(r => console.log(r));\""
echo ""
echo "Then verify in SQL: ip_reputation table shows auto_block=true for your IP"
echo ""
read -p "Press Enter when background job complete and verified..."
echo ""

# Test 2.2: Auto-Block Enforcement (Pro Tier)
run_test "2.2 Auto-Block Enforcement (Pro)" \
    "curl -s -X POST https://dev-api.safeprompt.dev/api/v1/validate \
        -H 'Content-Type: application/json' \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_PRO_ID' \
        -d '{\"prompt\":\"Innocent request\",\"session_id\":\"test-session-autoblock-001\"}'" \
    'known_bad_actor\|auto-block'

# Test 2.3: Free Tier - No Auto-Block
run_test "2.3 Free Tier - No Auto-Block" \
    "curl -s -X POST https://dev-api.safeprompt.dev/api/v1/validate \
        -H 'Content-Type: application/json' \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_FREE_ID' \
        -d '{\"prompt\":\"Innocent request\",\"session_id\":\"test-session-free-noblock-001\"}'" \
    '"safe":true'

echo -e "${BLUE}=== Test Suite 3: CI/CD Protection ===${NC}"

# Test 3.1: Test Suite Header Bypass
run_test "3.1 Test Suite Header Bypass" \
    "curl -s -X POST https://dev-api.safeprompt.dev/api/v1/validate \
        -H 'Content-Type: application/json' \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_PRO_ID' \
        -H 'X-SafePrompt-Test-Suite: true' \
        -d '{\"prompt\":\"Test payload\",\"session_id\":\"test-session-bypass-001\"}'" \
    '"safe":true'

echo -e "${BLUE}=== Manual Step: Add IP to Allowlist ===${NC}"
echo "Run in Supabase SQL Editor:"
echo "  INSERT INTO ip_allowlist (ip_address, ip_hash, description, purpose, added_by)"
echo "  VALUES ('YOUR.IP', encode(sha256('YOUR.IP'::bytea), 'hex'), 'Manual test', 'ci_cd', 'test-internal-001');"
echo ""
read -p "Press Enter when IP added to allowlist..."
echo ""

# Test 3.2: IP Allowlist Bypass
run_test "3.2 IP Allowlist Bypass" \
    "curl -s -X POST https://dev-api.safeprompt.dev/api/v1/validate \
        -H 'Content-Type: application/json' \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_PRO_ID' \
        -d '{\"prompt\":\"Allowlist test\",\"session_id\":\"test-session-allowlist-001\"}'" \
    '"safe":true'

echo -e "${BLUE}=== Test Suite 4: GDPR Compliance ===${NC}"

# Test 4.1: Right to Deletion
echo -e "${YELLOW}Running: 4.1 Right to Deletion${NC}"
# Create data
curl -s -X POST https://dev-api.safeprompt.dev/api/v1/validate \
    -H 'Content-Type: application/json' \
    -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
    -H 'X-User-ID: test-free-001' \
    -d '{"prompt":"Data to be deleted <script>test</script>","session_id":"test-session-gdpr-delete-001"}' \
    > /dev/null

sleep 2

# Delete data
response=$(curl -s -X DELETE https://dev-api.safeprompt.dev/api/v1/privacy/delete \
    -H 'Content-Type: application/json' \
    -H "X-API-Key: $SAFEPROMPT_DEV_API_KEY" \
    -H 'X-User-ID: test-free-001')

if echo "$response" | grep -q '"deleted"'; then
    echo -e "${GREEN}✅ PASS: 4.1 Right to Deletion${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: 4.1 Right to Deletion${NC}"
    echo "Response: $response"
    ((TESTS_FAILED++))
fi
((TESTS_RUN++))
echo ""

# Test 4.2: Right to Access (Data Export)
run_test "4.2 Right to Access (Data Export)" \
    "curl -s -X GET https://dev-api.safeprompt.dev/api/v1/privacy/export \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_PRO_ID'" \
    '"export_date"\|"data"'

echo -e "${BLUE}=== Manual Step: Test Anonymization ===${NC}"
echo "1. Insert old sample (25h ago) via SQL"
echo "2. Run anonymization job:"
echo "   cd /home/projects/safeprompt/api"
echo "   node -e \"const { anonymizeThreatSamples } = require('./lib/background-jobs.js'); anonymizeThreatSamples().then(r => console.log(r));\""
echo "3. Verify prompt_text and client_ip are NULL for old records"
echo ""
read -p "Press Enter when anonymization verified..."
echo ""

echo -e "${BLUE}=== Test Suite 5: User Preferences ===${NC}"

# Test 5.1: Pro Tier - Opt Out
run_test "5.1 Pro Tier - Opt Out of Intelligence" \
    "curl -s -X PATCH https://dev-api.safeprompt.dev/api/v1/account/preferences \
        -H 'Content-Type: application/json' \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_PRO_ID' \
        -d '{\"intelligence_sharing\":false}'" \
    '"success":true'

# Test 5.2: Free Tier - View Only
run_test "5.2 Free Tier - View Only Preferences" \
    "curl -s -X GET https://dev-api.safeprompt.dev/api/v1/account/preferences \
        -H 'X-API-Key: $SAFEPROMPT_DEV_API_KEY' \
        -H 'X-User-ID: $TEST_FREE_ID'" \
    '"can_modify":false'

echo ""
echo -e "${BLUE}=== Test Results Summary ===${NC}"
echo -e "Tests Run:    $TESTS_RUN"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
else
    echo -e "Tests Failed: 0"
fi
echo ""

echo -e "${BLUE}=== Cleanup (Manual) ===${NC}"
echo "Run in Supabase SQL Editor:"
echo "  DELETE FROM profiles WHERE email LIKE '%@safeprompt.dev';"
echo "  DELETE FROM threat_intelligence_samples WHERE prompt_text LIKE '%test%' OR prompt_text LIKE '%Test%';"
echo "  DELETE FROM validation_sessions WHERE session_id LIKE 'test-session-%';"
echo "  DELETE FROM ip_allowlist WHERE description LIKE '%Manual test%';"
echo "  DELETE FROM ip_reputation WHERE total_samples < 10;"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL AUTOMATED TESTS PASSED${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED - Review output above${NC}"
    exit 1
fi
