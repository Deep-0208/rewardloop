-- Get Lifetime Revenue RPC
--
-- Calculates the total lifetime revenue securely in the database.
-- Eliminates the memory leak risk of pulling all transactions into Node.js.
-- Relies on RLS (Security Invoker) to filter transactions automatically.

DROP FUNCTION IF EXISTS public.get_lifetime_revenue(UUID);

CREATE OR REPLACE FUNCTION public.get_lifetime_revenue()
RETURNS INTEGER
LANGUAGE sql
AS $$
  SELECT COALESCE(SUM(final_paid), 0)::INTEGER FROM public.transactions;
$$;

-- Secure execution
REVOKE ALL ON FUNCTION public.get_lifetime_revenue() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lifetime_revenue() TO authenticated;

