CREATE OR REPLACE FUNCTION public.get_today_kpis(p_start_time timestamptz)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'todayRevenuePaise', COALESCE(SUM(final_paid), 0),
    'todayTransactions', COUNT(id),
    'todayCustomers', COUNT(DISTINCT customer_id),
    'todayRewardsRedeemedPaise', COALESCE(SUM(reward_used), 0)
  )
  FROM public.transactions
  WHERE business_id = public.auth_business_id()
    AND created_at >= p_start_time;
$$;

REVOKE ALL ON FUNCTION public.get_today_kpis FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_today_kpis TO authenticated;
