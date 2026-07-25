-- Enable RLS on otp_rate_limits to fix security audit finding
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Note: No policies are created intentionally.
-- This table is managed exclusively via the check_and_update_otp_cooldown RPC 
-- (which runs as SECURITY DEFINER) or by the service_role key.
-- All client access will be denied by default, which is the desired behavior.
