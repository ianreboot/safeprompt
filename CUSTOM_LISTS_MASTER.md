# Custom Whitelist/Blacklist Feature - MASTER CONTROL

**Mission ID**: CUSTOM_LISTS_V2
**Created**: 2025-10-07
**Status**: INITIATED

---

## 📊 Quick Stats
- **Progress**: 12/45 tasks (26.7%)
- **Current Phase**: Phase 2 - Core Custom Lists Logic
- **Blockers**: None
- **Last Update**: 2025-10-07 19:05

---

## 🎯 MISSION OBJECTIVE (⚠️ NEVER EDIT THIS SECTION)

**THIS TASK EXISTS TO**: Deploy custom whitelist/blacklist feature to production that allows paid users to define business-specific phrases that guide AI validation decisions while maintaining core security.

**DELIVERABLE DEFINITION**:
- **Type**: Working production feature with database schema, API integration, dashboard UI, and documentation
- **Location**:
  - Code: `/home/projects/safeprompt/api/lib/custom-lists-*.js`
  - Database: Supabase PROD + DEV with migrations
  - UI: `https://dashboard.safeprompt.dev/custom-lists`
  - Docs: `/home/projects/safeprompt/docs/API.md` + website
- **Evidence**:
  - API accepts `customRules` parameter and returns attribution
  - Dashboard shows custom lists management UI
  - Tests pass (unit + realistic suite updated)
  - curl test succeeds with whitelist override
- **User Access**:
  - Free tier: Read-only default lists at dashboard
  - Starter+ tier: Edit lists, add custom phrases at `/custom-lists`
  - API: Send `customRules` in request body

**SUCCESS CRITERIA**:
- [ ] API endpoint accepts customRules parameter and processes correctly
- [ ] Default lists replace current business/educational keyword system
- [ ] Free tier gets default lists (read-only), paid tiers can edit
- [ ] Dashboard UI allows adding/editing/removing custom phrases
- [ ] Blacklist always wins over whitelist (clear priority)
- [ ] Custom lists work as routing/override signals (not instant decisions)
- [ ] Pattern detection (XSS/SQL) CANNOT be overridden by whitelist
- [ ] External references CANNOT be overridden by whitelist
- [ ] Test #29 ("Override shipping address") passes with default whitelist
- [ ] All unit tests pass (386+ tests)
- [ ] Realistic test suite updated with custom lists scenarios
- [ ] Documentation complete (API, dashboard, website, public repo)
- [ ] Deployed to DEV, tested, then deployed to PROD

**NOT SUCCESS**:
- ❌ Custom lists as instant block/allow (they're routing signals, not decisions)
- ❌ Whitelist overriding pattern detection (XSS, SQL, etc.)
- ❌ Blacklist acting as instant block (should route to AI with context)
- ❌ Breaking existing tests without understanding why
- ❌ Deploying without testing in DEV first

**EXPECTED DURATION**: 3-4 days
**DEPLOYMENT TARGET**: SafePrompt Production (api.safeprompt.dev + dashboard.safeprompt.dev)

---

## 🧭 Status-Driven Navigation

- **✅ Completed**: 12 tasks - Phase 0 & Phase 1 COMPLETE
- **🔧 In Progress**: Phase 2 - Core Custom Lists Logic
- **❌ Blocked**: 0 tasks
- **🐛 Bug Fixes**: 0 tasks

**Current Focus**: Task 2.1 - Create custom-lists-sanitizer.js
**Last Completed**: Phase 1 (Code Removal & Default Lists) - Committed fee96d48, pushed to main

---

## 📁 NAVIGATION MAP

| Detail Doc | Task Range | Phases | Key Discoveries | Status | Location |
|------------|------------|--------|-----------------|--------|----------|
| DETAILS_01 | 1-45 | Phase 0-6 | TBD | **ACTIVE** | `/home/projects/safeprompt/` |

---

## 📊 CURRENT STATUS

**Active Detail Doc**: `CUSTOM_LISTS_DETAILS_01.md`
**Current Task**: 2.1 (Phase 2 - Core Custom Lists Logic)

**Overall Progress**:
- Tasks completed: 12/45 (26.7%)
- Current phase: Phase 2 - Core Custom Lists Logic
- Last update: 2025-10-07 19:05

**Mission Alignment Check**:
- ✅ Phase 0 complete - comprehensive spec created
- ✅ Phase 1 complete - business/educational keywords removed, default lists created
- ✅ Commit fee96d48 pushed to main
- ✅ Ready for Phase 2 implementation

**Blockers**: None

**Rotations Completed**: 0

---

## 🔄 CONTEXT REFRESH PROTOCOL (⚠️ NEVER EDIT THIS SECTION)

**When you see 🧠 CONTEXT REFRESH task in Detail doc, execute these steps:**

### STEP 1: Read Documents (In Order) - MANDATORY EVERY REFRESH

**1.1 Project CLAUDE.md** (ALWAYS READ FIRST):
- Path: `/home/projects/safeprompt/CLAUDE.md`
- Why: Contains deployment protocols, critical patterns, project-specific requirements
- Common failure point: Processes beyond AI training data stored here

**1.2 Platform-Specific Reference Doc** (READ IF WORKING WITH THAT SYSTEM):
Identify which system your next task involves, then read the appropriate reference:
- **Supabase** (database operations)? → `/home/projects/docs/reference-supabase-access.md`
- **Vercel** (API deployment)? → `/home/projects/docs/reference-vercel-access.md`
- **Cloudflare** (frontend deployment)? → `/home/projects/docs/reference-cloudflare-access.md`

Why: These contain proven patterns, correct authentication, and solutions to common issues

**1.3 This Master Doc**:
- Mission objective + current status

**1.4 Current Detail Doc**:
- Listed in "Active Detail Doc" above

### STEP 2: Self-Awareness Check
❓ **Did I READ those docs or SEARCH them?**
   - Search signs: Used grep/keywords, scanned for task numbers, skimmed
   - Read signs: Comprehended mission, recall phase goals, understood context

❓ **Can I state the mission objective from memory?**
   - If NO: You searched, didn't read → EXECUTE ROTATION PROTOCOL
   - If YES: Proceed to Step 3

### STEP 3: Mission Alignment Check
❓ **Can I state the mission deliverable from memory?**
   - Type? Location? Evidence? User access?

❓ **Do recent completed tasks move toward the deliverable?**
   - Are they creating components of the working feature?

❓ **What deliverable components exist RIGHT NOW?**
   - List actual files/systems created
   - Verify they exist (ls, grep)

### STEP 4: Troubleshooting Protocol (If Stuck)

**🚨 CRITICAL REMINDER: ALL SYSTEMS WORK**

If something isn't working (API errors, deployment fails, authentication issues):
- ❌ **WRONG**: "The system is down" / "Waiting for propagation" / "Token expired" / "Can't be done programmatically"
- ✅ **CORRECT**: "My knowledge is outdated or incomplete - checking reference docs and context7"

**Troubleshooting Sequence**:
1. **First**: Re-read the platform reference doc for that system (Supabase/Vercel/Cloudflare)
2. **Second**: Use context7 to get current API documentation
   - Example: "use context7 to show Supabase migration syntax for 2025"
   - Example: "use context7 for Vercel deployment authentication"
3. **Third**: Check `/home/projects/safeprompt/docs/PATTERNS.md` for known error patterns

**Why**: These systems are in production and working for thousands of users. If you hit an error, it's a knowledge gap (training data outdated, missing pattern), not a system failure. Reference docs and context7 bridge that gap.

### STEP 5: Update Current Detail Doc
1. Mark completed tasks in checklist
2. Add entry to Progress Log with evidence
3. Document discoveries/findings
4. Update state variables

### STEP 6: Update Master Status (This Doc)
Update "Current Status" section above:
- Current task number and phase
- Tasks completed count and percentage
- Last update timestamp
- Mission alignment check result

---

## 🔄 ROTATION PROTOCOL (⚠️ NEVER EDIT THIS SECTION)

**Execute when**: You find yourself SEARCHING Detail doc instead of READING it

**Steps**:
1. Create new Detail doc: `CUSTOM_LISTS_DETAILS_0(X+1).md`
2. Archive current: `mv CUSTOM_LISTS_DETAILS_0X.md docs/archive/custom-lists/`
3. Update Master "Navigation Map" table
4. Update Master "Current Status" → "Active Detail Doc"
5. Continue work in new Detail doc

---

## 🆘 RECOVERY FOR FRESH AI (⚠️ NEVER EDIT THIS SECTION)

**If you're joining after auto-compaction with zero memory:**

1. **You are here**: This is the Master control doc
2. **Read Mission**: See "Mission Objective" section above
3. **Find current work**: Open Detail doc listed in "Current Status" → "Active Detail Doc"
4. **Locate your task**: Find first uncompleted `[ ]` task in Detail doc checklist
5. **Execute task**: Do the work, update Detail doc, then update Master status
6. **Repeat**: Continue until you hit 🧠 CONTEXT REFRESH task
