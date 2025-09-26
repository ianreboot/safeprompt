# Supabase Setup Instructions

## Current Issue
The waitlist functionality is not working because the `waitlist` table hasn't been created in your Supabase database.

## Quick Fix (5 minutes)

### Step 1: Login to Supabase
1. Go to https://app.supabase.com
2. Login with your credentials
3. Select the project: `vkyggknknyfallmnrmfu` (or the project matching your URL)

### Step 2: Create the Waitlist Table
1. Click on **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy and paste this SQL:

```sql
-- Simple waitlist table for SafePrompt
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'website',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON public.waitlist(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the API)
CREATE POLICY "Allow anonymous inserts" ON public.waitlist
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Service role full access
CREATE POLICY "Service role full access" ON public.waitlist
    FOR ALL
    TO service_role
    USING (true);
```

4. Click **Run** (or press Ctrl/Cmd + Enter)

### Step 3: Verify It Worked
1. Go to **Table Editor** in the left sidebar
2. You should see a `waitlist` table
3. The table should have columns: `id`, `email`, `source`, `created_at`

### Step 4: Test the Endpoint
Run this command to test:
```bash
curl -X POST https://api.safeprompt.dev/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "source": "test"}'
```

## Environment Variables Status
✅ Vercel has the correct environment variables:
- `SAFEPROMPT_SUPABASE_URL`: Set correctly
- `SAFEPROMPT_SUPABASE_SERVICE_ROLE_KEY`: Set correctly

## Alternative: Create Full Schema
If you want to create the complete schema with all tables (users, api_keys, usage_logs, etc.), use the file:
`/home/projects/safeprompt/api/schema/supabase-schema.sql`

## Debugging Connection
To test your Supabase connection locally:
```bash
cd /home/projects/safeprompt/api
node test-supabase.js
```

## Current API Code
The waitlist endpoint is deployed at:
- URL: https://api.safeprompt.dev/api/waitlist
- File: /home/projects/safeprompt/api/api/waitlist.js
- Frontend: /home/projects/safeprompt/website/components/WaitlistForm.tsx

The code is ready and waiting for the database table to be created!