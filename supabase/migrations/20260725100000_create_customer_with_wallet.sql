-- Create an atomic RPC function for customer and wallet creation
-- This fixes the race condition where a customer could be created without a wallet if the second insert fails.

CREATE OR REPLACE FUNCTION public.create_customer_with_wallet(
    p_phone TEXT,
    p_name TEXT,
    p_business_id UUID,
    p_created_by UUID
)
RETURNS SETOF public.customers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer public.customers;
BEGIN
    -- Insert customer
    INSERT INTO public.customers (business_id, phone, name, created_by)
    VALUES (p_business_id, p_phone, p_name, p_created_by)
    RETURNING * INTO v_customer;

    -- Insert wallet
    INSERT INTO public.reward_wallets (customer_id, business_id, current_balance)
    VALUES (v_customer.id, p_business_id, 0);

    RETURN NEXT v_customer;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_customer_with_wallet(TEXT, TEXT, UUID, UUID) TO authenticated, service_role;
