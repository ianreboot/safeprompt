#!/bin/bash
# Test max_tokens impact: 200 (current) vs 2000 (generous)

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  max_tokens Impact Test: 200 vs 2000                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Test 1: Current limits (baseline)
echo "📊 TEST 1: Baseline (current limits)"
echo "  Orchestrator: 150 tokens"
echo "  Validators: 150 tokens"
echo "  Pass 2: 200 tokens"
echo ""
echo "Running test suite..."
node run-realistic-tests.js > /tmp/test-baseline-200.log 2>&1

# Extract key metrics
BASELINE_ACCURACY=$(grep "Passed:" /tmp/test-baseline-200.log | head -1 | grep -oP '\d+/\d+' | head -1)
BASELINE_COST=$(grep "Total cost:" /tmp/test-baseline-200.log | grep -oP '\$\d+\.\d+')
BASELINE_ZEROC$(grep "Zero-cost tests:" /tmp/test-baseline-200.log | grep -oP '\d+/\d+')

echo "✅ Baseline complete"
echo "   Accuracy: $BASELINE_ACCURACY"
echo "   Cost: $BASELINE_COST"
echo "   Zero-cost: $BASELINE_ZEROCOST"
echo ""

# Backup current files
echo "📁 Backing up current configuration..."
cp ../api/lib/ai-orchestrator.js /tmp/ai-orchestrator.js.backup
cp ../api/lib/validators/attack-detector.js /tmp/attack-detector.js.backup
cp ../api/lib/validators/semantic-analyzer.js /tmp/semantic-analyzer.js.backup
cp ../api/lib/validators/business-validator.js /tmp/business-validator.js.backup
cp ../api/lib/ai-validator-hardened.js /tmp/ai-validator-hardened.js.backup

# Test 2: High limits
echo "📊 TEST 2: Generous limits"
echo "  Orchestrator: 2000 tokens"
echo "  Validators: 2000 tokens"
echo "  Pass 2: 2000 tokens"
echo ""

# Update max_tokens to 2000
sed -i 's/max_tokens: 150/max_tokens: 2000/g' ../api/lib/ai-orchestrator.js
sed -i 's/max_tokens: 150/max_tokens: 2000/g' ../api/lib/validators/attack-detector.js
sed -i 's/max_tokens: 150/max_tokens: 2000/g' ../api/lib/validators/semantic-analyzer.js
sed -i 's/max_tokens: 150/max_tokens: 2000/g' ../api/lib/validators/business-validator.js
sed -i 's/maxTokens: 200/maxTokens: 2000/g' ../api/lib/ai-validator-hardened.js
sed -i 's/maxTokens = 150/maxTokens = 2000/g' ../api/lib/ai-validator-hardened.js

echo "Running test suite with 2000 token limits..."
node run-realistic-tests.js > /tmp/test-generous-2000.log 2>&1

# Extract key metrics
GENEROUS_ACCURACY=$(grep "Passed:" /tmp/test-generous-2000.log | head -1 | grep -oP '\d+/\d+' | head -1)
GENEROUS_COST=$(grep "Total cost:" /tmp/test-generous-2000.log | grep -oP '\$\d+\.\d+')
GENEROUS_ZEROCOST=$(grep "Zero-cost tests:" /tmp/test-generous-2000.log | grep -oP '\d+/\d+' | head -1)

echo "✅ Generous limits complete"
echo "   Accuracy: $GENEROUS_ACCURACY"
echo "   Cost: $GENEROUS_COST"
echo "   Zero-cost: $GENEROUS_ZEROCOST"
echo ""

# Restore original files
echo "♻️  Restoring original configuration..."
cp /tmp/ai-orchestrator.js.backup ../api/lib/ai-orchestrator.js
cp /tmp/attack-detector.js.backup ../api/lib/validators/attack-detector.js
cp /tmp/semantic-analyzer.js.backup ../api/lib/validators/semantic-analyzer.js
cp /tmp/business-validator.js.backup ../api/lib/validators/business-validator.js
cp /tmp/ai-validator-hardened.js.backup ../api/lib/ai-validator-hardened.js

# Compare results
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  COMPARISON RESULTS                                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "| Metric      | Baseline (200) | Generous (2000) | Change |"
echo "|-------------|----------------|-----------------|--------|"
echo "| Accuracy    | $BASELINE_ACCURACY | $GENEROUS_ACCURACY | TBD |"
echo "| Cost        | $BASELINE_COST | $GENEROUS_COST | TBD |"
echo "| Zero-cost   | $BASELINE_ZEROCOST | $GENEROUS_ZEROCOST | TBD |"
echo ""
echo "📄 Full logs available:"
echo "  Baseline: /tmp/test-baseline-200.log"
echo "  Generous: /tmp/test-generous-2000.log"
echo ""
echo "✅ Test complete. Original configuration restored."
