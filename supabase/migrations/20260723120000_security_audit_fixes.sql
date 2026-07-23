-- 1. Fix RPC Permissions (Finding 1)
-- Revoke PUBLIC access to securely scope increment_session_version
REVOKE EXECUTE ON FUNCTION public.increment_session_version(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_session_version(UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_session_version(UUID) TO service_role;

-- Revoke PUBLIC access to check_and_update_otp_cooldown
-- (We will re-apply this after recreating the function with new parameters below)

-- 2. Enhance OTP Rate Limiting Table (Finding 2)
ALTER TABLE public.otp_requests
ADD COLUMN IF NOT EXISTS window_start_time TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Update OTP Cooldown RPC (Finding 2)
-- Drop the existing function so we can cleanly redefine parameters
DROP FUNCTION IF EXISTS public.check_and_update_otp_cooldown(TEXT, INT);

CREATE OR REPLACE FUNCTION public.check_and_update_otp_cooldown(
    p_phone TEXT, 
    p_cooldown_seconds INT,
    p_max_requests INT DEFAULT 5,
    p_window_minutes INT DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
    v_last_sent TIMESTAMPTZ;
    v_window_start TIMESTAMPTZ;
    v_count INT;
BEGIN
    SELECT last_otp_sent_at, window_start_time, otp_request_count 
    INTO v_last_sent, v_window_start, v_count
    FROM public.otp_requests
    WHERE phone = p_phone;

    -- If record exists
    IF v_last_sent IS NOT NULL THEN
        -- 1. Check 30-second strict cooldown
        IF (NOW() - v_last_sent) < (p_cooldown_seconds * INTERVAL '1 second') THEN
            RETURN FALSE; -- 30-second cooldown active, reject
        END IF;

        -- 2. Check 15-minute window limit
        IF (NOW() - v_window_start) < (p_window_minutes * INTERVAL '1 minute') THEN
            IF v_count >= p_max_requests THEN
                RETURN FALSE; -- 5 requests within 15 minutes limit reached, reject
            END IF;
            
            -- Increment count within the window
            UPDATE public.otp_requests 
            SET last_otp_sent_at = NOW(),
                otp_request_count = v_count + 1
            WHERE phone = p_phone;
            
            RETURN TRUE;
        ELSE
            -- Window expired, reset window and count
            UPDATE public.otp_requests 
            SET last_otp_sent_at = NOW(),
                window_start_time = NOW(),
                otp_request_count = 1
            WHERE phone = p_phone;
            
            RETURN TRUE;
        END IF;
    END IF;

    -- New record
    INSERT INTO public.otp_requests (phone, last_otp_sent_at, window_start_time, otp_request_count)
    VALUES (p_phone, NOW(), NOW(), 1);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure the new function
REVOKE EXECUTE ON FUNCTION public.check_and_update_otp_cooldown(TEXT, INT, INT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_and_update_otp_cooldown(TEXT, INT, INT, INT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_update_otp_cooldown(TEXT, INT, INT, INT) TO service_role;
