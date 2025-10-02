# SafePrompt Codebase Review Report
**Date:** October 2, 2025
**Purpose:** Identify all references to deprecated tables and incorrect column names

---

## Executive Summary

### ✅ PRODUCTION CODE IS CLEAN
The **live production API and dashboard** are using correct tables and columns:
- ✅ `/api/api/v1/validate.js` - Uses `profiles` and `api_logs` with correct columns
- ✅ `/dashboard/src/app/admin/page.tsx` - Uses `profiles` and `api_logs` with correct columns
- ✅ `/dashboard/src/app/page.tsx` - Uses correct `subscription_tier` and `api_requests_used` columns

### ⚠️ ISSUES FOUND
All issues are in **setup scripts, deprecated schema files, and old scripts** that need cleanup:

1. **7 files** still create/reference deprecated `users` table
2. **2 files** still create/reference deprecated `api_keys` table
3. **1 file** still creates deprecated `usage_logs` table
4. **9 files** use wrong column name `tier` (should be `subscription_tier`)
5. **8 files** use wrong column name `api_calls_this_month` (should be `api_requests_used`)
6. **1 production file** has bug: admin suspend function tries to update deprecated `api_keys` table

---

## Detailed Findings

### 🚨 CRITICAL: Production Code Bug

**File:** `/dashboard/src/app/admin/page.tsx`
**Lines:** 156-159
**Issue:** When suspending users, tries to update the deprecated `api_keys` table

```typescript
// ❌ BUG: This table doesn't exist anymore
await supabase
  .from('api_keys')
  .update({ is_active: false })
  .eq('user_id', userId)
```

**Fix:** Remove lines 156-159 (profiles table already has `is_active` flag)

---

### 📋 Deprecated Table: `users`

#### Schema Files (Should Delete)
| File | Line | Action Required |
|------|------|-----------------|
| `/api/schema/supabase-schema.sql` | 10, 177 | Delete CREATE TABLE and ALTER TABLE statements |
| `/api/scripts/setup-database.js` | 29 | Delete users table creation |
| `/api/scripts/setup-supabase.js` | 134 | Remove 'users' from tables array |

#### Scripts Using Wrong Table (Need Update)
| File | Lines | Issue | Fix |
|------|-------|-------|-----|
| `/scripts/list-tables.js` | 31 | Checks for deprecated 'users' table | Remove from tablesToCheck array |
| `/scripts/update-internal-user.js` | 65, 140 | Updates/deletes from 'users' table | Use 'profiles' table instead |
| `/scripts/audit-db.js` | Multiple | Queries deprecated columns | Update to use profiles table |
| `/scripts/check-tiers.js` | Multiple | Queries tier column from old table | Update to use profiles.subscription_tier |

---

### 📋 Deprecated Table: `api_keys`

#### Schema Files (Should Delete)
| File | Line | Action Required |
|------|------|-----------------|
| `/api/schema/supabase-schema.sql` | 40, 178 | Delete CREATE TABLE and ALTER TABLE statements |
| `/api/scripts/setup-database.js` | 46 | Delete api_keys table creation |
| `/api/scripts/setup-supabase.js` | 134 | Remove 'api_keys' from tables array |

---

### 📋 Deprecated Table: `usage_logs`

**Note:** This table has been replaced by `api_logs`

#### Schema Files (Should Delete or Rename)
| File | Lines | Issue |
|------|-------|-------|
| `/api/schema/supabase-schema.sql` | 70, 101-105, 179, 188, 302, 326 | Creates usage_logs table with partitions |
| `/api/scripts/setup-database.js` | 61, 116-117 | Creates usage_logs table and indexes |
| `/api/scripts/setup-supabase.js` | 134, 146 | References usage_logs in tables array |

**Decision Needed:** Is `usage_logs` still in use or fully migrated to `api_logs`?

---

### ⚠️ Wrong Column: `tier` (Should be `subscription_tier`)

#### Scripts Using Deprecated Column
| File | Lines | Impact |
|------|-------|--------|
| `/scripts/audit-db.js` | 40, 117, 119 | Queries wrong column, will return null |
| `/scripts/check-tiers.js` | 15, 23-25, 39 | Queries wrong column |
| `/scripts/update-internal-user.js` | 77, 100, 119 | Inserts wrong column name |
| `/scripts/cleanup-db.js` | 105 | Displays wrong column |
| `/scripts/create-internal-user.js` | 60, 83, 123 | References wrong column |

#### Database Setup Files
| File | Lines | Issue |
|------|-------|-------|
| `/api/scripts/setup-supabase.js` | 84 | Inserts demo data with 'tier' column |
| `/api/scripts/setup-database.js` | 168 | Inserts demo data with 'tier' column |
| `/scripts/audit-database.sql` | 10 | Selects 'tier' column (doesn't exist in profiles) |

---

### ⚠️ Wrong Column: `api_calls_this_month` (Should be `api_requests_used`)

#### Database Schema Files
| File | Lines | Action Required |
|------|-------|-----------------|
| `/database/setup.sql` | 10, 61 | Update column name in CREATE TABLE and reset script |
| `/dashboard/scripts/create-profiles-table.js` | 36 | Update column name |
| `/dashboard/scripts/setup-database.js` | 22 | Update column name |

#### Scripts and Functions
| File | Lines | Issue |
|------|-------|-------|
| `/scripts/audit-db.js` | 41 | Queries wrong column |
| `/scripts/audit-database.sql` | 10 | Selects wrong column |
| `/dashboard/scripts/setup-users.js` | 53, 99 | Inserts wrong column name |
| `/dashboard/scripts/update-schema-subscriptions.js` | 121, 127, 144 | Uses wrong column in database function |
| `/dashboard/scripts/test-user-lifecycle.js` | 152, 158, 162 | Updates and selects wrong column |

---

## Files That Are CORRECT ✅

### Production API
- ✅ `/api/api/v1/validate.js` - Uses profiles (line 47, 56, 81) and api_logs (126, 189)
- ✅ `/api/api/webhooks.js` - Uses profiles with subscription_tier
- ✅ `/api/api/admin.js` - Uses profiles.subscription_tier

### Production Dashboard
- ✅ `/dashboard/src/app/page.tsx` - Uses profiles with correct columns
- ✅ `/dashboard/src/app/admin/page.tsx` - Uses profiles and api_logs (except bug on lines 156-159)

---

## Recommended Actions

### IMMEDIATE (Production Bug)
1. ✅ **Fix admin suspend function** - Remove lines 156-159 from `/dashboard/src/app/admin/page.tsx`
2. ✅ **Test admin panel** - Verify suspension works without api_keys table

### HIGH PRIORITY (Cleanup Deprecated Schema)
3. **Drop deprecated tables** from Supabase:
   ```sql
   DROP TABLE IF EXISTS users CASCADE;
   DROP TABLE IF EXISTS api_keys CASCADE;
   DROP TABLE IF EXISTS validation_logs CASCADE;
   ```

4. **Clean up schema files**:
   - Delete deprecated table definitions from `/api/schema/supabase-schema.sql`
   - Update `/api/scripts/setup-database.js` to remove deprecated tables
   - Update `/api/scripts/setup-supabase.js` to remove deprecated table references

### MEDIUM PRIORITY (Fix Scripts)
5. **Update all scripts to use correct column names**:
   - Search and replace `tier` → `subscription_tier`
   - Search and replace `api_calls_this_month` → `api_requests_used`

6. **Fix specific scripts**:
   - `/scripts/audit-db.js` - Update to use profiles.subscription_tier
   - `/scripts/check-tiers.js` - Update to use profiles.subscription_tier
   - `/scripts/update-internal-user.js` - Update table and column names
   - `/scripts/create-internal-user.js` - Update to use correct columns
   - `/database/setup.sql` - Update profiles table schema
   - All `/dashboard/scripts/*.js` - Update column names

### LOW PRIORITY (Decide on usage_logs)
7. **Clarify usage_logs vs api_logs**:
   - If `usage_logs` is fully deprecated, remove it from schema
   - If still in use, ensure it's properly documented
   - Update schema documentation to clarify which table to use

---

## Test Plan

After making fixes:

1. **Test admin panel suspension**:
   - Login to admin panel (dashboard.safeprompt.dev/admin)
   - Try suspending a user
   - Verify no errors about missing api_keys table

2. **Test all scripts**:
   ```bash
   cd /home/projects/safeprompt/scripts
   node audit-db.js  # Should show subscription_tier correctly
   node check-tiers.js  # Should query profiles.subscription_tier
   node list-tables.js  # Should not fail on deprecated tables
   ```

3. **Verify production API**:
   - Test validation endpoint with valid API key
   - Check admin dashboard displays correct data
   - Verify api_logs table receives entries

4. **Database verification**:
   ```sql
   -- Verify profiles table has correct columns
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'profiles'
   ORDER BY ordinal_position;

   -- Should show: subscription_tier, api_requests_used (not tier, api_calls_this_month)
   ```

---

## Notes

- Most deprecated references are in old setup scripts and backups (safe to ignore)
- Test suite contains intentional SQL injection strings with "users" table (safe to ignore)
- Documentation files reference old schema (update in ARCHITECTURE.md cleanup)
- Core production code is already using correct tables/columns ✅

---

## Summary Statistics

| Category | Count | Status |
|----------|-------|--------|
| Production files with issues | 1 | 🚨 Critical bug in admin panel |
| Schema files to update | 3 | ⚠️ High priority |
| Scripts using deprecated tables | 7 | ⚠️ Medium priority |
| Scripts using wrong columns | 17 | ⚠️ Medium priority |
| Production API files | 3 | ✅ All correct |
| Production dashboard files | 2 | ✅ Mostly correct (1 bug) |

**Next Steps:** Fix critical admin bug → Drop deprecated tables → Update scripts → Test thoroughly
