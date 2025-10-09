# Multi-Turn Detection - Deployment Instructions

## Database Migration Required

The multi-turn attack detection system requires database tables for session tracking.

**Migration File**: `/home/projects/safeprompt/supabase/migrations/20251009_multi_turn_session_tracking.sql`

## Deployment Options

### Option 1: Supabase Dashboard SQL Editor (RECOMMENDED)

**Why**: Most reliable method, bypasses network/authentication issues

**Steps**:
1. Go to Supabase Dashboard
   - **DEV**: https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu/sql/new
   - **PROD**: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv/sql/new

2. Copy the entire contents of the migration file:
   ```bash
   cat /home/projects/safeprompt/supabase/migrations/20251009_multi_turn_session_tracking.sql
   ```

3. Paste into SQL Editor and click "Run"

4. Verify tables created:
   ```sql
   SELECT tablename FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename LIKE '%session%'
   ORDER BY tablename;
   ```

   Expected output:
   - `session_attack_patterns`
   - `session_requests`
   - `validation_sessions`

### Option 2: Supabase CLI (If Project is Linked)

**Prerequisites**:
- Supabase CLI installed
- Project linked to local directory

**Steps**:
```bash
cd /home/projects/safeprompt

# Load credentials
source /home/projects/.env
export SUPABASE_ACCESS_TOKEN

# Link project (if not already linked)
# DEV:
supabase link --project-ref vkyggknknyfallmnrmfu --password "${SAFEPROMPT_SUPABASE_DB_PASSWORD}"

# OR PROD:
# supabase link --project-ref adyfhzbcsqzgqvyimycv --password "${SAFEPROMPT_PROD_SUPABASE_DB_PASSWORD}"

# Push migrations
supabase db push
```

### Option 3: Direct psql (Fallback - May Have Issues)

**Known Issues**: Connection failures, password escaping problems

**DEV Database**:
```bash
source /home/projects/.env
export PGPASSWORD="${SAFEPROMPT_SUPABASE_DB_PASSWORD}"

psql -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.vkyggknknyfallmnrmfu \
  -d postgres \
  -f /home/projects/safeprompt/supabase/migrations/20251009_multi_turn_session_tracking.sql
```

**PROD Database** (Use with caution):
```bash
source /home/projects/.env
export PGPASSWORD="${SAFEPROMPT_PROD_SUPABASE_DB_PASSWORD}"

psql -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.adyfhzbcsqzgqvyimycv \
  -d postgres \
  -f /home/projects/safeprompt/supabase/migrations/20251009_multi_turn_session_tracking.sql
```

## Migration Contents

The migration creates:

**3 Tables**:
1. `validation_sessions` - Tracks user sessions across multiple validation requests
2. `session_requests` - Individual validation requests within sessions
3. `session_attack_patterns` - Detected multi-turn attack patterns

**PostgreSQL Functions**:
- `update_session_activity()` - Trigger function for automatic session updates
- `cleanup_expired_sessions()` - Remove sessions older than 24 hours
- `calculate_session_risk_score(session_id)` - Calculate cumulative risk score (0.0-1.0)
- `detect_multiturn_patterns(session_id)` - Detect 10 types of attack patterns

**Triggers**:
- `trigger_update_session_activity` - Auto-update session metadata on new requests

**Indexes**:
- Optimized for session lookup by IP, user, risk score
- Efficient request retrieval by session and timestamp

**RLS Policies**:
- Service role: Full access for API
- Users: Can only see their own sessions

## Verification

After running the migration, verify it worked:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('validation_sessions', 'session_requests', 'session_attack_patterns');

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'update_session_activity',
  'cleanup_expired_sessions',
  'calculate_session_risk_score',
  'detect_multiturn_patterns'
);

-- Check indexes exist
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('validation_sessions', 'session_requests', 'session_attack_patterns');
```

## Deployment Checklist

- [ ] Migration applied to DEV database
- [ ] Tables verified (3 tables created)
- [ ] Functions verified (4 functions created)
- [ ] Indexes verified (7 indexes created)
- [ ] RLS policies verified (6 policies created)
- [ ] Test multi-turn detection (run test suite)
- [ ] Migration applied to PROD database (after DEV testing)
- [ ] Production verification complete

## Next Steps After Migration

1. **Run Multi-Turn Test Suite**:
   ```bash
   cd /home/projects/safeprompt
   node test-suite/run-multi-turn-tests.js
   ```
   Target: ≥95% accuracy on 20 tests

2. **Integrate with API**:
   Update validation endpoints to use `validateWithMultiTurn`

3. **Add Client Fingerprinting**:
   Implement frontend device fingerprint collection

4. **Set Up Monitoring**:
   - Configure session cleanup cron job
   - Create alerts for high-risk sessions
   - Build pattern detection dashboard

## Troubleshooting

### "Tenant or user not found" Error
- **Cause**: Pooler connection issue
- **Solution**: Use Supabase Dashboard SQL Editor instead

### "Password authentication failed"
- **Cause**: Special characters in password not escaped correctly
- **Solution**: Use Supabase Dashboard SQL Editor instead

### "Cannot connect to Docker daemon"
- **Cause**: Supabase CLI trying to use local Docker
- **Solution**: This is expected in headless environment, use Dashboard instead

### "Object already exists" Errors
- **Cause**: Migration run multiple times
- **Status**: OK - Migration is idempotent (safe to run multiple times)
- **Action**: Verify objects exist with verification queries above

## Database Credentials Reference

**DEV Database**:
- Project Ref: `vkyggknknyfallmnrmfu`
- URL: `https://vkyggknknyfallmnrmfu.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/vkyggknknyfallmnrmfu

**PROD Database**:
- Project Ref: `adyfhzbcsqzgqvyimycv`
- URL: `https://adyfhzbcsqzgqvyimycv.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv

**Credentials Location**: `/home/projects/.env`
- `SAFEPROMPT_SUPABASE_URL` (DEV)
- `SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY` (DEV)
- `SAFEPROMPT_SUPABASE_DB_PASSWORD` (DEV)
- `SAFEPROMPT_PROD_SUPABASE_URL` (PROD)
- `SAFEPROMPT_PROD_SUPABASE_SERVICE_ROLE_KEY` (PROD)
- `SAFEPROMPT_PROD_SUPABASE_DB_PASSWORD` (PROD - if available)
