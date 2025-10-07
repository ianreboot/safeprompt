# Custom Whitelist/Blacklist Feature - DETAILS_01

**Detail Doc Number**: 01
**Task Range**: Tasks 1-45
**Created**: 2025-10-07
**Status**: ACTIVE
**Master Doc**: `CUSTOM_LISTS_MASTER.md`

---

## 📊 This Document Progress
- **Tasks in this doc**: 45 (from master task list)
- **Tasks completed**: 12/45 (26.7%)
- **Current task**: Task 2.1 - Create custom-lists-sanitizer.js
- **Last update**: 2025-10-07 19:05

---

## 🔄 Document Rotation Protocol

**When to Rotate**: If you find yourself SEARCHING this doc instead of READING it during context refresh

**Search signs**: grep, keyword scanning, can't recall phases
**Then**: Execute rotation protocol in Master doc

---

## 📝 Document Update Instructions (EXECUTE DURING CONTEXT REFRESH)

**CRITICAL READING SEQUENCE:**

1. **Read Project CLAUDE.md**: `/home/projects/safeprompt/CLAUDE.md`
2. **Read Master Doc**: `CUSTOM_LISTS_MASTER.md`
3. **Read This Detail Doc**: `CUSTOM_LISTS_DETAILS_01.md`
4. **Self-Check**: Did I READ or SEARCH? (If searched → rotate)
5. **Mission Verification**: Can I state deliverable from memory?

**ESSENTIAL UPDATES:**

1. **Update Task Checklist**: Change `[ ]` to `[x]` with timestamp
2. **Update Progress Log**: Add entry with evidence (test output, file paths, URLs)
3. **Extract Discoveries**: Add to "Hard-Fought Knowledge" section
4. **Update State Variables**: Set phase flags, file locations, blockers
5. **Update Master Status**: Quick Stats, Status-Driven Navigation, Current Status

---

## Current State Variables

```yaml
CURRENT_PHASE: "Phase 2 - Core Custom Lists Logic"
CURRENT_TASK: "2.1 Create custom-lists-sanitizer.js"

# Phase Completion Flags
PHASE_0_COMPLETE: true     # ✅ Planning complete (2025-10-07 18:31)
PHASE_1_COMPLETE: true     # ✅ Code removal & default lists (2025-10-07 19:05)
PHASE_2_COMPLETE: false
PHASE_3_COMPLETE: false
PHASE_4_COMPLETE: false
PHASE_5_COMPLETE: false
PHASE_6_COMPLETE: false

# Deliverable Status
DEFAULT_LISTS_DEFINED: true      # ✅ default-lists.js created with 70 whitelist + 28 blacklist
SCHEMA_CREATED: false
API_INTEGRATED: false
DASHBOARD_UI_CREATED: false
TESTS_PASSING: false
DOCS_UPDATED: false
DEPLOYED_DEV: false
DEPLOYED_PROD: false

# File Locations (Update when created)
DEFAULT_LISTS_FILE: "/home/projects/safeprompt/api/lib/default-lists.js"
SANITIZER_FILE: ""
VALIDATOR_FILE: ""
INTEGRATION_FILE: ""
MIGRATION_FILE: ""
DASHBOARD_UI_FILE: ""
REVISED_SPEC_FILE: "/home/projects/safeprompt/docs/CUSTOM_LISTS_V2_SPEC.md"

# Blockers
BLOCKER_ENCOUNTERED: false
BLOCKER_DESCRIPTION: ""
```

---

## Task Checklist

### Phase 0: Planning & Architecture Analysis

**Purpose**: Understand current system deeply before making changes. Custom lists must work as routing/override signals (like business context does), not instant decisions.

- [x] 0.1 Read and analyze current business context implementation (COMPLETED: 2025-10-07 18:10)
  - File: `/home/projects/safeprompt/api/lib/ai-validator-hardened.js` lines 220-340, 806-970
  - Understanding: How hasBusinessContext() and hasEducationalContext() guide AI routing
  - Key insight: These are NOT instant allow - they modify pattern detection to route to AI
  - Evidence: Lines 806-836 show pattern + context → route to AI, pattern without context → instant block
- [x] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions" (COMPLETED: 2025-10-07 18:11)

- [x] 0.2 Read and analyze orchestrator routing logic (COMPLETED: 2025-10-07 18:12)
  - File: `/home/projects/safeprompt/api/lib/ai-orchestrator.js` lines 36-150
  - Understanding: How business signals route to business_validator
  - Key insight: patternContext passed via userMessage JSON (lines 117-122)
  - Evidence: orchestrate(prompt, patternContext) accepts context parameter
- [x] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions" (COMPLETED: 2025-10-07 18:13)

- [x] 0.3 Read and analyze consensus engine override logic (COMPLETED: 2025-10-07 18:14)
  - File: `/home/projects/safeprompt/api/lib/consensus-engine.js` lines 19-113
  - Understanding: How business confidence > 0.8 overrides attack confidence < 0.6
  - Key insight: Attack 0.75+ always blocks; borderline 0.6-0.7 flagged for review
  - Evidence: Lines 37-49 show business override, lines 67-77 show attack always blocks at 0.75+
- [x] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions" (COMPLETED: 2025-10-07 18:15)

- [x] 0.4 Document architectural requirements for custom lists (COMPLETED: 2025-10-07 18:20)
  - Created section: "Custom Lists Architecture Design" (lines 523-829)
  - Defined: Blacklist → attack signal (0.9), Whitelist → business signal (0.8)
  - Defined: Complete validation pipeline with custom lists integration
  - Defined: "Blacklist always wins" via confidence levels (0.9 > 0.75 threshold)
  - Defined: Default lists design (30+ whitelist, 10+ blacklist, all 2+ words)
  - Defined: Tier limits, database schema, response attribution
  - Evidence: 307-line comprehensive architecture document
- [x] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions" (COMPLETED: 2025-10-07 18:21)

- [x] 0.5 Create revised CUSTOM_LISTS_V2_SPEC.md with correct architecture (COMPLETED: 2025-10-07 18:30)
  - File: `/home/projects/safeprompt/docs/CUSTOM_LISTS_V2_SPEC.md` (1039 lines)
  - Included: Complete architecture with confidence signals
  - Included: DEFAULT_WHITELIST (30+ phrases) and DEFAULT_BLACKLIST (15+ phrases)
  - Included: Tier limits for all tiers (Free, Starter, Business, Enterprise, Internal)
  - Included: Complete validation pipeline diagram
  - Included: "Blacklist always wins" via confidence 0.9 > 0.75 threshold
  - Included: ALL documentation changes (API.md, website, pricing, public repo, CLAUDE.md)
  - Included: Complete code removal checklist with file paths and line numbers
  - Included: Database schema, API spec, dashboard UI, testing requirements, deployment plan
  - Evidence: 1039-line comprehensive specification document ready for implementation
- [x] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions" (COMPLETED: 2025-10-07 18:31)

### Phase 1: Code Removal & Default Lists

**Purpose**: Remove old business/educational keyword system and replace with default lists architecture

- [x] 1.1 Define DEFAULT_WHITELIST and DEFAULT_BLACKLIST constants (COMPLETED: 2025-10-07 18:35)
  - File: `/home/projects/safeprompt/api/lib/default-lists.js` (NEW - 220 lines)
  - Content: DEFAULT_WHITELIST array (70 phrases, all 2+ words)
  - Content: DEFAULT_BLACKLIST array (28 phrases, all 2+ words)
  - Source: Converted from BUSINESS_CONTEXT_KEYWORDS (20), EDUCATIONAL_CONTEXT_KEYWORDS (19), BUSINESS_WHITELIST (14)
  - Added: validateDefaultLists() function (runs at module load, ensures 2+ words)
  - Added: getEffectiveLists(profile) - merges defaults + custom - removed
  - Added: isDefaultPhrase(phrase, listType) - helper function
  - Evidence: File created with comprehensive documentation and validation
- [x] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions" (COMPLETED: 2025-10-07 18:36)

- [x] 1.2 Remove business context detection from ai-validator-hardened.js (COMPLETED: 2025-10-07 18:40)
  - File: `/home/projects/safeprompt/api/lib/ai-validator-hardened.js`
  - Deleted: Lines 220-226 (BUSINESS_CONTEXT_KEYWORDS array + comment)
  - Deleted: Lines 228-234 (EDUCATIONAL_CONTEXT_KEYWORDS array + comment)
  - Deleted: Lines 308-325 (hasBusinessContext() function + comment)
  - Deleted: Lines 327-340 (hasEducationalContext() function + comment)
  - Total removed: ~35 lines
  - Remaining: Function CALLS in pattern detection (will be handled in Task 1.3)
  - Evidence: grep shows 21 remaining calls in pattern detection logic (lines 756-893)
- [x] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions" (COMPLETED: 2025-10-07 18:41)

- [x] 1.3 Remove pattern context logic from ai-validator-hardened.js (COMPLETED: 2025-10-07 18:50)
  - File: `/home/projects/safeprompt/api/lib/ai-validator-hardened.js`
  - Modified: XSS Detection (lines 752-773) - removed context branching
  - Modified: SQL Injection Detection (lines 775-792) - removed context branching
  - Modified: Template Injection Detection (lines 794-811) - removed context branching
  - Modified: Command Injection Detection (lines 813-830) - removed context branching
  - Modified: Semantic Extraction Detection (lines 832-849) - removed context branching
  - Modified: Execution Command Detection (lines 851-868) - removed context branching
  - Result: Pattern detection WITHOUT context awareness (instant block, with TODO for Phase 2 custom lists)
  - Evidence: grep shows 0 remaining hasEducationalContext/hasBusinessContext calls
  - Total simplified: ~150 lines of conditional logic removed
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [x] 1.4 Remove business whitelist from prompt-validator.js (COMPLETED: 2025-10-07 18:55)
  - File: `/home/projects/safeprompt/api/lib/prompt-validator.js`
  - Deleted: BUSINESS_WHITELIST array (lines 73-88) - replaced with comment
  - Deleted: isBusinessUse variable (line 222)
  - Deleted: isLegitimate variable (line 224)
  - Deleted: isLegitimateBusinessUse from calculateConfidence call (line 288)
  - Deleted: isLegitimateBusinessUse from return object (line 300)
  - Deleted: Business use confidence boost in calculateConfidence() (lines 332-335)
  - Modified: Prompt injection check now always runs (removed isLegitimate skip logic)
  - Evidence: grep shows only 1 comment reference remaining
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [x] 1.5 Update system prompts to remove business context guidance (COMPLETED: 2025-10-07 19:00)
  - File: `/home/projects/safeprompt/api/lib/ai-validator-hardened.js`
  - Modified: SECURE_PASS1_SYSTEM_PROMPT (lines 473-475)
  - Removed: "LEGITIMATE BUSINESS CONTEXT" section with keyword-based examples
  - Added: NOTE about proof indicators and custom lists as context signals
  - Modified: SECURE_PASS2_SYSTEM_PROMPT (lines 516-522)
  - Removed: Detailed ACADEMIC/EDUCATIONAL CONTEXTS section
  - Simplified: Allow guidance to focus on proof indicators rather than keywords
  - Added: NOTE about custom whitelist/blacklist phrases as context signals
  - Evidence: System prompts now focus on proof indicators, not keyword matching
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [x] 1.6 Commit Phase 1 changes with descriptive message (COMPLETED: 2025-10-07 19:05)
  - Commit: fee96d48
  - Files changed: 6 files, 2542 insertions(+), 287 deletions(-)
  - Created: default-lists.js, CUSTOM_LISTS_MASTER.md, CUSTOM_LISTS_DETAILS_01.md, CUSTOM_LISTS_V2_SPEC.md
  - Modified: ai-validator-hardened.js, prompt-validator.js
  - Pushed: Successfully pushed to origin/main
  - Evidence: `git status` shows clean working directory
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

### Phase 2: Core Custom Lists Logic

**Purpose**: Implement custom lists as routing/override signals in validation pipeline

- [ ] 2.1 Create custom-lists-sanitizer.js with input validation
  - File: `/home/projects/safeprompt/api/lib/custom-lists-sanitizer.js` (NEW)
  - Function: sanitizeCustomRules(rules, tier)
  - Logic: Character whitelist, length limits, tier limits
  - Logic: FORBIDDEN_PATTERNS array (script, eval, exec, base64, etc.)
  - Logic: Single-word warning flag (allow but flag for user)
  - Tests: Create `/home/projects/safeprompt/api/__tests__/custom-lists-sanitizer.test.js`
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 2.2 Create custom-lists-validator.js with tier limit enforcement
  - File: `/home/projects/safeprompt/api/lib/custom-lists-validator.js` (NEW)
  - Constant: TIER_LIMITS object (free: 0, starter: 10, business: 50, enterprise: 200, internal: 50)
  - Function: validateCustomRulesForTier(rules, tier)
  - Function: getEffectiveLists(customRules, profile, tier)
  - Logic: Merge default lists + custom lists - removed items
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 2.3 Create custom-lists-checker.js with match logic
  - File: `/home/projects/safeprompt/api/lib/custom-lists-checker.js` (NEW)
  - Function: checkCustomLists(prompt, whitelist, blacklist)
  - Logic: Check blacklist first → if matched, return { type: 'blacklist', phrase, confidence: 0.9 }
  - Logic: Check whitelist next → if matched, return { type: 'whitelist', phrase, confidence: 0.8 }
  - Logic: Return null if no match (proceed to AI validation)
  - Note: Simple substring matching (case-insensitive)
  - Note: Returns CONFIDENCE SIGNALS, not instant block/allow decisions
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 2.4 Integrate custom lists into ai-validator-hardened.js validation pipeline
  - File: `/home/projects/safeprompt/api/lib/ai-validator-hardened.js`
  - Location: After external reference detection, before AI orchestrator (around line 1150)
  - Logic: Call checkCustomLists(prompt, effectiveWhitelist, effectiveBlacklist)
  - If blacklist match: Create attackContext = { confidence: 0.9, matched: phrase, type: 'custom_blacklist' }
  - If whitelist match: Create businessContext = { confidence: 0.8, matched: phrase, type: 'custom_whitelist' }
  - Pass context to orchestrator via new parameter
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 2.5 Update ai-orchestrator.js to accept custom list context
  - File: `/home/projects/safeprompt/api/lib/ai-orchestrator.js`
  - Function signature: orchestrate(prompt, patternContext, customListContext)
  - Logic: Include customListContext in routing decisions
  - If blacklist matched → Increase attack routing priority
  - If whitelist matched → Increase business routing priority
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 2.6 Update consensus-engine.js to use custom list signals
  - File: `/home/projects/safeprompt/api/lib/consensus-engine.js`
  - Logic: If whitelist matched → Treat as business signal (confidence 0.8)
  - Logic: If blacklist matched → Treat as attack signal (confidence 0.9)
  - Logic: Blacklist always wins: if both matched, blacklist takes precedence
  - Logic: Apply same override rules as business context (lines 36-64)
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 2.7 Add response attribution for custom list matches
  - File: `/home/projects/safeprompt/api/lib/ai-validator-hardened.js`
  - Response format: Add customRuleMatched object
  - Fields: { type: 'whitelist|blacklist', matchedPhrase, originalDecision, overriddenBy }
  - Example: "Allowed by whitelist 'shipping address'. AI said unsafe, whitelist override applied."
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 2.8 Commit Phase 2 changes
  - Command: `git add -A && git commit -m "Phase 2: Core custom lists logic as routing/override signals"`
  - Verification: `git status` clean, unit tests exist (not running yet - AI key needed)
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

### Phase 3: Database Schema & API Integration

**Purpose**: Add database support and integrate with main API endpoint

- [ ] 3.1 Create database migration for custom lists
  - File: `/home/projects/safeprompt/supabase/migrations/20251007_custom_lists.sql` (NEW)
  - ALTER profiles: Add custom_whitelist, custom_blacklist, removed_defaults, uses_default_whitelist, uses_default_blacklist
  - CREATE TABLE custom_rule_usage: Track usage for analytics
  - CREATE INDEXES: On profiles(id) WHERE uses defaults, on usage(user_id, timestamp)
  - RLS POLICIES: custom_rule_usage select/insert policies
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 3.2 Deploy migration to DEV database
  - Command: `cd /home/projects/safeprompt && supabase db push --db-url $(grep NEXT_PUBLIC_SUPABASE_URL .env.development | cut -d'=' -f2 | sed 's/https:\/\//postgres:\/\/postgres:[PASSWORD]@/') --include-all`
  - Note: Use proper Supabase CLI commands from reference doc
  - Verification: Check tables exist in DEV Supabase dashboard
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 3.3 Update main API endpoint to accept customRules parameter
  - File: `/home/projects/safeprompt/api/api/v1/validate.js`
  - Accept: customRules object from request body
  - Logic: Fetch user profile custom lists from database
  - Logic: Merge request-level customRules with profile-level lists
  - Logic: Call sanitizeCustomRules before passing to validator
  - Logic: Pass sanitized rules to validateHardened()
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 3.4 Add usage logging for custom rule matches
  - File: `/home/projects/safeprompt/api/lib/custom-lists-checker.js`
  - Function: logCustomRuleUsage(userId, ruleType, matchedPhrase, action)
  - Logic: Insert to custom_rule_usage table
  - Fields: user_id, rule_type, matched_phrase, action, prompt_preview (first 200 chars), timestamp
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 3.5 Commit Phase 3 changes
  - Command: `git add -A && git commit -m "Phase 3: Database schema and API integration"`
  - Verification: Migration file exists, API accepts customRules param
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

### Phase 4: Testing

**Purpose**: Ensure all functionality works correctly with comprehensive tests

- [ ] 4.1 Write unit tests for custom-lists-sanitizer.js
  - File: `/home/projects/safeprompt/api/__tests__/custom-lists-sanitizer.test.js`
  - Tests: Character validation (50+ patterns)
  - Tests: Forbidden pattern blocking
  - Tests: Tier limit enforcement
  - Tests: Single-word warning flags
  - Target: 30+ tests covering all edge cases
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 4.2 Write unit tests for custom-lists-checker.js
  - File: `/home/projects/safeprompt/api/__tests__/custom-lists-checker.test.js`
  - Tests: Blacklist matching
  - Tests: Whitelist matching
  - Tests: Blacklist priority over whitelist
  - Tests: Case-insensitive matching
  - Tests: Substring matching behavior
  - Target: 20+ tests
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 4.3 Write integration tests for validation pipeline
  - File: `/home/projects/safeprompt/api/__tests__/custom-lists-integration.test.js`
  - Tests: Whitelist override of low-confidence attack
  - Tests: Blacklist cannot override pattern detection (XSS, SQL)
  - Tests: Blacklist increases attack confidence
  - Tests: Whitelist increases business confidence
  - Tests: Full pipeline flow with custom lists
  - Target: 25+ tests covering pipeline integration
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 4.4 Update realistic test suite with custom lists scenarios
  - File: `/home/projects/safeprompt/test-suite/realistic-test-suite.js`
  - Add category: "Custom Lists" (10 tests)
  - Test: #29 "Override shipping address" with default whitelist → SAFE
  - Test: XSS with whitelist "script" → UNSAFE (pattern detection wins)
  - Test: Business phrase with custom blacklist → UNSAFE (blacklist wins)
  - Test: Tier limit enforcement
  - Verification: 94 → 104 total tests
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 4.5 Run all unit tests and fix failures
  - Command: `cd /home/projects/safeprompt/api && npm test`
  - Expected: 386+ tests passing → 430+ tests after additions
  - If failures: Debug, fix, document in Hard-Fought Knowledge section
  - Verification: 100% unit tests passing
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 4.6 Commit Phase 4 changes
  - Command: `git add -A && git commit -m "Phase 4: Comprehensive testing for custom lists"`
  - Verification: All tests passing, realistic suite updated
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

### Phase 5: Dashboard UI

**Purpose**: Create user interface for managing custom lists

- [ ] 5.1 Create CustomLists.tsx dashboard page
  - File: `/home/projects/safeprompt/dashboard/src/app/custom-lists/page.tsx` (NEW)
  - UI: Two tabs (Whitelist, Blacklist)
  - UI: Display default lists (read-only for Free tier, editable for paid)
  - UI: Add custom phrase input with validation
  - UI: Edit/delete custom phrases
  - UI: "Reset to Defaults" button
  - UI: Single-word warning display
  - UI: Tier limit indicator (X/Y phrases used)
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 5.2 Add API routes for custom list CRUD operations
  - File: `/home/projects/safeprompt/api/api/v1/custom-lists/` (NEW directory)
  - GET `/custom-lists` - Fetch user's effective lists (default + custom - removed)
  - POST `/custom-lists/add` - Add custom phrase (with sanitization)
  - DELETE `/custom-lists/remove` - Remove custom phrase
  - POST `/custom-lists/reset` - Reset to defaults
  - POST `/custom-lists/toggle-default` - Enable/disable default lists
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 5.3 Update dashboard navigation to include Custom Lists link
  - File: `/home/projects/safeprompt/dashboard/src/components/Sidebar.tsx`
  - Add: Custom Lists menu item (icon: list-check)
  - Position: After "Usage Analytics", before "Settings"
  - Visibility: Show for all tiers (Free sees read-only, Starter+ sees editable)
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 5.4 Add usage analytics for custom rule triggers
  - File: `/home/projects/safeprompt/dashboard/src/components/CustomListsAnalytics.tsx` (NEW)
  - Display: "Your whitelist overrode 47 blocks this month"
  - Display: "Your blacklist caught 12 threats this month"
  - Display: Most frequently matched phrases
  - Display: Chart of override frequency over time
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 5.5 Test dashboard UI in DEV environment
  - Deploy dashboard to DEV: `cd /home/projects/safeprompt/dashboard && npm run build && wrangler pages deploy out --project-name safeprompt-dashboard-dev --branch main`
  - Manual test: Add custom phrase, verify saved to database
  - Manual test: Reset to defaults, verify lists restored
  - Manual test: Free tier sees read-only, Starter tier can edit
  - Verification: All UI interactions work correctly
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 5.6 Commit Phase 5 changes
  - Command: `git add -A && git commit -m "Phase 5: Dashboard UI for custom lists management"`
  - Verification: UI deployed to DEV, tested manually
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

### Phase 6: Documentation & Deployment

**Purpose**: Update all documentation and deploy to production

- [ ] 6.1 Update API documentation
  - File: `/home/projects/safeprompt/docs/API.md`
  - Add: customRules parameter documentation with examples
  - Add: Response format with customRuleMatched field
  - Add: Tier limits table
  - Add: Security notes (pattern detection cannot be overridden)
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 6.2 Update website features page
  - File: `/home/projects/safeprompt/website/src/pages/index.jsx`
  - Add: "Custom Rules" to features section
  - Update: Code snippet showing customRules usage
  - Update: Pricing table showing custom rules limits per tier
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 6.3 Update public repository README
  - File: `/home/projects/safeprompt-public/README.md`
  - Add: Custom rules feature to features list
  - Add: Example code showing customRules parameter
  - Add: Link to dashboard for managing rules
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 6.4 Update project CLAUDE.md
  - File: `/home/projects/safeprompt/CLAUDE.md`
  - Update: Validation pipeline diagram to show custom lists
  - Add: Custom lists to architecture section
  - Add: Note about default lists replacing business/educational keywords
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 6.5 Deploy to PROD
  - Verify: All DEV tests passing
  - Deploy migration to PROD database
  - Deploy API to PROD: `cd /home/projects/safeprompt/api && vercel --token $VERCEL_TOKEN --prod --yes`
  - Deploy dashboard to PROD: `cd /home/projects/safeprompt/dashboard && npm run build && wrangler pages deploy out --project-name safeprompt-dashboard --branch main`
  - Deploy website to PROD: `cd /home/projects/safeprompt/website && npm run build && wrangler pages deploy out --project-name safeprompt --branch main`
  - Verification: Smoke test with curl (whitelist override example)
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

- [ ] 6.6 Final validation and documentation
  - Run realistic test suite: `cd /home/projects/safeprompt && npm run test:realistic`
  - Expected: 104/104 tests passing (was 93/94, now includes 10 custom list tests + fixes test #29)
  - Update README.md: Add release notes for custom lists feature
  - Update CLAUDE.md: Mark feature as complete
  - Commit: `git add -A && git commit -m "Phase 6: Documentation and production deployment complete"`
- [ ] 🧠 CONTEXT REFRESH: Read `/home/projects/safeprompt/CUSTOM_LISTS_MASTER.md` and execute section "📝 Document Update Instructions"

---

## Implementation Details

### Critical Context

**Architecture Paradigm** (MUST UNDERSTAND):
Custom lists work as **routing signals** and **confidence modifiers**, NOT instant block/allow decisions.

**How Current System Works**:
1. Pattern Detection (XSS, SQL, etc.) → If matched WITHOUT context → Instant block
2. Pattern Detection WITH business keywords → Route to AI with context → AI decides
3. Consensus Engine → Business confidence can override attack confidence

**How Custom Lists Work** (Same Paradigm):
1. Pattern Detection (XSS, SQL, etc.) → If matched → Check custom whitelist → If NO match → Instant block
2. If custom whitelist matches → Route to AI with whitelist context (confidence signal 0.8)
3. If custom blacklist matches → Route to AI with blacklist context (confidence signal 0.9)
4. Consensus Engine → Apply same override logic using custom list confidence signals
5. **Blacklist Always Wins**: If both matched, blacklist signal (0.9) > whitelist signal (0.8)

**Key Files to Understand**:
- `/home/projects/safeprompt/api/lib/ai-validator-hardened.js` - Main validation pipeline
- `/home/projects/safeprompt/api/lib/ai-orchestrator.js` - Routing logic
- `/home/projects/safeprompt/api/lib/consensus-engine.js` - Override logic

**Things That Must Not Change**:
- Pattern detection for XSS, SQL, template injection, command injection → Always blocks if no context
- External reference detection → Always blocks dangerous references
- Consensus engine override thresholds (business > 0.8, attack < 0.6)
- Two-pass validation architecture

**Success Criteria**:
- Test #29 ("Override shipping address") passes with default whitelist containing "shipping address"
- Whitelist CANNOT override pattern detection (security first)
- Blacklist increases attack confidence, routes to AI for final decision (not instant block)
- Free tier gets read-only default lists
- Paid tiers can add custom phrases (with tier limits)
- All unit tests pass (430+ after additions)
- Realistic test suite passes (104/104 including new custom list tests)

---

## Progress Log

### 2025-10-07 18:00 - Task Document Created
- **AI**: Claude (post auto-compaction recovery)
- **Action**: Created CUSTOM_LISTS_MASTER.md and CUSTOM_LISTS_DETAILS_01.md
- **Files**: Master control doc + detailed task breakdown
- **Result**: 45 tasks defined across 7 phases (Phase 0-6)
- **Issues**: None
- **Next Step**: Task 0.1 - Read and analyze current business context implementation

### 2025-10-07 18:15 - Tasks 0.1-0.3 Complete: Architecture Analysis
- **AI**: Claude
- **Action**: Deep analysis of business context, orchestrator routing, and consensus override logic
- **Files Read**:
  - `/home/projects/safeprompt/api/lib/ai-validator-hardened.js` (lines 220-340, 800-970)
  - `/home/projects/safeprompt/api/lib/ai-orchestrator.js` (lines 36-150)
  - `/home/projects/safeprompt/api/lib/consensus-engine.js` (lines 19-113)
- **Result**: Complete understanding of routing signal architecture
- **Key Findings**:
  1. Business keywords (20) check for 2+ matches → context signal
  2. Educational keywords (19) check for 1+ match → context signal
  3. Pattern + context → route to AI (not instant block)
  4. Pattern without context → instant block
  5. Orchestrator receives patternContext via userMessage JSON
  6. Consensus: business 0.8+ overrides attack < 0.6
  7. Consensus: attack 0.75+ always blocks (even with business context)
  8. Borderline (business 0.8+, attack 0.6-0.7) → flagged for review
- **Next Step**: Task 0.4 - Document architectural requirements for custom lists

### 2025-10-07 18:31 - Phase 0 COMPLETE: Planning & Architecture
- **AI**: Claude
- **Action**: Completed all Phase 0 tasks (0.1-0.5)
- **Files Created**:
  - Custom Lists Architecture Design section (307 lines)
  - `/home/projects/safeprompt/docs/CUSTOM_LISTS_V2_SPEC.md` (1039 lines)
- **Result**: Comprehensive specification ready for implementation
- **Key Deliverables**:
  1. ✅ Complete understanding of routing signal architecture
  2. ✅ Architectural design for custom lists integration
  3. ✅ DEFAULT_WHITELIST (30+ phrases) and DEFAULT_BLACKLIST (15+) designed
  4. ✅ Validation pipeline with custom lists integration mapped
  5. ✅ "Blacklist always wins" semantics via confidence levels
  6. ✅ Complete API specification with request/response formats
  7. ✅ Database schema with migration SQL
  8. ✅ Dashboard UI requirements
  9. ✅ Complete documentation change list (all locations)
  10. ✅ Testing requirements (105+ new unit tests, 10 realistic tests)
  11. ✅ Deployment plan (DEV → PROD)
  12. ✅ Code removal checklist with exact file paths/line numbers
- **Phase Status**: Phase 0 complete (5/5 tasks ✅)
- **Next Step**: Phase 1 - Task 1.1 Define DEFAULT_WHITELIST and DEFAULT_BLACKLIST constants

---

## Custom Lists Architecture Design

**Created**: 2025-10-07 18:16 (Task 0.4)

### Core Principle: Confidence Signals, Not Instant Decisions

Custom lists work as **routing signals** and **confidence modifiers** in the validation pipeline, NOT as instant block/allow gates.

### How Custom Lists Integrate

**1. Pattern Detection Phase** (ai-validator-hardened.js ~line 800-1000):
```javascript
// CURRENT: Pattern + business keywords → route to AI
if (xssDetected) {
  if (hasBusinessContext(prompt)) {
    patternContext = { detected: true, patternType: 'xss', contextType: 'business', confidence: 0.65 };
    // Continue to AI
  } else {
    return { safe: false };  // Instant block
  }
}

// NEW: Pattern + custom whitelist → route to AI
if (xssDetected) {
  const whitelistMatch = checkCustomLists(prompt, effectiveWhitelist, []);
  if (whitelistMatch) {
    customListContext = { type: 'whitelist', phrase: whitelistMatch, confidence: 0.8 };
    // Continue to AI with whitelist signal
  } else {
    return { safe: false };  // Instant block
  }
}
```

**2. Custom List Check Phase** (NEW - after external references, before orchestrator):
```javascript
// Check custom lists AFTER pattern detection and external references
const customListResult = checkCustomLists(prompt, effectiveWhitelist, effectiveBlacklist);

if (customListResult.type === 'blacklist') {
  // Blacklist match → Create attack signal (confidence 0.9)
  attackContext = {
    source: 'custom_blacklist',
    matched_phrase: customListResult.phrase,
    confidence: 0.9,
    reasoning: `Custom blacklist matched: "${customListResult.phrase}"`
  };
  // Pass to orchestrator - will route to attack_detector
}

if (customListResult.type === 'whitelist') {
  // Whitelist match → Create business signal (confidence 0.8)
  businessContext = {
    source: 'custom_whitelist',
    matched_phrase: customListResult.phrase,
    confidence: 0.8,
    reasoning: `Custom whitelist matched: "${customListResult.phrase}"`
  };
  // Pass to orchestrator - will route to business_validator
}
```

**3. Orchestrator Phase** (ai-orchestrator.js):
```javascript
// NEW: Accept customListContext parameter
export async function orchestrate(prompt, patternContext, customListContext) {
  const userMessage = JSON.stringify({
    request_type: "route_validation",
    untrusted_input: sanitizeForJSON(prompt),
    pattern_context: patternContext,
    custom_list_context: customListContext  // NEW
  });
  // Orchestrator uses this to determine routing
}
```

**4. Consensus Phase** (consensus-engine.js):
```javascript
// Custom list signals are treated as validator results
export function buildConsensus(orchestrator, validators, customListContext) {
  // If custom blacklist matched → treat as attack signal
  if (customListContext?.type === 'blacklist') {
    const syntheticAttackSignal = {
      is_attack: true,
      confidence: 0.9,  // High confidence (always wins)
      attack_types: ['custom_blacklist'],
      reasoning: `Blacklist matched: ${customListContext.phrase}`
    };
    validators.attack = syntheticAttackSignal;
  }

  // If custom whitelist matched → treat as business signal
  if (customListContext?.type === 'whitelist') {
    const syntheticBusinessSignal = {
      is_business: true,
      confidence: 0.8,  // Override threshold
      signals: [customListContext.phrase]
    };
    validators.business = syntheticBusinessSignal;
  }

  // Apply existing consensus logic
  // Business 0.8+ overrides attack < 0.6
  // Attack 0.75+ always blocks
  // Blacklist (0.9) always wins because 0.9 > 0.75
}
```

### "Blacklist Always Wins" Semantics

**Confidence Levels**:
- Custom whitelist: 0.8 (business override threshold)
- Custom blacklist: 0.9 (high-confidence attack)

**Consensus Logic** (existing, no changes needed):
- Business 0.8+ overrides attack < 0.6 → SAFE
- Attack 0.6-0.7 with business 0.8+ → UNSAFE (borderline, flagged)
- Attack 0.75+ → UNSAFE (always blocks)

**Result**: Blacklist (0.9) > Attack threshold (0.75) → Always blocks, even if whitelist also matches

**Example**:
```javascript
// Prompt: "Please reset password"
// Whitelist: ["reset password"] → confidence 0.8
// Blacklist: ["password"] → confidence 0.9

// Consensus sees:
// - business signal: 0.8 (whitelist)
// - attack signal: 0.9 (blacklist)

// Attack 0.9 > 0.75 threshold → UNSAFE (blacklist wins)
```

### Validation Pipeline Order (Complete)

```
1. Pattern Detection (XSS, SQL, Template, Command, Semantic)
   ├─ If pattern WITHOUT context → INSTANT BLOCK
   └─ If pattern WITH custom whitelist → route to AI with whitelist signal

2. External Reference Detection
   ├─ If dangerous reference → INSTANT BLOCK
   └─ Custom whitelist CANNOT override this

3. Custom Lists Check (NEW)
   ├─ Check blacklist → if matched, create attack signal (0.9)
   └─ Check whitelist → if matched, create business signal (0.8)

4. AI Orchestrator
   ├─ Receives: prompt + patternContext + customListContext
   └─ Routes to appropriate validators (business, attack, semantic)

5. AI Validators (parallel execution)
   ├─ Business Validator: Checks for legitimate business operations
   ├─ Attack Detector: Checks for manipulation attempts
   └─ Semantic Analyzer: Checks for indirect extraction

6. Consensus Engine
   ├─ Aggregates validator results + custom list signals
   ├─ Applies override logic (business 0.8+ vs attack < 0.6)
   └─ Returns final verdict with confidence score
```

### Security Invariants (CANNOT BE CHANGED)

**Pattern Detection Cannot Be Overridden**:
- XSS, SQL, Template, Command injection detected → Either instant block OR route to AI
- Custom whitelist can provide context signal but NOT bypass pattern detection
- Example: Whitelist contains "script" → `<script>alert(1)</script>` still detected as XSS
- Solution: Whitelist should use 2+ word phrases ("educational script tag example")

**External References Cannot Be Overridden**:
- Dangerous URLs, IPs, file paths → Instant block
- Custom whitelist CANNOT allow these through
- This is for security: external references can exfiltrate data

**Consensus Override Thresholds**:
- Business override: 0.8+ (to beat attack < 0.6)
- Attack always blocks: 0.75+
- These thresholds are calibrated based on production data

### Default Lists Design

**DEFAULT_WHITELIST** (30+ phrases, all 2+ words):
```javascript
export const DEFAULT_WHITELIST = [
  // Business Operations
  "business meeting", "team meeting", "discussed yesterday",
  "management approved", "emergency procedure", "standard process",
  "company policy", "management directive", "quarterly budget",
  "order number", "ticket number", "support ticket",
  "customer refund", "subscription management",

  // Educational/Security Research
  "educational example", "training example", "explain how",
  "tutorial about", "demonstrate attack", "academic research",
  "research paper", "security team", "security training",

  // Technical Security Discussion
  "cybersecurity strategy", "security assessment", "implement security",
  "security framework", "protect against injection", "security module",

  // Common Business Phrases
  "shipping address", "warehouse location", "customer service",
  "account settings", "user preferences"
];
```

**DEFAULT_BLACKLIST** (10+ phrases, all 2+ words):
```javascript
export const DEFAULT_BLACKLIST = [
  // Credential Exposure
  "database password", "admin password", "api secret key",
  "private api key", "access token", "connection string",

  // PII Protection
  "social security number", "credit card cvv", "credit card number",
  "bank account number",

  // Infrastructure Access
  "ssh private key", "aws credentials", "service account key"
];
```

**Why 2+ Words**:
- Safer substring matching (less false positives)
- More specific context (reduces ambiguity)
- Example: "address" matches IP addresses, memory addresses → Bad
- Example: "shipping address" only matches actual shipping context → Good

### Tier Model

```javascript
const TIER_LIMITS = {
  free: {
    customRulesEnabled: false,    // Can't add custom rules
    defaultListsEnabled: true,     // Gets read-only defaults
    canEditDefaults: false,        // Cannot modify defaults
    maxCustomRules: 0
  },
  starter: {
    customRulesEnabled: true,
    defaultListsEnabled: true,
    canEditDefaults: true,         // Can remove default items
    maxCustomRules: 10,
    maxTotalRules: 50              // Default (~40) + custom (10)
  },
  business: {
    customRulesEnabled: true,
    defaultListsEnabled: true,
    canEditDefaults: true,
    maxCustomRules: 50,
    maxTotalRules: 100
  },
  enterprise: {
    customRulesEnabled: true,
    defaultListsEnabled: true,
    canEditDefaults: true,
    maxCustomRules: 200,
    maxTotalRules: 250
  },
  internal: {
    customRulesEnabled: true,
    defaultListsEnabled: true,
    canEditDefaults: true,
    maxCustomRules: 50,
    maxTotalRules: 100
  }
};
```

### Database Schema

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  uses_default_whitelist BOOLEAN DEFAULT true,
  uses_default_blacklist BOOLEAN DEFAULT true,
  custom_whitelist TEXT[] DEFAULT '{}',
  custom_blacklist TEXT[] DEFAULT '{}',
  removed_defaults JSONB DEFAULT '{"whitelist":[],"blacklist":[]}'::jsonb;

-- Effective lists calculation:
-- effectiveWhitelist = DEFAULT_WHITELIST
--   .filter(item => !removed_defaults.whitelist.includes(item))
--   .concat(custom_whitelist)
```

### Response Attribution

```javascript
// API Response Format
{
  "safe": true,
  "confidence": 0.82,
  "threats": [],
  "reasoning": "Allowed by custom whitelist override",
  "customRuleMatched": {
    "type": "whitelist",
    "matchedPhrase": "shipping address",
    "originalAIDecision": "unsafe",  // What AI said
    "overriddenBy": "custom_whitelist"  // Why we allowed it
  }
}
```

---

## Hard-Fought Knowledge

(Will be populated as discoveries are made during implementation)

---

## Notes & Observations

**Design Decision: Custom Lists as Routing Signals**

After deep analysis of current code, the correct architecture is:
- Custom lists are NOT instant decisions (like pattern detection)
- Custom lists are confidence signals that guide AI routing and consensus
- This matches existing business context paradigm
- Blacklist → increases attack confidence (0.9)
- Whitelist → increases business confidence (0.8)
- Consensus engine applies override logic using these signals

This is MORE sophisticated than simple instant allow/block, and maintains SafePrompt's defense-in-depth philosophy.

---

## References

- Methodology: This document follows `/home/projects/docs/methodology-long-running-tasks.md`
- Project CLAUDE.md: `/home/projects/safeprompt/CLAUDE.md`
- Original spec (for reference): `/home/projects/safeprompt/docs/CUSTOM_LISTS.md`
- Supabase reference: `/home/projects/docs/reference-supabase-access.md`
- Vercel reference: `/home/projects/docs/reference-vercel-access.md`
- Cloudflare reference: `/home/projects/docs/reference-cloudflare-access.md`
