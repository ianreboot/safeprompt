#!/bin/bash

# SafePrompt Test Runner
# Tests the validation system against 3,000 test prompts

echo "==========================================="
echo "SafePrompt Validation Test Suite"
echo "Date: $(date)"
echo "==========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to test directory
cd /home/projects/safeprompt/test-suite

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Function to run a test
run_test() {
    local TEST_NAME="$1"
    local TEST_FILE="$2"

    echo -e "${YELLOW}Running: $TEST_NAME${NC}"
    echo "----------------------------------------"

    if node "$TEST_FILE"; then
        echo -e "${GREEN}✓ $TEST_NAME completed${NC}"
    else
        echo -e "${RED}✗ $TEST_NAME failed${NC}"
    fi

    echo ""
}

# Main menu
echo "Select test to run:"
echo "1) Quick validation test (10 samples)"
echo "2) Full false positive test (100 samples)"
echo "3) AI validation test"
echo "4) Benchmark performance"
echo "5) Test all free models"
echo "6) Generate new test data"
echo "7) Run all tests"
echo ""
read -p "Enter choice (1-7): " CHOICE

case $CHOICE in
    1)
        run_test "Quick Validation Test" "test-false-positives.js"
        ;;
    2)
        # Modify config for full test
        sed -i 's/maxSamples: 10/maxSamples: 100/' test-false-positives.js
        run_test "Full False Positive Test" "test-false-positives.js"
        sed -i 's/maxSamples: 100/maxSamples: 10/' test-false-positives.js
        ;;
    3)
        run_test "AI Validation Test" "test-ai-validation.js"
        ;;
    4)
        run_test "Performance Benchmark" "benchmark.js"
        ;;
    5)
        run_test "Free Models Test" "test-all-free-models.js"
        ;;
    6)
        run_test "Generate Test Data" "generate-test-datasets.js"
        ;;
    7)
        run_test "Quick Validation Test" "test-false-positives.js"
        run_test "AI Validation Test" "test-ai-validation.js"
        run_test "Performance Benchmark" "benchmark.js"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo "==========================================="
echo "Test run complete"
echo "==========================================="