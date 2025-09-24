#!/bin/bash
# SafePrompt Startup Health Monitor
# Simple, dependency-free monitoring for a $0 revenue startup
# Usage: ./startup-monitor.sh
# Cron: */5 * * * * /home/projects/safeprompt/startup-monitor.sh >> /var/log/safeprompt-monitor.log 2>&1

echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] SafePrompt Health Check"

# Configuration
WEBSITE_URL="https://safeprompt.dev"
API_URL="https://api.safeprompt.dev/api/v1/check"
TIMEOUT=10

# Colors for output (if terminal supports)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
CRITICAL_FAILURES=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"
    local expected_text="$5"
    local is_critical="${6:-true}"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "Testing $name... "

    # Prepare curl command
    local curl_cmd="curl -s -w '%{http_code}|%{time_total}' --max-time $TIMEOUT"

    if [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST -H 'Content-Type: application/json'"
        if [ -n "$data" ]; then
            curl_cmd="$curl_cmd -d '$data'"
        fi
    fi

    # Execute request
    local result
    result=$(eval "$curl_cmd '$url'" 2>/dev/null)
    local exit_code=$?

    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}FAIL${NC} - Request failed (curl exit code: $exit_code)"
        if [ "$is_critical" = "true" ]; then
            CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
        fi
        return 1
    fi

    # Parse result (response|status_code|time)
    local response="${result%|*|*}"
    local temp="${result#*|}"
    local status_code="${temp%|*}"
    local response_time="${temp#*|}"

    # Convert response time to ms
    local response_time_ms
    response_time_ms=$(echo "$response_time * 1000" | bc -l 2>/dev/null | cut -d. -f1)
    [ -z "$response_time_ms" ] && response_time_ms="0"

    # Check status code
    if [ "$status_code" -ge 400 ]; then
        echo -e "${RED}FAIL${NC} - HTTP $status_code (${response_time_ms}ms)"
        if [ "$is_critical" = "true" ]; then
            CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
        fi
        return 1
    fi

    # Check expected text if provided
    if [ -n "$expected_text" ] && ! echo "$response" | grep -q "$expected_text"; then
        echo -e "${RED}FAIL${NC} - Expected text not found (${response_time_ms}ms)"
        if [ "$is_critical" = "true" ]; then
            CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
        fi
        return 1
    fi

    echo -e "${GREEN}OK${NC} (${response_time_ms}ms)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
}

# Run tests
echo "Starting health checks..."

# Test website
test_endpoint "Website" "$WEBSITE_URL" "GET" "" "SafePrompt" "true"

# Test basic API
test_endpoint "Basic API" "$API_URL" "POST" '{"prompt":"Hello world"}' '"safe"' "true"

# Test waitlist API (use timestamp to avoid duplicates)
TIMESTAMP=$(date +%s)
test_endpoint "Waitlist API" "https://api.safeprompt.dev/api/waitlist" "POST" "{\"email\":\"test+$TIMESTAMP@example.com\"}" "success" "false"

# Calculate results
SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo ""
echo "=== SUMMARY ==="
echo "Tests: $PASSED_TESTS/$TOTAL_TESTS passed ($SUCCESS_RATE%)"

if [ $CRITICAL_FAILURES -eq 0 ]; then
    echo -e "Status: ${GREEN}OPERATIONAL${NC} ✅"
    echo "All critical services are running"
    exit 0
else
    echo -e "Status: ${RED}DEGRADED${NC} 🚨"
    echo "Critical failures: $CRITICAL_FAILURES"

    # Simple notification (could be enhanced with email/Slack)
    echo "ALERT: SafePrompt has $CRITICAL_FAILURES critical service failures at $(date)"

    exit 1
fi