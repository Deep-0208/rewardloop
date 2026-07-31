-- Migration: 20260730000000_security_hardening.sql
-- Description: Hardens RPC permissions and restores complete_visit auth checks.

-- 1. Restore authentication and ownership checks to complete_visit
CREATE OR REPLACE FUNCTION public.complete_visit(
  p_idempotency_key UUID,
  p_customer_id UUID,
  p_items JSONB,
  p_reward_applied INTEGER,
  p_payment_method TEXT,
  p_otp_verified_token UUID,
  p_business_id UUID,
  p_created_by UUID
)
RETURNS TABLE (
  transaction_id UUID,
  subtotal INTEGER,
  reward_used INTEGER,
  reward_earned INTEGER,
  final_paid INTEGER,
  new_wallet_balance INTEGER,
  duplicate BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_idempotency public.idempotency_keys%ROWTYPE;
  v_wallet public.reward_wallets%ROWTYPE;
  v_reward_percentage SMALLINT;
  v_max_redeem_percentage SMALLINT;
  v_subtotal INTEGER;
  v_max_redeem INTEGER;
  v_final_paid INTEGER;
  v_reward_earned INTEGER;
  v_new_wallet_balance INTEGER;
  v_transaction_id UUID;
  v_item_count INTEGER;
  v_catalog_count INTEGER;
  v_otp public.otp_requests%ROWTYPE;
BEGIN
  -- Security Hardening: Validate authentication and business ownership
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; 
  END IF;
  
  PERFORM 1 FROM public.users 
  WHERE business_id = p_business_id 
    AND auth_user_id = auth.uid() 
    AND role = 'owner';
    
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Not authorized for this business' USING ERRCODE = '42501'; 
  END IF;

  -- End Security Hardening

  IF p_reward_applied < 0 THEN
    RAISE EXCEPTION 'Reward applied cannot be negative' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one item is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_idempotency
  FROM public.idempotency_keys
  WHERE key = p_idempotency_key
  FOR UPDATE;

  IF FOUND AND v_idempotency.transaction_id IS NOT NULL THEN
    RETURN QUERY
    SELECT t.id, t.subtotal, t.reward_used, t.reward_earned, t.final_paid,
           w.current_balance, true
    FROM public.transactions t
    JOIN public.reward_wallets w
      ON w.customer_id = t.customer_id AND w.business_id = t.business_id
    WHERE t.id = v_idempotency.transaction_id;
    RETURN;
  END IF;

  IF NOT FOUND THEN
    INSERT INTO public.idempotency_keys (key, business_id, customer_id)
    VALUES (p_idempotency_key, p_business_id, p_customer_id)
    ON CONFLICT (key) DO NOTHING;

    SELECT * INTO v_idempotency
    FROM public.idempotency_keys
    WHERE key = p_idempotency_key
    FOR UPDATE;

    IF v_idempotency.transaction_id IS NOT NULL THEN
      RETURN QUERY
      SELECT t.id, t.subtotal, t.reward_used, t.reward_earned, t.final_paid,
             w.current_balance, true
      FROM public.transactions t
      JOIN public.reward_wallets w
        ON w.customer_id = t.customer_id AND w.business_id = t.business_id
      WHERE t.id = v_idempotency.transaction_id;
      RETURN;
    END IF;
  END IF;

  PERFORM 1 FROM public.customers
  WHERE id = p_customer_id AND business_id = p_business_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found for business' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_wallet
  FROM public.reward_wallets
  WHERE customer_id = p_customer_id AND business_id = p_business_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward wallet not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT reward_percentage, max_redeem_percentage
  INTO v_reward_percentage, v_max_redeem_percentage
  FROM public.reward_rules
  WHERE business_id = p_business_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward rules not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT count(*) INTO v_item_count
  FROM jsonb_to_recordset(p_items) AS input(catalog_item_id UUID, quantity INTEGER);
  SELECT count(*) INTO v_catalog_count
  FROM jsonb_to_recordset(p_items) AS input(catalog_item_id UUID, quantity INTEGER)
  JOIN public.catalog_items ci
    ON ci.id = input.catalog_item_id
   AND ci.business_id = p_business_id
   AND ci.status = 'active'
  WHERE input.quantity >= 1 AND input.quantity <= 99;
  IF v_item_count <> v_catalog_count THEN
    RAISE EXCEPTION 'One or more catalog items are invalid' USING ERRCODE = 'P0002';
  END IF;

  SELECT COALESCE(sum(ci.price * input.quantity), 0)::INTEGER
  INTO v_subtotal
  FROM jsonb_to_recordset(p_items) AS input(catalog_item_id UUID, quantity INTEGER)
  JOIN public.catalog_items ci ON ci.id = input.catalog_item_id;

  v_max_redeem := LEAST(
    v_wallet.current_balance,
    floor((v_subtotal::NUMERIC * v_max_redeem_percentage) / 100)::INTEGER
  );
  IF p_reward_applied > v_max_redeem OR p_reward_applied > v_wallet.current_balance THEN
    RAISE EXCEPTION 'Reward exceeds available balance or redeem limit' USING ERRCODE = '22023';
  END IF;
  IF p_reward_applied > 0 AND p_reward_applied < 100 THEN
    RAISE EXCEPTION 'Minimum redemption is 100 paise' USING ERRCODE = '22023';
  END IF;

  v_final_paid := v_subtotal - p_reward_applied;
  
  -- RR-03 Fix
  v_reward_earned := floor((v_final_paid::NUMERIC * v_reward_percentage + 50) / 100)::INTEGER;
  
  v_new_wallet_balance := v_wallet.current_balance - p_reward_applied + v_reward_earned;
  IF v_final_paid < 0 OR v_new_wallet_balance < 0 THEN
    RAISE EXCEPTION 'Invalid financial totals' USING ERRCODE = '22003';
  END IF;

  IF v_final_paid = 0 AND p_payment_method <> 'none' THEN
    RAISE EXCEPTION 'Zero-value visits require payment method none' USING ERRCODE = '22023';
  ELSIF v_final_paid > 0 AND p_payment_method NOT IN ('cash', 'online') THEN
    RAISE EXCEPTION 'A cash or online payment method is required' USING ERRCODE = '22023';
  END IF;

  IF p_reward_applied > 0 THEN
    IF p_otp_verified_token IS NULL THEN
      RAISE EXCEPTION 'OTP verification is required' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO v_otp
    FROM public.otp_requests
    WHERE id = p_otp_verified_token
      AND business_id = p_business_id
      AND purpose = 'reward_redemption'
      AND verified_at IS NOT NULL
      AND expires_at > now()
      AND invalidated = false
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'OTP verification is invalid or expired' USING ERRCODE = '22023';
    END IF;
    
    -- RR-06 Fix
    IF v_otp.reward_amount_paise IS NOT NULL AND v_otp.reward_amount_paise <> p_reward_applied THEN
      RAISE EXCEPTION 'OTP verified amount does not match requested reward' USING ERRCODE = '22023';
    END IF;
    
    UPDATE public.otp_requests SET invalidated = true WHERE id = v_otp.id;
  END IF;

  INSERT INTO public.transactions (
    idempotency_key, business_id, customer_id, created_by, subtotal,
    reward_used, reward_earned, final_paid, payment_method,
    reward_percentage_applied, max_redeem_percentage_applied, edited_until
  ) VALUES (
    p_idempotency_key, p_business_id, p_customer_id, p_created_by, v_subtotal,
    p_reward_applied, v_reward_earned, v_final_paid, p_payment_method::public.payment_method_enum,
    v_reward_percentage, v_max_redeem_percentage, now() + interval '5 minutes'
  ) RETURNING id INTO v_transaction_id;

  INSERT INTO public.transaction_items (
    transaction_id, business_id, catalog_item_id, item_name, catalog_item_type, quantity, unit_price, total_price
  )
  SELECT
    v_transaction_id, p_business_id, ci.id, ci.name, ci.type, input.quantity,
    ci.price, ci.price * input.quantity
  FROM jsonb_to_recordset(p_items) AS input(catalog_item_id UUID, quantity INTEGER)
  JOIN public.catalog_items ci ON ci.id = input.catalog_item_id;

  IF p_reward_applied > 0 THEN
    INSERT INTO public.reward_ledger (wallet_id, business_id, transaction_id, type, amount, balance_after)
    VALUES (v_wallet.id, p_business_id, v_transaction_id, 'redeemed', p_reward_applied,
            v_wallet.current_balance - p_reward_applied);
  END IF;
  IF v_reward_earned > 0 THEN
    INSERT INTO public.reward_ledger (wallet_id, business_id, transaction_id, type, amount, balance_after)
    VALUES (v_wallet.id, p_business_id, v_transaction_id, 'earned', v_reward_earned,
            v_new_wallet_balance);
  END IF;

  UPDATE public.reward_wallets
  SET current_balance = v_new_wallet_balance, updated_at = now()
  WHERE id = v_wallet.id;
  UPDATE public.customers
  SET total_visits = total_visits + 1, last_visit_at = now(), updated_at = now()
  WHERE id = p_customer_id;
  UPDATE public.idempotency_keys
  SET transaction_id = v_transaction_id
  WHERE key = p_idempotency_key;

  INSERT INTO public.audit_logs (business_id, user_id, event, entity, entity_id, new_value)
  VALUES (
    p_business_id, p_created_by, 'TRANSACTION_CREATED', 'transactions', v_transaction_id,
    jsonb_build_object('final_paid', v_final_paid, 'reward_used', p_reward_applied)
  );

  RETURN QUERY SELECT v_transaction_id, v_subtotal, p_reward_applied,
                      v_reward_earned, v_final_paid, v_new_wallet_balance, false;
END;
$$;


-- 2. Revoke PUBLIC access from all custom functions to prevent anon attacks
REVOKE ALL ON FUNCTION public.complete_visit FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_business_flow FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_customer_with_wallet FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_today_kpis FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_user_session FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_expired_rate_limits FROM PUBLIC;

-- Clean up orphaned function if it exists
DROP FUNCTION IF EXISTS public.purge_expired_otp_rate_limits;


-- 3. Explicitly grant EXECUTE only to intended roles
-- Admin actions (Service Role Only)
GRANT EXECUTE ON FUNCTION public.verify_user_session TO service_role;
GRANT EXECUTE ON FUNCTION public.create_business_flow TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_expired_rate_limits TO service_role;
GRANT EXECUTE ON FUNCTION public.check_and_update_otp_cooldown TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_session_version TO service_role;

-- Client-facing actions (Authenticated Users Only)
GRANT EXECUTE ON FUNCTION public.complete_visit TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_with_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_today_kpis TO authenticated;
-- (get_lifetime_revenue and update_transaction_payment_method were already granted securely, but we'll re-ensure)
GRANT EXECUTE ON FUNCTION public.get_lifetime_revenue TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_transaction_payment_method TO authenticated;
