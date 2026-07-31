-- Migration: 20260802100000_fix_verify_user_session.sql
-- Description: Fix verify_user_session RPC event enum and phone matching with ON CONFLICT DO UPDATE for user_sessions

-- 1. Safely ensure AUTH_LOGIN and LOGIN_SUCCESS exist in audit_event_enum
ALTER TYPE public.audit_event_enum ADD VALUE IF NOT EXISTS 'AUTH_LOGIN';

-- 2. Update verify_user_session RPC function
CREATE OR REPLACE FUNCTION public.verify_user_session(
  p_auth_user_id UUID,
  p_phone TEXT,
  p_session_token_hash TEXT DEFAULT NULL,
  p_device_info TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_session_id UUID;
  v_clean_phone TEXT;
BEGIN
  v_clean_phone := REPLACE(p_phone, '+', '');

  -- 1. Find user by auth_user_id first
  SELECT * INTO v_user FROM public.users WHERE auth_user_id = p_auth_user_id FOR UPDATE;

  IF NOT FOUND THEN
    -- 2. If not found by auth_user_id, check if user exists by phone (handling optional + prefix)
    SELECT * INTO v_user FROM public.users 
    WHERE REPLACE(phone, '+', '') = v_clean_phone 
    ORDER BY created_at ASC LIMIT 1 FOR UPDATE;

    IF FOUND THEN
      -- Re-link auth_user_id and normalize phone on existing user record
      UPDATE public.users
      SET auth_user_id = p_auth_user_id,
          phone = p_phone,
          session_version = session_version + 1,
          last_login_at = now(),
          updated_at = now()
      WHERE id = v_user.id
      RETURNING * INTO v_user;
    ELSE
      -- Brand new user
      INSERT INTO public.users (auth_user_id, phone, role, status, session_version, onboarding_status, last_login_at)
      VALUES (p_auth_user_id, p_phone, 'owner', 'active', 1, 'NOT_STARTED', now())
      RETURNING * INTO v_user;
    END IF;
  ELSE
    IF v_user.status = 'suspended' THEN
      RETURN jsonb_build_object('success', false, 'code', 'ACCOUNT_SUSPENDED', 'message', 'Your account has been suspended.');
    END IF;

    UPDATE public.users
    SET session_version = session_version + 1,
        last_login_at = now(),
        updated_at = now()
    WHERE id = v_user.id
    RETURNING * INTO v_user;
  END IF;

  -- 3. Register new device session idempotently
  IF p_session_token_hash IS NOT NULL AND p_session_token_hash != '' THEN
    INSERT INTO public.user_sessions (
      user_id, session_token_hash, device_info, ip_address, last_active_at, expires_at
    ) VALUES (
      v_user.id, p_session_token_hash, p_device_info, p_ip_address, now(), now() + interval '30 days'
    )
    ON CONFLICT (session_token_hash) DO UPDATE
    SET last_active_at = now(), expires_at = now() + interval '30 days'
    RETURNING id INTO v_session_id;
  END IF;

  -- 4. Log login audit event safely using LOGIN_SUCCESS enum
  IF v_user.business_id IS NOT NULL THEN
    INSERT INTO public.audit_logs (business_id, user_id, event, entity, entity_id, new_value)
    VALUES (
      v_user.business_id, v_user.id, 'LOGIN_SUCCESS'::public.audit_event_enum, 'users', v_user.id,
      jsonb_build_object('phone', p_phone, 'ip', p_ip_address, 'login_at', now())
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'user_id', v_user.id,
      'business_id', v_user.business_id,
      'session_version', v_user.session_version,
      'onboarding_status', v_user.onboarding_status,
      'role', v_user.role,
      'session_id', v_session_id
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_user_session(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_user_session(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
