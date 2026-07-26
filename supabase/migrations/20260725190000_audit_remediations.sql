-- DOWN MIGRATION (ROLLBACK INSTRUCTIONS):
-- To revert these changes, run the following:
-- DROP FUNCTION IF EXISTS public.update_transaction_payment_method;
-- DROP POLICY IF EXISTS users_update ON public.users;
-- CREATE POLICY users_update ON public.users FOR UPDATE USING (business_id = auth_business_id());
-- CREATE POLICY transactions_update ON public.transactions FOR UPDATE USING (business_id = auth_business_id() AND now() <= edited_until);

-- ==============================================================================
-- 1. Hardening Transactions Table RLS
-- ==============================================================================
DROP POLICY IF EXISTS transactions_update ON public.transactions;
-- (No new UPDATE policy is created, meaning client-side UPDATE is completely revoked)


-- ==============================================================================
-- 2. Hardening Users Table RLS
-- ==============================================================================
DROP POLICY IF EXISTS users_update ON public.users;
CREATE POLICY users_update ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());
  

-- ==============================================================================
-- 3. Dedicated RPC for updating payment method
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.update_transaction_payment_method(
  p_transaction_id UUID,
  p_payment_method public.payment_method_enum
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction public.transactions%ROWTYPE;
BEGIN
  -- Validate existence and business ownership
  SELECT * INTO v_transaction 
  FROM public.transactions 
  WHERE id = p_transaction_id 
    AND business_id = public.auth_business_id()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not owned by your business.' USING ERRCODE = 'P0002';
  END IF;

  -- Validate edit window
  IF now() > v_transaction.edited_until THEN
    RAISE EXCEPTION 'Transaction is past the 5-minute edit window.' USING ERRCODE = 'P0002';
  END IF;

  -- Validate allowed payment method logic (e.g. final_paid = 0 requires 'none')
  IF v_transaction.final_paid = 0 AND p_payment_method <> 'none' THEN
    RAISE EXCEPTION 'Zero-value visits require payment method none.' USING ERRCODE = '22023';
  END IF;
  
  IF v_transaction.final_paid > 0 AND p_payment_method NOT IN ('cash', 'online') THEN
    RAISE EXCEPTION 'A cash or online payment method is required for non-zero visits.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.transactions 
  SET payment_method = p_payment_method 
  WHERE id = p_transaction_id;

  -- Audit log
  INSERT INTO public.audit_logs (business_id, user_id, event, entity, entity_id, new_value)
  VALUES (
    v_transaction.business_id,
    (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1),
    'TRANSACTION_EDITED',
    'transactions',
    v_transaction.id,
    jsonb_build_object('payment_method', p_payment_method)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_transaction_payment_method(UUID, public.payment_method_enum) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_transaction_payment_method(UUID, public.payment_method_enum) TO authenticated;
