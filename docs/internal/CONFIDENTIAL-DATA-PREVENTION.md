# CONFIDENTIAL DATA PREVENTION CHECKLIST

## 🚨 NEVER EXPOSE TO PUBLIC (github.com/ianreboot/safeprompt)

### Financial/Business Confidential
- ❌ **Internal costs** - $0.50 per 100K, model costs, operational expenses
- ❌ **Profit margins** - Cost vs. pricing analysis, markup percentages
- ❌ **Beta pricing** - $5/mo special pricing, first 50 users deals
- ❌ **Revenue projections** - Monthly recurring revenue, growth targets
- ❌ **Pricing strategy** - Why $29/mo, competitive analysis with costs

### Technical Implementation Details
- ❌ **Model configurations** - Exact models used, fallback order, cost optimization
- ❌ **Validation logic** - ai-validator-hardened.js, 2-pass system internals
- ❌ **External reference detector** - Detection algorithms, pattern matching rules
- ❌ **Zero-cost optimization** - Which patterns catch what % of requests
- ❌ **Pass 1/Pass 2 distribution** - Actual percentages going to each stage
- ❌ **Error rates** - Internal accuracy metrics, false positive rates

### Infrastructure & Operations
- ❌ **Internal test accounts** - sp_test_unlimited_dogfood_key_2025
- ❌ **Database schemas** - RLS policies, internal user handling
- ❌ **API keys** - Any hardcoded keys, internal service keys
- ❌ **Deployment configs** - Internal URLs, staging environments
- ❌ **Monitoring metrics** - Actual usage numbers, customer counts

### Business Strategy
- ❌ **Market research** - Demographics research, persona details
- ❌ **Social outreach strategy** - Product Hunt plans, launch tactics
- ❌ **Competitive intelligence** - Internal analysis of Lakera, competitors
- ❌ **Growth experiments** - A/B testing plans, conversion tactics
- ❌ **Email addresses** - Internal team emails, support addresses

## ✅ SAFE TO EXPOSE PUBLICLY

### Product Information
- ✅ **Public pricing** - $29/mo standard pricing (never beta pricing)
- ✅ **Feature list** - 2-pass validation, external reference detection
- ✅ **Performance claims** - 92.9% accuracy, 250ms response time
- ✅ **Use cases** - Indie developers, startups, AI chatbots
- ✅ **Integration examples** - Code samples, SDK usage

### Technical Overview
- ✅ **High-level architecture** - Pattern matching → AI validation
- ✅ **Public API endpoints** - /v1/validate endpoint structure
- ✅ **Response format** - JSON structure, error codes
- ✅ **SDK capabilities** - What methods are available
- ✅ **General concepts** - Prompt injection, external references

### Marketing & Support
- ✅ **Public URLs** - safeprompt.dev, dashboard.safeprompt.dev
- ✅ **Support email** - support@safeprompt.dev
- ✅ **GitHub repo** - github.com/ianreboot/safeprompt (public SDK only)
- ✅ **Documentation** - Quickstart guides, API reference
- ✅ **Product screenshots** - Playground, dashboard UI

## 📋 PRE-PUBLICATION CHECKLIST

Before creating ANY public content (GitHub, website, social media):

### 1. Search for Sensitive Keywords
```bash
# Run these searches on your content:
grep -i "internal\|secret\|confidential" file.md
grep -E "\$[0-9]+\.[0-9]+" file.md  # Specific costs
grep -i "beta pricing\|first 50\|locked in" file.md
grep -i "sp_test_\|dogfood" file.md  # Internal keys
grep -E "pass [12].*%|zero-cost.*%" file.md  # Distribution metrics
```

### 2. Pricing Rule Check
- ✅ Only mention $29/month (standard public pricing)
- ❌ NEVER mention $5/mo, beta pricing, or special deals
- ❌ NEVER mention internal costs ($0.50/100K, model pricing)
- ❌ NEVER compare cost to revenue (margins)

### 3. Technical Detail Check
- ✅ Explain WHAT it does (external reference detection)
- ❌ Don't explain HOW it works internally (regex patterns, model routing)
- ✅ High-level architecture (2-pass system)
- ❌ Specific model names and costs (Llama 8B @ $0.02/M)

### 4. Performance Metrics Check
- ✅ Public-facing stats (92.9% accuracy, 250ms)
- ❌ Internal optimizations (67% zero-cost, Pass 2 usage %)
- ❌ Cost breakdown (cost per stage, total effective cost)

## 🛡️ RECOVERY PROCEDURE

If confidential data is accidentally exposed:

### Immediate Actions
1. **Don't panic** - Git history can be rewritten
2. **Document exposure** - What was exposed, when, where
3. **Assess impact** - Public repo? How long was it live?

### For GitHub Repositories
```bash
# If just committed (not pushed)
git reset --soft HEAD~1  # Undo commit, keep changes
# Edit files to remove sensitive data
git add -A
git commit -m "Fixed message"

# If already pushed (use with caution!)
# Edit files to remove sensitive data
git add -A
git commit --amend --no-edit
git push --force origin main
```

### For Other Platforms
- **Twitter/X**: Delete tweet immediately, repost corrected version
- **Product Hunt**: Edit post (if still in draft), or comment correction
- **Website**: Deploy fix immediately, clear CDN cache

## 📝 SAFE CONTENT TEMPLATES

### Public README Example
```markdown
# SafePrompt

API-first prompt injection protection.

**Features:**
- 92.9% accuracy
- 250ms average response time
- $29/month pricing
- 2-pass validation system
- External reference detection

**Pricing:** $29/month
```

### Internal README Example (private repo only)
```markdown
# SafePrompt Internal

**Cost Structure:**
- Internal cost: $0.50 per 100K requests
- Public pricing: $29/month
- Target margin: 98%+ (50K requests/month break-even)

**Technical Details:**
- Pass 1: Gemini 2.0 ($0/M) → Llama 8B ($0.02/M)
- Pass 2: Gemini 2.5 ($0.30/M) → Llama 70B ($0.05/M)
- Zero-cost patterns: 67% of requests
```

## 🤖 FOR FUTURE AI ASSISTANTS

When creating public-facing content:

1. **Read this file first** before writing anything for public repos
2. **Check CLAUDE.md** for current pricing guidelines
3. **When in doubt, ask the user** if specific data is safe to expose
4. **Default to private** - Only expose what's explicitly approved
5. **Search before commit** - Run the grep commands above

**Remember:** Internal docs (this repo) can have everything.
Public docs (github.com/ianreboot/safeprompt) should be marketing-focused only.

---

**Last updated:** 2025-10-02
**Violations to date:** 1 (cost exposure in public README - fixed via force push)
