-- Migration: 20260802000000_performance_remediation.sql
-- Description: Fix database query bottlenecks, correlated subqueries, and staff role KPI access

-- 1. Fix get_today_kpis RPC: Use public.auth_business_id() instead of restricting to role = 'owner'
CREATE OR REPLACE FUNCTION public.get_today_kpis(p_start_time timestamptz)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'todayRevenuePaise', COALESCE(SUM(t.final_paid), 0),
    'todayTransactions', COUNT(t.id),
    'todayCustomers', COUNT(DISTINCT t.customer_id),
    'todayRewardsRedeemedPaise', COALESCE(SUM(t.reward_used), 0)
  )
  FROM public.transactions t
  WHERE t.business_id = public.auth_business_id()
    AND t.created_at >= p_start_time;
$$;

REVOKE ALL ON FUNCTION public.get_today_kpis(timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_today_kpis(timestamptz) TO authenticated;


-- 2. Optimize get_insights_top_customers: Replace correlated scalar subquery with explicit JOIN + GROUP BY
CREATE OR REPLACE FUNCTION public.get_insights_top_customers()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'phone', phone,
      'totalVisits', total_visits,
      'totalSpentPaise', total_spent
    )
  ), '[]'::jsonb)
  FROM (
    SELECT
      c.id,
      c.name,
      c.phone,
      c.total_visits,
      COALESCE(SUM(t.final_paid), 0) as total_spent
    FROM public.customers c
    LEFT JOIN public.transactions t ON t.customer_id = c.id AND t.business_id = c.business_id
    WHERE c.business_id = public.auth_business_id()
    GROUP BY c.id, c.name, c.phone, c.total_visits
    ORDER BY c.total_visits DESC, total_spent DESC
    LIMIT 5
  ) sub;
$$;

REVOKE ALL ON FUNCTION public.get_insights_top_customers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_insights_top_customers() TO authenticated;


-- 3. Optimize get_insights_top_services: Group by catalog_item_id FK rather than raw text string
CREATE OR REPLACE FUNCTION public.get_insights_top_services()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', item_name,
      'catalogItemId', catalog_item_id,
      'totalQuantity', total_qty,
      'totalRevenuePaise', total_rev
    )
  ), '[]'::jsonb)
  FROM (
    SELECT
      catalog_item_id,
      MAX(item_name) as item_name,
      SUM(quantity) as total_qty,
      SUM(total_price) as total_rev
    FROM public.transaction_items
    WHERE business_id = public.auth_business_id()
      AND catalog_item_id IS NOT NULL
    GROUP BY catalog_item_id
    ORDER BY total_qty DESC
    LIMIT 5
  ) t;
$$;

REVOKE ALL ON FUNCTION public.get_insights_top_services() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_insights_top_services() TO authenticated;
