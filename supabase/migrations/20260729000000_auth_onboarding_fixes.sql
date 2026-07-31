-- Migration: 20260729000000_auth_onboarding_fixes.sql
-- 1. Add Explicit State Machine & Audit Columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Add check constraint for state machine
ALTER TABLE public.users
ADD CONSTRAINT chk_onboarding_status 
CHECK (onboarding_status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'));

-- 2. Verify User Session RPC
CREATE OR REPLACE FUNCTION verify_user_session(p_auth_user_id UUID, p_phone VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_business_id UUID;
  v_session_version INT;
  v_is_new_user BOOLEAN := FALSE;
  v_onboarding_status VARCHAR;
  v_role VARCHAR;
  v_status VARCHAR;
BEGIN
  -- Row-level locking to prevent race conditions
  SELECT id, business_id, session_version, onboarding_status, role, status
  INTO v_user_id, v_business_id, v_session_version, v_onboarding_status, v_role, v_status
  FROM public.users WHERE auth_user_id = p_auth_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    v_is_new_user := TRUE;
    v_session_version := 1;
    v_onboarding_status := 'NOT_STARTED';
    v_role := 'owner';
    
    INSERT INTO public.users (auth_user_id, phone, role, status, session_version, onboarding_status, last_login_at)
    VALUES (p_auth_user_id, p_phone, 'owner', 'active', 1, 'NOT_STARTED', now())
    RETURNING id INTO v_user_id;
  ELSE
    IF v_status = 'suspended' THEN
      RETURN jsonb_build_object('success', false, 'code', 'ACCOUNT_SUSPENDED', 'message', 'Account suspended');
    END IF;
    
    UPDATE public.users 
    SET session_version = session_version + 1,
        last_login_at = now(),
        updated_at = now()
    WHERE id = v_user_id
    RETURNING session_version INTO v_session_version;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'code', 'SUCCESS',
    'data', jsonb_build_object(
      'user_id', v_user_id,
      'business_id', v_business_id,
      'session_version', v_session_version,
      'is_new_user', v_is_new_user,
      'onboarding_status', v_onboarding_status,
      'role', v_role
    )
  );
END;
$$;

-- 3. Create Business Flow RPC
CREATE OR REPLACE FUNCTION create_business_flow(
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
AS $$
DECLARE
  v_user_id UUID;
  v_business_id UUID;
  v_onboarding_status VARCHAR;
  v_catalog_id UUID;
  v_index INT;
  v_item JSONB;
BEGIN
  -- Strict Foreign Key resolution internally
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
  VALUES (p_name, p_type, 'active')
  RETURNING id INTO v_business_id;
  
  -- 2. Update user state machine
  UPDATE public.users 
  SET business_id = v_business_id, onboarding_status = 'COMPLETED', role = 'owner', updated_at = now()
  WHERE id = v_user_id;
  
  -- 3. Reward rules (safely using internal UUID)
  INSERT INTO public.reward_rules (business_id, reward_percentage, max_redeem_percentage, created_by)
  VALUES (v_business_id, p_reward_pct, p_max_redeem_pct, v_user_id);
  
  -- 4. Catalogs
  INSERT INTO public.catalogs (business_id, name)
  VALUES (v_business_id, 'Default Catalog')
  RETURNING id INTO v_catalog_id;
  
  -- 5. Items (Services & Products)
  v_index := 0;
  IF jsonb_typeof(p_services) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_services) LOOP
      INSERT INTO public.catalog_items (catalog_id, business_id, name, price, type, status, sort_order, created_by)
      VALUES (v_catalog_id, v_business_id, v_item->>'name', (v_item->>'price')::numeric, 'service', 'active', v_index, v_user_id);
      v_index := v_index + 1;
    END LOOP;
  END IF;

  IF jsonb_typeof(p_products) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_products) LOOP
      INSERT INTO public.catalog_items (catalog_id, business_id, name, price, type, status, sort_order, created_by)
      VALUES (v_catalog_id, v_business_id, v_item->>'name', (v_item->>'price')::numeric, 'product', 'active', v_index, v_user_id);
      v_index := v_index + 1;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'code', 'SUCCESS', 'message', 'Business created successfully', 'business_id', v_business_id);
EXCEPTION WHEN OTHERS THEN
  -- Let Postgres rollback everything securely
  RAISE;
END;
$$;
