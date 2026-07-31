-- Fix users table policies so users can log in before they have a business_id
-- We must allow users to read/update their own row via auth.uid() = auth_user_id
-- Otherwise, new users (who have no business_id yet) cannot be read during auth middleware validation.

DROP POLICY IF EXISTS users_select ON public.users;
CREATE POLICY users_select ON public.users
    FOR SELECT USING (
      auth_user_id = auth.uid() 
      OR (business_id IS NOT NULL AND business_id = (SELECT public.auth_business_id()))
    );

DROP POLICY IF EXISTS users_update ON public.users;
CREATE POLICY users_update ON public.users
    FOR UPDATE USING (
      auth_user_id = auth.uid() 
      OR (business_id IS NOT NULL AND business_id = (SELECT public.auth_business_id()))
    )
    WITH CHECK (
      auth_user_id = auth.uid() 
      OR (business_id IS NOT NULL AND business_id = (SELECT public.auth_business_id()))
    );
