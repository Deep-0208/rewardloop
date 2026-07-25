-- Complete Visit Transaction
--
-- A single SECURITY DEFINER RPC owns all financial writes. It recalculates
-- catalog prices and reward totals from the database; client totals are never
-- accepted as financial truth.

-- Preserve the existing login OTP cooldown mechanism while adding the
-- normalized reward-redemption request history required by the API contract.
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  phone TEXT PRIMARY KEY,
  last_otp_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  otp_request_count INTEGER NOT NULL DEFAULT 1 CHECK (otp_request_count >= 0)
);

ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS otp_hash TEXT;
ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0);
ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS max_attempts SMALLINT NOT NULL DEFAULT 3 CHECK (max_attempts > 0);
ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS invalidated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS window_start_time TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS last_otp_sent_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.otp_requests ADD COLUMN IF NOT EXISTS otp_request_count INTEGER NOT NULL DEFAULT 1 CHECK (otp_request_count >= 0);

-- Move legacy auth cooldown state out of otp_requests before normalizing it.
INSERT INTO public.otp_rate_limits (phone, last_otp_sent_at, window_start_time, otp_request_count)
SELECT phone, last_otp_sent_at, window_start_time, otp_request_count
FROM public.otp_requests
ON CONFLICT (phone) DO UPDATE SET
  last_otp_sent_at = EXCLUDED.last_otp_sent_at,
  window_start_time = EXCLUDED.window_start_time,
  otp_request_count = EXCLUDED.otp_request_count;

UPDATE public.otp_requests
SET
  id = COALESCE(id, gen_random_uuid()),
  purpose = COALESCE(purpose, 'login'),
  otp_hash = COALESCE(otp_hash, '$2a$10$invalidlegacyotprecord0000000000000000000000000000000000000'),
  expires_at = COALESCE(expires_at, now() - interval '1 second'),
  invalidated = CASE WHEN otp_hash IS NULL THEN true ELSE invalidated END;

DO $$
DECLARE
  key_name TEXT;
BEGIN
  SELECT conname INTO key_name
  FROM pg_constraint
  WHERE conrelid = 'public.otp_requests'::regclass
    AND contype = 'p';

  IF key_name IS NOT NULL AND key_name <> 'otp_requests_pkey' THEN
    EXECUTE format('ALTER TABLE public.otp_requests DROP CONSTRAINT %I', key_name);
  ELSIF key_name = 'otp_requests_pkey' THEN
    EXECUTE 'ALTER TABLE public.otp_requests DROP CONSTRAINT otp_requests_pkey';
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

ALTER TABLE public.otp_requests ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.otp_requests ALTER COLUMN purpose SET NOT NULL;
ALTER TABLE public.otp_requests ALTER COLUMN otp_hash SET NOT NULL;
ALTER TABLE public.otp_requests ALTER COLUMN expires_at SET NOT NULL;
ALTER TABLE public.otp_requests ADD PRIMARY KEY (id);
CREATE INDEX IF NOT EXISTS idx_reward_otp_lookup
  ON public.otp_requests (business_id, phone, purpose, created_at DESC)
  WHERE invalidated = false;

-- Auth login OTP rate limiting uses the dedicated compatibility table.
CREATE OR REPLACE FUNCTION public.check_and_update_otp_cooldown(
  p_phone TEXT,
  p_cooldown_seconds INTEGER,
  p_max_requests INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit public.otp_rate_limits%ROWTYPE;
BEGIN
  SELECT * INTO v_limit FROM public.otp_rate_limits WHERE phone = p_phone FOR UPDATE;
  IF FOUND THEN
    IF now() - v_limit.last_otp_sent_at < p_cooldown_seconds * interval '1 second' THEN
      RETURN false;
    END IF;
    IF now() - v_limit.window_start_time < p_window_minutes * interval '1 minute'
       AND v_limit.otp_request_count >= p_max_requests THEN
      RETURN false;
    END IF;

    UPDATE public.otp_rate_limits
    SET
      last_otp_sent_at = now(),
      window_start_time = CASE
        WHEN now() - v_limit.window_start_time >= p_window_minutes * interval '1 minute' THEN now()
        ELSE v_limit.window_start_time
      END,
      otp_request_count = CASE
        WHEN now() - v_limit.window_start_time >= p_window_minutes * interval '1 minute' THEN 1
        ELSE v_limit.otp_request_count + 1
      END
    WHERE phone = p_phone;
    RETURN true;
  END IF;

  INSERT INTO public.otp_rate_limits (phone) VALUES (p_phone);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_update_otp_cooldown(TEXT, INTEGER, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_and_update_otp_cooldown(TEXT, INTEGER, INTEGER, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_update_otp_cooldown(TEXT, INTEGER, INTEGER, INTEGER) TO service_role;

-- Atomic transaction, item snapshots, reward ledger, wallet, customer stats,
-- and idempotency handling. Any exception rolls back the entire RPC call.
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
  v_reward_earned := round((v_final_paid::NUMERIC * v_reward_percentage) / 100)::INTEGER;
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
    transaction_id, business_id, catalog_item_id, item_name, quantity, unit_price, total_price
  )
  SELECT
    v_transaction_id, p_business_id, ci.id, ci.name, input.quantity,
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

REVOKE ALL ON FUNCTION public.complete_visit(UUID, UUID, JSONB, INTEGER, TEXT, UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_visit(UUID, UUID, JSONB, INTEGER, TEXT, UUID, UUID, UUID) TO authenticated;
