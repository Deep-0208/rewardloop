-- Migration: 20260801000000_production_remediation.sql
-- Description: Complete Production Database Architecture Remediation (P0, P1, P2, P3 Audit Remediation)

-- ==============================================================================
-- 1. P0-01 SECURITY: Secure create_business_flow RPC with caller identity verification
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_business_flow(
  p_auth_user_id UUID,
  p_name TEXT,
  p_type TEXT,
  p_reward_pct SMALLINT,
  p_max_redeem_pct SMALLINT,
  p_services JSONB,
  p_products JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_business_id UUID;
  v_onboarding_status VARCHAR;
  v_catalog_id UUID;
  v_index INT;
  v_item JSONB;
BEGIN
  -- Strict caller identity validation
  IF auth.uid() IS NULL OR auth.uid() <> p_auth_user_id THEN
    RAISE EXCEPTION 'Not authorized to create business for target user' USING ERRCODE = '42501';
  END IF;

  -- Row-level locking to prevent race conditions
  SELECT id, business_id, onboarding_status INTO v_user_id, v_business_id, v_onboarding_status
  FROM public.users WHERE auth_user_id = p_auth_user_id FOR UPDATE;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'USER_NOT_FOUND', 'message', 'User not found');
  END IF;
  
  -- IDEMPOTENCY: Safely return if already processed
  IF v_business_id IS NOT NULL THEN
    UPDATE public.users SET onboarding_status = 'COMPLETED' WHERE id = v_user_id AND onboarding_status != 'COMPLETED';
    RETURN jsonb_build_object('success', true, 'code', 'ALREADY_EXISTS', 'message', 'Business already created', 'business_id', v_business_id);
  END IF;
  
  -- 1. Create business
  INSERT INTO public.businesses (name, business_type, status)
  VALUES (p_name, p_type::public.business_type_enum, 'active')
  RETURNING id INTO v_business_id;
  
  -- 2. Update user state machine
  UPDATE public.users 
  SET business_id = v_business_id, onboarding_status = 'COMPLETED', role = 'owner', updated_at = now()
  WHERE id = v_user_id;
  
  -- 3. Reward rules
  INSERT INTO public.reward_rules (business_id, reward_percentage, max_redeem_percentage, created_by)
  VALUES (v_business_id, p_reward_pct, p_max_redeem_pct, v_user_id);
  
  -- 4. Catalogs
  INSERT INTO public.catalogs (business_id)
  VALUES (v_business_id)
  RETURNING id INTO v_catalog_id;
  
  -- 5. Items (Services & Products)
  v_index := 0;
  IF jsonb_typeof(p_services) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_services) LOOP
      INSERT INTO public.catalog_items (catalog_id, business_id, name, price, type, status, sort_order, created_by)
      VALUES (v_catalog_id, v_business_id, v_item->>'name', (v_item->>'price')::bigint, 'service', 'active', v_index, v_user_id);
      v_index := v_index + 1;
    END LOOP;
  END IF;

  IF jsonb_typeof(p_products) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_products) LOOP
      INSERT INTO public.catalog_items (catalog_id, business_id, name, price, type, status, sort_order, created_by)
      VALUES (v_catalog_id, v_business_id, v_item->>'name', (v_item->>'price')::bigint, 'product', 'active', v_index, v_user_id);
      v_index := v_index + 1;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'code', 'SUCCESS', 'message', 'Business created successfully', 'business_id', v_business_id);
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- Grant EXECUTE to authenticated users safely now that identity check is enforced
REVOKE ALL ON FUNCTION public.create_business_flow(uuid, text, text, smallint, smallint, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_business_flow(uuid, text, text, smallint, smallint, jsonb, jsonb) TO authenticated;


-- ==============================================================================
-- 2. P0-02 INTEGRITY: Soft-deleted customers partial index fix
-- ==============================================================================
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_business_phone_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_active_phone ON public.customers(business_id, phone) WHERE deleted_at IS NULL;


-- ==============================================================================
-- 3. P1-01 MONETARY PRECISION: Upgrade monetary columns from INTEGER (32-bit) to BIGINT (64-bit)
-- ==============================================================================
ALTER TABLE public.catalog_items 
  ALTER COLUMN price TYPE BIGINT;

ALTER TABLE public.transactions 
  ALTER COLUMN subtotal TYPE BIGINT,
  ALTER COLUMN final_paid TYPE BIGINT,
  ALTER COLUMN reward_used TYPE BIGINT,
  ALTER COLUMN reward_earned TYPE BIGINT;

ALTER TABLE public.transaction_items 
  ALTER COLUMN unit_price TYPE BIGINT,
  ALTER COLUMN total_price TYPE BIGINT;

ALTER TABLE public.reward_ledger 
  ALTER COLUMN amount TYPE BIGINT,
  ALTER COLUMN balance_after TYPE BIGINT;

ALTER TABLE public.reward_wallets 
  ALTER COLUMN current_balance TYPE BIGINT;

ALTER TABLE public.otp_requests 
  ALTER COLUMN reward_amount_paise TYPE BIGINT;


-- ==============================================================================
-- 4. P1-02 INTEGRITY: Composite Foreign Key on reward_wallets to prevent orphan records
-- ==============================================================================
ALTER TABLE public.customers ADD CONSTRAINT customers_id_business_id_key UNIQUE (id, business_id);

ALTER TABLE public.reward_wallets DROP CONSTRAINT IF EXISTS reward_wallets_customer_business_fk;
ALTER TABLE public.reward_wallets 
  ADD CONSTRAINT reward_wallets_customer_business_fk 
  FOREIGN KEY (customer_id, business_id) REFERENCES public.customers(id, business_id) ON DELETE RESTRICT;


-- ==============================================================================
-- 5. P1-03 MULTI-TENANCY: Deterministic ordering in auth_business_id()
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.auth_business_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.users
  WHERE auth_user_id = (SELECT auth.uid())
  AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
$$;


-- ==============================================================================
-- 6. P2-01 AUDITABILITY: Automatic updated_at trigger function & table bindings
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_businesses_updated_at ON public.businesses;
CREATE TRIGGER trg_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_catalogs_updated_at ON public.catalogs;
CREATE TRIGGER trg_catalogs_updated_at BEFORE UPDATE ON public.catalogs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_catalog_items_updated_at ON public.catalog_items;
CREATE TRIGGER trg_catalog_items_updated_at BEFORE UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_reward_rules_updated_at ON public.reward_rules;
CREATE TRIGGER trg_reward_rules_updated_at BEFORE UPDATE ON public.reward_rules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_reward_wallets_updated_at ON public.reward_wallets;
CREATE TRIGGER trg_reward_wallets_updated_at BEFORE UPDATE ON public.reward_wallets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 7. P2-02 INTEGRITY: Check constraint on transactions financial equation
-- ==============================================================================
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS chk_transaction_financial_balance;
ALTER TABLE public.transactions ADD CONSTRAINT chk_transaction_financial_balance CHECK (final_paid = subtotal - reward_used);


-- ==============================================================================
-- 8. P2-03 ROLE SCOPING: Update complete_visit to allow any active business staff
DROP FUNCTION IF EXISTS public.complete_visit(uuid, uuid, jsonb, integer, text, uuid, uuid, uuid);

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
  subtotal BIGINT,
  reward_used BIGINT,
  reward_earned BIGINT,
  final_paid BIGINT,
  new_wallet_balance BIGINT,
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
  v_subtotal BIGINT;
  v_max_redeem BIGINT;
  v_final_paid BIGINT;
  v_reward_earned BIGINT;
  v_new_wallet_balance BIGINT;
  v_transaction_id UUID;
  v_item_count INTEGER;
  v_catalog_count INTEGER;
  v_otp public.otp_requests%ROWTYPE;
BEGIN
  -- Security Hardening: Validate authentication and active business membership
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; 
  END IF;
  
  PERFORM 1 FROM public.users 
  WHERE business_id = p_business_id 
    AND auth_user_id = auth.uid() 
    AND status = 'active';
    
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Not authorized for this business' USING ERRCODE = '42501'; 
  END IF;

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
  WHERE id = p_customer_id AND business_id = p_business_id AND deleted_at IS NULL;
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

  SELECT COALESCE(sum(ci.price * input.quantity), 0)::BIGINT
  INTO v_subtotal
  FROM jsonb_to_recordset(p_items) AS input(catalog_item_id UUID, quantity INTEGER)
  JOIN public.catalog_items ci ON ci.id = input.catalog_item_id;

  v_max_redeem := LEAST(
    v_wallet.current_balance,
    floor((v_subtotal::NUMERIC * v_max_redeem_percentage) / 100)::BIGINT
  );
  IF p_reward_applied > v_max_redeem OR p_reward_applied > v_wallet.current_balance THEN
    RAISE EXCEPTION 'Reward exceeds available balance or redeem limit' USING ERRCODE = '22023';
  END IF;
  IF p_reward_applied > 0 AND p_reward_applied < 100 THEN
    RAISE EXCEPTION 'Minimum redemption is 100 paise' USING ERRCODE = '22023';
  END IF;

  v_final_paid := v_subtotal - p_reward_applied;
  
  -- Rounding half-up integer formula
  v_reward_earned := floor((v_final_paid::NUMERIC * v_reward_percentage + 50) / 100)::BIGINT;
  
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


-- ==============================================================================
-- 9. P2-04 INSIGHTS PERFORMANCE: Composite index and top customer RPC filtering
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_business_visits ON public.customers(business_id, total_visits DESC);

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
      AND c.deleted_at IS NULL
    ORDER BY c.total_visits DESC
    LIMIT 5
  ) sub;
$$;


-- ==============================================================================
-- 10. P3 MAINTENANCE: Purge expired rate limits, old idempotency keys, and OTPs
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.purge_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE last_request_at < (now() - interval '24 hours');

  DELETE FROM public.idempotency_keys
  WHERE created_at < (now() - interval '24 hours');

  DELETE FROM public.otp_requests
  WHERE expires_at < (now() - interval '24 hours');
END;
$$;

-- ==============================================================================
-- 11. P2-01 PERFORMANCE: Add missing indexes on foreign keys
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_transaction_items_catalog_item ON public.transaction_items(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_otp_requests_business_id ON public.otp_requests(business_id);
