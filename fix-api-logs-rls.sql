-- Enable RLS on api_logs
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own api_logs
CREATE POLICY IF NOT EXISTS users_read_own_logs ON api_logs
FOR SELECT
USING (profile_id = auth.uid());
