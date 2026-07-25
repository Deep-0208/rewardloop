-- Migration: Enforce RLS on catalog_items
-- 1. Enable RLS on catalog_items table
-- 2. Create policy for authenticated users belonging to the business

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Drop loose policies if present
DROP POLICY IF EXISTS "Allow public read of active catalog items" ON public.catalog_items;
DROP POLICY IF EXISTS "Allow authenticated read of all items" ON public.catalog_items;
DROP POLICY IF EXISTS "Allow authenticated business catalog_items read" ON public.catalog_items;

-- Policy: Allow authenticated users to view active items belonging to their business
CREATE POLICY "Allow authenticated business catalog_items read"
  ON public.catalog_items
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND business_id IN (
      SELECT u.business_id 
      FROM public.users u 
      WHERE u.auth_user_id = auth.uid()
    )
  );

