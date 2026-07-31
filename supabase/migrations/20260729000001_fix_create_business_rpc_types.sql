-- Migration: 20260729000001_fix_create_business_rpc_types.sql
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
  VALUES (p_name, p_type::public.business_type_enum, 'active'::public.business_status_enum)
  RETURNING id INTO v_business_id;
  
  -- 2. Update user state machine
  UPDATE public.users 
  SET business_id = v_business_id, onboarding_status = 'COMPLETED', role = 'owner'::public.user_role_enum, updated_at = now()
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
      VALUES (v_catalog_id, v_business_id, v_item->>'name', (v_item->>'price')::numeric, 'service'::public.catalog_item_type_enum, 'active'::public.catalog_item_status_enum, v_index, v_user_id);
      v_index := v_index + 1;
    END LOOP;
  END IF;

  IF jsonb_typeof(p_products) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_products) LOOP
      INSERT INTO public.catalog_items (catalog_id, business_id, name, price, type, status, sort_order, created_by)
      VALUES (v_catalog_id, v_business_id, v_item->>'name', (v_item->>'price')::numeric, 'product'::public.catalog_item_type_enum, 'active'::public.catalog_item_status_enum, v_index, v_user_id);
      v_index := v_index + 1;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'code', 'SUCCESS', 'message', 'Business created successfully', 'business_id', v_business_id);
EXCEPTION WHEN OTHERS THEN
  -- Let Postgres rollback everything securely
  RAISE;
END;
$$;
