-- Fix users_select RLS policy to allow users to SELECT their own user row even during onboarding (when business_id IS NULL)
DROP POLICY IF EXISTS users_select ON public.users;

CREATE POLICY users_select ON public.users
  FOR SELECT USING (
    auth_user_id = auth.uid() 
    OR (business_id IS NOT NULL AND business_id = auth_business_id())
  );
