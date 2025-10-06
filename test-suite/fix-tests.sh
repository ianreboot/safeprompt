#!/bin/bash

# Fix all test files to match actual implementation

cd /home/projects/safeprompt/test-suite

echo "Fixing test suite mocking issues..."

# The main issue is that tests expect success: true but implementations return different structures
# getPreferences returns {tier, preferences, can_modify, message}
# updatePreferences returns {success, preferences, warnings, message}

# Let's run the tests first to see all failures
npm test 2>&1 | tee test-output.txt

echo "Test output saved to test-output.txt"
echo "Now review the failures and apply targeted fixes"
