CREATE TABLE IF NOT EXISTS public.otp_requests (
    phone TEXT PRIMARY KEY,
    last_otp_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    otp_request_count INT NOT NULL DEFAULT 1
);

-- Allow service role to manage it
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;

-- Function to check and update OTP cooldown securely
CREATE OR REPLACE FUNCTION check_and_update_otp_cooldown(p_phone TEXT, p_cooldown_seconds INT)
RETURNS BOOLEAN AS $$
DECLARE
    v_last_sent TIMESTAMPTZ;
BEGIN
    SELECT last_otp_sent_at INTO v_last_sent
    FROM public.otp_requests
    WHERE phone = p_phone;

    IF v_last_sent IS NOT NULL AND (NOW() - v_last_sent) < (p_cooldown_seconds * INTERVAL '1 second') THEN
        RETURN FALSE; -- Cooldown active, reject
    END IF;

    -- Update or insert
    INSERT INTO public.otp_requests (phone, last_otp_sent_at, otp_request_count)
    VALUES (p_phone, NOW(), 1)
    ON CONFLICT (phone) DO UPDATE 
    SET last_otp_sent_at = NOW(),
        otp_request_count = public.otp_requests.otp_request_count + 1;

    RETURN TRUE; -- Success, allowed to send
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for atomic session version increment using auth_user_id
CREATE OR REPLACE FUNCTION increment_session_version(p_auth_user_id UUID) 
RETURNS INT AS $$
DECLARE
    new_version INT;
BEGIN
    UPDATE public.users
    SET session_version = COALESCE(session_version, 0) + 1
    WHERE auth_user_id = p_auth_user_id
    RETURNING session_version INTO new_version;
    
    RETURN new_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;