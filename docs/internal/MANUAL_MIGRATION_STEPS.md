# Manual Migration Steps - Phase 1.3

## Database Migration Required

The admin authentication upgrade requires running a database migration to add the `is_admin` column to the profiles table.

### Steps:

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/adyfhzbcsqzgqvyimycv
   - Navigate to: SQL Editor

2. **Run Migration SQL**
   - Open the SQL file: `/api/migrations/003_add_admin_flag.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Verify Migration**
   - The migration includes a verification step that will show:
   ```
   NOTICE: Admin flag added successfully. Admin users: 1
   ```
   - This confirms ian.ho@rebootmedia.net has been set as admin

### Migration Contents:

```sql
-- Migration: Add is_admin flag to profiles table
-- Purpose: Replace static admin key with proper role-based access control
-- Created: 2025-10-04

-- Add is_admin column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set ian.ho@rebootmedia.net as admin user
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'ian.ho@rebootmedia.net';

-- Create index for admin queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin
ON public.profiles(is_admin)
WHERE is_admin = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_admin IS 'Admin flag for role-based access control. Set to TRUE for admin users.';

-- Verify the change
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE is_admin = TRUE;

  RAISE NOTICE 'Admin flag added successfully. Admin users: %', admin_count;
END $$;
```

### Post-Migration:

After running the migration:

1. **Test Admin Authentication**
   - Log in to dashboard.safeprompt.dev with ian.ho@rebootmedia.net
   - Open browser console and get the auth token:
     ```javascript
     const { data: { session } } = await supabase.auth.getSession()
     console.log(session.access_token)
     ```
   - Test the admin endpoint with the token:
     ```bash
     curl -X POST https://api.safeprompt.dev/admin?action=approve-waitlist \
       -H "Authorization: Bearer YOUR_TOKEN_HERE" \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com"}'
     ```

2. **Test Non-Admin Denial**
   - Log in with a non-admin account
   - Attempt to access admin endpoint
   - Should receive: `403 Forbidden - Admin privileges required`

### Why Manual Migration?

Supabase disabled legacy API keys as of 2025-10-03, which prevents programmatic migrations via the service role key. Manual execution via the SQL Editor is now the recommended approach.

### Rollback (if needed):

```sql
-- Remove is_admin column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;

-- Remove index
DROP INDEX IF EXISTS idx_profiles_is_admin;
```
