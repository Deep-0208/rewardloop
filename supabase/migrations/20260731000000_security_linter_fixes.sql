-- Migration: 20260731000000_security_linter_fixes.sql
-- Description: DB Security Linter Fixes (search_path, role execution, RLS optims, duplicate indexes, fkey indexes)

-- ==========================================
-- 1. RLS INITIALIZATION PLAN OPTIMIZATIONS
-- ==========================================
-- Wrap auth.<function>() or custom security definer functions in a scalar subquery `(SELECT ...)`
-- Fix auth_business_id itself:
CREATE OR REPLACE FUNCTION public.auth_business_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.users
  WHERE auth_user_id = (SELECT auth.uid())
  AND status = 'active'
  LIMIT 1;
$$;

-- Fix users table policies:
DROP POLICY IF EXISTS users_select ON public.users;
CREATE POLICY users_select ON public.users FOR SELECT USING (business_id = (SELECT public.auth_business_id()));

DROP POLICY IF EXISTS users_update ON public.users;
CREATE POLICY users_update ON public.users FOR UPDATE USING (business_id = (SELECT public.auth_business_id()));

-- ==========================================
-- 2. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- ==========================================
-- catalog_items has redundant SELECT policies:
-- "Allow authenticated business catalog_items read" and "catalog_items_select"
-- We drop the redundant one that triggered the RLS initplan warning.
DROP POLICY IF EXISTS "Allow authenticated business catalog_items read" ON public.catalog_items;

-- Make sure catalog_items_select uses the scalar subquery as well
DROP POLICY IF EXISTS catalog_items_select ON public.catalog_items;
CREATE POLICY catalog_items_select ON public.catalog_items FOR SELECT USING (business_id = (SELECT public.auth_business_id()));


-- ==========================================
-- 3. FIX MUTABLE SEARCH PATHS
-- ==========================================
-- Set search_path = public for all flagged SECURITY DEFINER functions to prevent search path injection.
ALTER FUNCTION public.auth_business_id() SET search_path = public;
ALTER FUNCTION public.increment_session_version(uuid) SET search_path = public;
ALTER FUNCTION public.get_lifetime_revenue() SET search_path = public;
ALTER FUNCTION public.verify_user_session(uuid, varchar) SET search_path = public;
ALTER FUNCTION public.create_business_flow(uuid, text, text, smallint, smallint, jsonb, jsonb) SET search_path = public;
ALTER FUNCTION public.create_customer_with_wallet(text, text, uuid, uuid) SET search_path = public;
ALTER FUNCTION public.complete_visit(uuid, uuid, jsonb, integer, text, uuid, uuid, uuid) SET search_path = public;
ALTER FUNCTION public.get_today_kpis(timestamptz) SET search_path = public;
ALTER FUNCTION public.purge_expired_rate_limits() SET search_path = public;
ALTER FUNCTION public.update_transaction_payment_method(uuid, public.payment_method_enum) SET search_path = public;

-- ==========================================
-- 4. REVOKE UNINTENDED EXECUTIONS (anon & public)
-- ==========================================
-- Internal/System Functions (Revoke from public, anon, authenticated)
REVOKE EXECUTE ON FUNCTION public.auth_business_id() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_session_version(uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_expired_rate_limits() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_user_session(uuid, varchar) FROM public, anon, authenticated;

-- Authenticated Client API Functions (Revoke from public, anon; ensure authenticated can execute)
REVOKE EXECUTE ON FUNCTION public.complete_visit(uuid, uuid, jsonb, integer, text, uuid, uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.complete_visit(uuid, uuid, jsonb, integer, text, uuid, uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_business_flow(uuid, text, text, smallint, smallint, jsonb, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_business_flow(uuid, text, text, smallint, smallint, jsonb, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_customer_with_wallet(text, text, uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_customer_with_wallet(text, text, uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_lifetime_revenue() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_lifetime_revenue() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_today_kpis(timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_today_kpis(timestamptz) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_transaction_payment_method(uuid, public.payment_method_enum) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.update_transaction_payment_method(uuid, public.payment_method_enum) TO authenticated;

-- ==========================================
-- 5. DROP DUPLICATE INDEXES
-- ==========================================
-- The columns already have UNIQUE constraints, so these explicit indexes are redundant.
DROP INDEX IF EXISTS public.idx_customers_business_phone;
DROP INDEX IF EXISTS public.idx_idempotency_keys_key;
DROP INDEX IF EXISTS public.idx_reward_rules_business_id;
DROP INDEX IF EXISTS public.idx_reward_wallets_customer_business;
DROP INDEX IF EXISTS public.idx_transactions_idempotency_key;
DROP INDEX IF EXISTS public.idx_users_auth_user_id;

-- ==========================================
-- 6. ADD MISSING FOREIGN KEY INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_created_by ON public.catalog_items(created_by);
CREATE INDEX IF NOT EXISTS idx_catalog_items_updated_by ON public.catalog_items(updated_by);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_customer_id ON public.idempotency_keys(customer_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_transaction_id ON public.idempotency_keys(transaction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON public.notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_reward_rules_created_by ON public.reward_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_reward_rules_updated_by ON public.reward_rules(updated_by);
CREATE INDEX IF NOT EXISTS idx_transaction_items_catalog_item_id ON public.transaction_items(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions(created_by);
