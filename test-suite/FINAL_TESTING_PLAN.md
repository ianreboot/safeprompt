# FINAL Testing Plan: Newest Chinese Models + Codestral Re-Tuning

**Date:** 2025-10-01
**Strategy:** Option C (Parallel Testing) - Maximize speed and coverage
**Duration:** 3-4 days estimated

---

## Executive Context

### What We Now Know (After Discovery)

**Pass 2 Baseline Reality:**
- Current: llama-3.1-70b-instruct
- Assumed: 100% accuracy, ~400ms latency
- **Actual: 95.7% accuracy, 3000ms latency** (tested 46/50 prompts)
- Status: ❌ NOT PERFECT (foundation was weaker than believed)

**This Changes Everything:**
- We already tested BETTER models (Codestral 96%, 372ms, $0.30/M)
- Success bar is 96%+, not 100%
- Many "rejected" models are now viable with re-tuning

### User's Key Insight

> "Maybe smarter models can do it faster for less cost"

**This is brilliant.** Effective cost = (price per token) × (latency) × (error rate)

Example:
- Model A: $0.30/M, 1000ms, 96% = high effective cost
- Model B: $0.60/M, 300ms, 100% = lower effective cost

**We must test this hypothesis with newest Chinese models.**

---

## Testing Strategy: Option C (Parallel)

### Track 1: Test 5 Newest Chinese Models
**Goal:** Find fast, accurate models released in last 30 days

### Track 2: Re-Tune Codestral 2501
**Goal:** Optimize known 96% model to 98-100%

### Track 3: Calculate Effective Cost Metrics
**Goal:** Determine true cost-per-validation for each model

---

## Track 1: Newest Chinese Models (Full Test Suite)

### Selection Criteria

**Must Have:**
- ✅ Released Aug-Sept 2025 (last 60 days)
- ✅ Price ≤ $1.00/M (your budget ceiling)
- ✅ Chinese provider (cost efficiency priority)
- ✅ Available on OpenRouter (no HTTP 404/429)

### Selected Models (5)

#### 1. **z-ai/glm-4.6** (TOP PRIORITY - User Requested)
- **Released:** 2025-09-30 (YESTERDAY!)
- **Price:** $0.60/M
- **Context:** 202,752 tokens
- **Why:** Newest GLM version, user specifically asked about it
- **Hypothesis:** If 2x faster than GLM-4.5, same effective cost at higher accuracy

#### 2. **deepseek/deepseek-v3.2-exp** (EXPERIMENTAL FLAGSHIP)
- **Released:** 2025-09-29 (2 days ago)
- **Price:** $0.27/M (cheaper than current!)
- **Context:** 163,840 tokens
- **Why:** Newest DeepSeek, "experimental" may mean cutting-edge
- **Hypothesis:** V3.2 may fix issues we saw in V3 testing

#### 3. **qwen/qwen3-vl-235b-a22b-thinking** (MASSIVE MODEL)
- **Released:** 2025-09-23 (8 days ago)
- **Price:** $0.30/M
- **Context:** 131,072 tokens
- **Why:** 235 billion parameters at $0.30/M is insane value
- **Hypothesis:** Huge model may achieve 100% accuracy easily

#### 4. **deepseek/deepseek-v3.1-terminus** (STABLE V3.1)
- **Released:** 2025-09-22 (9 days ago)
- **Price:** $0.23/M (cheapest viable option)
- **Context:** 163,840 tokens
- **Why:** "Terminus" suggests stable production version of V3.1
- **Hypothesis:** More stable than "exp", may have better accuracy

#### 5. **alibaba/tongyi-deepresearch-30b-a3b** (BUDGET CHAMPION)
- **Released:** 2025-09-18 (13 days ago)
- **Price:** $0.09/M (dirt cheap!)
- **Context:** 131,072 tokens
- **Why:** Alibaba's newest, 78% cost savings vs current
- **Hypothesis:** If it hits 96%+, we save massive amounts

---

## Track 2: Re-Tune Codestral 2501 (Already Better Than Current)

### Why Codestral?

**Current Results:**
- Accuracy: 96% (vs 95.7% current Pass 2)
- Latency: 372ms (vs 3000ms current = 8x faster!)
- Cost: $0.30/M (vs $0.40/M current = 25% cheaper)

**Already better in ALL metrics. Just needs optimization.**

### Re-Tuning Approach

#### Step 1: Analyze Failures

Codestral's 2 errors (from previous testing):
1. **False Negative:** template_injection_jinja (`{{7*7}}`)
2. **False Positive:** business_policy ("bypass standard approval")

#### Step 2: Create Codestral-Optimized Prompt

**Current prompt may be Llama-specific.** Create new prompt addressing:
- Template injection detection (ensure it catches `{{ }}` patterns)
- Business language sensitivity (don't over-flag "bypass", "override")

**Prompt variants to test:**
- Variant A: More explicit template injection examples
- Variant B: Stronger business context awareness
- Variant C: Combined (A + B)

#### Step 3: Test Temperature/Token Variants

```javascript
const TEST_CONFIGS = [
  { temp: 0.0, maxTokens: 500 },  // Most deterministic
  { temp: 0.1, maxTokens: 500 },  // Current
  { temp: 0.05, maxTokens: 750 }, // More thinking room
  { temp: 0.0, maxTokens: 1000 }, // Maximum determinism + reasoning
];
```

#### Step 4: Target 98-100% Accuracy

**Success Criteria:**
- ≥98% accuracy (49/50 or 50/50)
- <500ms latency (maintain speed advantage)
- $0.30/M cost (keep cost savings)

**If successful:** Immediate candidate for production deployment

---

## Track 3: Effective Cost Analysis

### Metrics to Calculate

For each model, calculate:

**1. Token Cost**
```
Avg tokens per request: 700 (500 input + 200 output)
Cost per request = (price per M) × (700 / 1,000,000)
```

**2. Latency Cost**
```
Time cost = latency in seconds
```

**3. Error Cost**
```
Error penalty = (100 - accuracy) / 100
Example: 96% accuracy = 0.04 error rate
```

**4. Effective Cost Score**
```
Effective Cost = token_cost × latency_seconds × (1 + error_penalty × 10)

Why ×10 for errors?
- 1 error = 10x more expensive (retry cost, user friction, security risk)
- 4% error rate = 40% cost increase
```

**5. Cost Per 100K Validations**
```
Total cost = effective_cost × 100,000 requests
```

### Example Calculation

**Model A (Current Llama 70B):**
```
Token cost:   $0.40/M × (700/1M) = $0.00028
Latency:      3.0 seconds
Error rate:   4.3% (95.7% accuracy)
Effective:    $0.00028 × 3.0 × (1 + 0.043 × 10) = $0.001

...per 100K
Cost: $100 per 100K validations
```

**Model B (Hypothetical Fast Accurate):**
```
Token cost:   $0.60/M × (700/1M) = $0.00042
Latency:      0.3 seconds
Error rate:   0% (100% accuracy)
Effective:    $0.00042 × 0.3 × (1 + 0 × 10) = $0.000126

Cost per 100K: $12.60 per 100K validations
```

**Model B is 8x cheaper despite 50% higher token cost!**

---

## Testing Execution Plan

### Phase 1: Parallel Full Testing (Days 1-2)

**Track 1A:** Test GLM-4.6 (highest priority)
- Run full 50-test suite
- Record: accuracy, latency, error types
- Estimated time: 30 minutes

**Track 1B:** Test DeepSeek V3.2-exp
- Run full 50-test suite
- Compare to earlier DeepSeek results
- Estimated time: 30 minutes

**Track 1C:** Test Qwen3 VL 235B Thinking
- Run full 50-test suite
- Note if 235B params makes difference
- Estimated time: 30 minutes

**Track 1D:** Test DeepSeek V3.1 Terminus
- Run full 50-test suite
- Compare to V3.2-exp (stable vs experimental)
- Estimated time: 30 minutes

**Track 1E:** Test Alibaba Tongyi DeepResearch
- Run full 50-test suite
- Assess if budget option is viable
- Estimated time: 30 minutes

**Track 2:** Re-tune Codestral (parallel)
- Test 3 prompt variants × 4 temperature configs = 12 tests
- Each test = 50 prompts = 600 total tests
- Estimated time: 3-4 hours

**Total Phase 1 Time:** 5-6 hours (can run overnight)

### Phase 2: Analyze Results (Day 3)

**Compile:**
- Accuracy rankings
- Latency comparisons
- Effective cost calculations
- Error pattern analysis

**Identify:**
- Models achieving ≥96% accuracy
- Models achieving ≥98% accuracy (deployment-ready)
- Best effective cost performer
- Fastest model (if accuracy equal)

**Decision Matrix:**

| Accuracy | Latency | Cost | Action |
|----------|---------|------|--------|
| ≥98% | <1000ms | <$0.50/M | ✅ Deploy as primary |
| 96-97% | <500ms | <$0.40/M | ✅ Deploy as primary (better than current) |
| ≥96% | Any | Any | ✅ Add as fallback |
| <96% | Any | Any | ❌ Reject (worse than current) |

### Phase 3: Deploy Best Performer (Day 4)

**Option A: Clear Winner (≥98% accuracy)**
```bash
# Update production config
# Deploy to staging
# Run 24-hour monitoring
# Switch production traffic
```

**Option B: Multiple Viable Candidates (all 96-98%)**
```bash
# Deploy fastest as primary
# Deploy runners-up as fallbacks (multi-provider strategy)
# Implement intelligent routing
```

**Option C: No Clear Winner (all <96%)**
```bash
# Keep current system
# Implement retry logic
# Continue research for better models
```

---

## Success Criteria

### Minimum Viable Outcome

**At least ONE model must achieve:**
- ✅ ≥96% accuracy (match or beat current 95.7%)
- ✅ <3000ms latency (beat current)
- ✅ ≤$1.00/M cost (within budget)

**If achieved:** We have a better Pass 2 than current production

### Stretch Goal

**Find ONE model that achieves:**
- ✅ ≥98% accuracy
- ✅ <500ms latency
- ✅ ≤$0.60/M cost

**If achieved:** Major upgrade, deploy immediately

### Dream Outcome

**Find ONE model that achieves:**
- ✅ 100% accuracy
- ✅ <500ms latency
- ✅ <$0.50/M cost

**If achieved:** Perfect Pass 2, better than we ever hoped

---

## Risk Mitigation

### Risk 1: All Models Fail to Reach 96%

**Mitigation:**
- Codestral already at 96%, re-tuning should push higher
- Can accept 96% as "production-ready" (better than current 95.7%)
- Fall back to multi-provider Llama strategy

### Risk 2: Models Are Fast But Inaccurate

**Mitigation:**
- Effective cost calculation accounts for this
- Speed without accuracy is worthless for security
- Stick with accuracy-first approach

### Risk 3: Newest Models Are Unstable

**Mitigation:**
- Test both "exp" and stable versions (DeepSeek)
- GLM-4.6 released yesterday, may have bugs
- Can fall back to slightly older models (GLM-4.5, DeepSeek V3.1)

### Risk 4: Re-Tuning Codestral Doesn't Work

**Mitigation:**
- Codestral at 96% is already viable
- Even without improvement, it's better than current
- Re-tuning is bonus, not required

---

## Deliverables

### Code Artifacts

1. `test-newest-chinese-models.js` - Full test suite for 5 newest models
2. `retune-codestral-2501.js` - Multi-variant testing for Codestral
3. `calculate-effective-cost.js` - Cost analysis for all models
4. `TESTING_RESULTS_SUMMARY.md` - Complete results and recommendations

### Data Files

1. `newest-models-test-results.json` - Raw test data (5 models × 50 tests)
2. `codestral-retuning-results.json` - Retuning data (12 configs × 50 tests)
3. `effective-cost-analysis.json` - Cost metrics for all models
4. `deployment-recommendation.json` - Final production decision

### Decision Document

**DEPLOYMENT_DECISION.md:**
- Winner model(s) identified
- Accuracy, latency, cost comparison
- Deployment timeline
- Rollback plan
- Monitoring requirements

---

## Timeline

**Day 1 (Today):**
- ✅ Discovery complete (newest models identified)
- ⏳ Create test scripts
- ⏳ Start parallel testing (overnight run)

**Day 2:**
- ⏳ Complete parallel testing
- ⏳ Compile results
- ⏳ Calculate effective costs

**Day 3:**
- ⏳ Analyze results
- ⏳ Make deployment decision
- ⏳ Prepare production config

**Day 4:**
- ⏳ Deploy to staging
- ⏳ Monitor 24 hours
- ⏳ Switch production traffic

**Total: 4 days from discovery to production**

---

## The Meta-Question

**Why did we almost miss this?**

1. **Training cutoff blindness:** My Jan 2025 cutoff missed Sept 2025 models
2. **No release date sorting:** Never checked actual `created` timestamps
3. **Assumption cascade:** Assumed current = perfect, stopped looking
4. **User caught it:** "Why GLM-4.5 not 4.6?" exposed the gap

**Lesson:** Always validate assumptions with fresh data, even when confident.

---

**Status:** Ready to execute
**Approval:** Awaiting user confirmation to proceed with Option C (Parallel Testing)
**ETA:** 3-4 days to production-ready recommendation
