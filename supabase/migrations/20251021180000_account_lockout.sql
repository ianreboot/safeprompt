-- SECURITY: Account lockout after failed login attempts
-- Prevents brute force attacks by locking accounts after N failed attempts

-- Add failed login tracking columns to profiles table
DO $$
BEGIN
    -- Track number of failed login attempts
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'failed_login_attempts'
    ) THEN
        ALTER TABLE profiles ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL;
    END IF;

    -- Timestamp when account will be unlocked (null = not locked)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'locked_until'
    ) THEN
        ALTER TABLE profiles ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Track last failed login attempt for rate limiting
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'last_failed_login'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_failed_login TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create index for lockout checks (performance optimization)
CREATE INDEX IF NOT EXISTS idx_profiles_locked_until ON profiles(locked_until) WHERE locked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_failed_attempts ON profiles(failed_login_attempts) WHERE failed_login_attempts > 0;

-- Function to check if account is currently locked
CREATE OR REPLACE FUNCTION is_account_locked(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    lock_status RECORD;
BEGIN
    SELECT locked_until INTO lock_status
    FROM profiles
    WHERE id = user_id;

    -- Account is locked if locked_until is in the future
    IF lock_status.locked_until IS NOT NULL AND lock_status.locked_until > NOW() THEN
        RETURN TRUE;
    ELSE
        -- Auto-unlock if lockout period has expired
        IF lock_status.locked_until IS NOT NULL AND lock_status.locked_until <= NOW() THEN
            UPDATE profiles
            SET locked_until = NULL,
                failed_login_attempts = 0
            WHERE id = user_id;
        END IF;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record failed login attempt
CREATE OR REPLACE FUNCTION record_failed_login(user_email TEXT)
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    max_attempts INTEGER := 5;  -- Lock after 5 failed attempts
    lockout_duration INTERVAL := '30 minutes';  -- 30 minute lockout
BEGIN
    -- Get current user record
    SELECT id, failed_login_attempts, locked_until
    INTO user_record
    FROM profiles
    WHERE email = user_email;

    -- If user doesn't exist, return generic response (prevent user enumeration)
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'locked', FALSE,
            'attempts_remaining', max_attempts
        );
    END IF;

    -- Check if already locked
    IF user_record.locked_until IS NOT NULL AND user_record.locked_until > NOW() THEN
        RETURN jsonb_build_object(
            'locked', TRUE,
            'locked_until', user_record.locked_until,
            'attempts_remaining', 0
        );
    END IF;

    -- Increment failed attempts
    UPDATE profiles
    SET failed_login_attempts = failed_login_attempts + 1,
        last_failed_login = NOW(),
        locked_until = CASE
            WHEN failed_login_attempts + 1 >= max_attempts THEN NOW() + lockout_duration
            ELSE NULL
        END
    WHERE id = user_record.id;

    -- Return status
    IF user_record.failed_login_attempts + 1 >= max_attempts THEN
        RETURN jsonb_build_object(
            'locked', TRUE,
            'locked_until', NOW() + lockout_duration,
            'attempts_remaining', 0
        );
    ELSE
        RETURN jsonb_build_object(
            'locked', FALSE,
            'attempts_remaining', max_attempts - (user_record.failed_login_attempts + 1)
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset failed login attempts on successful login
CREATE OR REPLACE FUNCTION reset_failed_login_attempts(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET failed_login_attempts = 0,
        locked_until = NULL,
        last_failed_login = NULL
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_account_locked(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION record_failed_login(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION reset_failed_login_attempts(UUID) TO authenticated, anon;

-- Comment for documentation
COMMENT ON COLUMN profiles.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN profiles.locked_until IS 'Account locked until this timestamp (null = not locked)';
COMMENT ON COLUMN profiles.last_failed_login IS 'Timestamp of most recent failed login attempt';
COMMENT ON FUNCTION is_account_locked(UUID) IS 'Check if account is currently locked due to failed attempts';
COMMENT ON FUNCTION record_failed_login(TEXT) IS 'Record failed login attempt and lock account if threshold exceeded';
COMMENT ON FUNCTION reset_failed_login_attempts(UUID) IS 'Reset failed login counter on successful authentication';
