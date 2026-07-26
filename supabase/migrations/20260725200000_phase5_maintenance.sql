-- ==============================================================================
-- Phase 5: Database Maintenance, Security Auditing & Cleanup
-- ==============================================================================

-- 1. Create composite index for optimized dashboard queries
CREATE INDEX IF NOT EXISTS idx_transactions_business_created_paid 
ON public.transactions (business_id, created_at, final_paid);

-- 2. Create function to purge expired OTP rate limits
CREATE OR REPLACE FUNCTION public.purge_expired_otp_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_rate_limits
  WHERE created_at < (NOW() - INTERVAL '15 minutes');
END;
$$;
