-- Migration: Fix insights performance
-- Replaces heavy client-side aggregate processing with fast in-database RPCs

CREATE OR REPLACE FUNCTION public.get_insights_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_revenue bigint;
  v_total_transactions bigint;
  v_total_customers bigint;
  v_total_earned bigint;
  v_total_redeemed bigint;
  v_avg_tx bigint;
BEGIN
  SELECT
    COALESCE(SUM(final_paid), 0),
    COUNT(id),
    COALESCE(SUM(reward_earned), 0),
    COALESCE(SUM(reward_used), 0)
  INTO
    v_total_revenue,
    v_total_transactions,
    v_total_earned,
    v_total_redeemed
  FROM public.transactions
  WHERE business_id = public.auth_business_id();

  SELECT COUNT(id)
  INTO v_total_customers
  FROM public.customers
  WHERE business_id = public.auth_business_id();

  IF v_total_transactions > 0 THEN
    v_avg_tx := ROUND(v_total_revenue::numeric / v_total_transactions);
  ELSE
    v_avg_tx := 0;
  END IF;

  RETURN jsonb_build_object(
    'totalRevenuePaise', v_total_revenue,
    'totalTransactions', v_total_transactions,
    'totalCustomers', v_total_customers,
    'totalRewardsEarnedPaise', v_total_earned,
    'totalRewardsRedeemedPaise', v_total_redeemed,
    'averageTransactionPaise', v_avg_tx
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_insights_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_insights_overview() TO authenticated;


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
      item_name,
      MIN(catalog_item_id::text)::uuid as catalog_item_id,
      SUM(quantity) as total_qty,
      SUM(total_price) as total_rev
    FROM public.transaction_items
    WHERE business_id = public.auth_business_id()
    GROUP BY item_name
    ORDER BY total_qty DESC
    LIMIT 5
  ) t;
$$;

REVOKE ALL ON FUNCTION public.get_insights_top_services() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_insights_top_services() TO authenticated;


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
      'totalSpentPaise', COALESCE(total_spent, 0)
    )
  ), '[]'::jsonb)
  FROM (
    SELECT
      c.id,
      c.name,
      c.phone,
      c.total_visits,
      (SELECT SUM(final_paid) FROM public.transactions t WHERE t.customer_id = c.id AND t.business_id = public.auth_business_id()) as total_spent
    FROM public.customers c
    WHERE c.business_id = public.auth_business_id()
    ORDER BY c.total_visits DESC
    LIMIT 5
  ) sub;
$$;

REVOKE ALL ON FUNCTION public.get_insights_top_customers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_insights_top_customers() TO authenticated;
