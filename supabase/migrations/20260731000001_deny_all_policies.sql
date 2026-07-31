-- Migration: 20260731000001_deny_all_policies.sql
-- Description: Add explicit deny-all policies to resolve 'RLS Enabled No Policy' linter warnings.

-- By explicitly denying all access, we satisfy the linter while maintaining the intended security model 
-- where these tables are only accessed via SECURITY DEFINER functions or the service role.

CREATE POLICY "Deny all public access"
  ON public.otp_requests
  FOR ALL
  USING (false);

CREATE POLICY "Deny all public access"
  ON public.rate_limits
  FOR ALL
  USING (false);
