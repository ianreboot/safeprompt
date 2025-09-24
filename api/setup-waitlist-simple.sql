-- Simple waitlist table for SafePrompt
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'website',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON public.waitlist(created_at DESC);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow inserts from anonymous users (for the API)
CREATE POLICY "Allow anonymous inserts" ON public.waitlist
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Create a policy for service role to do everything
CREATE POLICY "Service role full access" ON public.waitlist
    FOR ALL
    TO service_role
    USING (true);

-- Test the table
SELECT COUNT(*) as total_signups FROM public.waitlist;