#!/bin/bash
# Orchestration script: Run Phase 1 + Phase 2 automatically
# Phase 1: 5 newest Chinese models
# Phase 2: 3 sweet spot models (Gemini, GPT-5, Hermes)

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  SafePrompt Model Testing - Full Test Suite             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Phase 1: 5 newest Chinese models (~2.5 hours)"
echo "Phase 2: 3 sweet spot models (~1.5 hours)"
echo "Total estimated time: 4 hours"
echo ""

# Phase 1: Newest Chinese models
echo "🚀 Starting Phase 1: Newest Chinese Models"
echo "══════════════════════════════════════════"
node test-newest-chinese-models.js

echo ""
echo "✅ Phase 1 complete!"
echo ""
echo "⏸️  5 second pause before Phase 2..."
sleep 5

# Phase 2: Sweet spot models
echo ""
echo "🚀 Starting Phase 2: Sweet Spot Models"
echo "══════════════════════════════════════════"
node test-phase2-sweet-spot.js

echo ""
echo "✅ Phase 2 complete!"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🏁 ALL TESTING COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Results files:"
echo "  Phase 1: newest-models-results-*.json"
echo "  Phase 1: newest-models-combined-results.json"
echo "  Phase 2: phase2-results-*.json"
echo "  Phase 2: phase2-combined-results.json"
echo ""
echo "Next step: Codestral re-tuning (12 configurations)"
echo "Run: node retune-codestral-2501.js"
