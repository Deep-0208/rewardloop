-- Migration: Catalog Selection Feature
-- 1. Adds 'product' value to catalog_item_type_enum (was reserved for Phase 2).
-- 2. Adds sort_order column to catalog_items for business-defined display order.
-- 3. Creates composite index for the getCatalogItems query pattern.

-- 1. Add 'product' to the catalog_item_type_enum
-- This was previously reserved for Phase 2 but is now required by the
-- approved Catalog Selection specification (Founder Decision #1 & #15).
ALTER TYPE public.catalog_item_type_enum ADD VALUE IF NOT EXISTS 'product';

-- 2. Add sort_order column
ALTER TABLE public.catalog_items
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.catalog_items.sort_order IS
  'Business-defined display order. Lower values appear first. Alphabetical name is the secondary sort.';

-- 3. Create composite index for the Catalog Selection query pattern:
--    WHERE business_id = ? AND status = 'active' ORDER BY sort_order, name
CREATE INDEX IF NOT EXISTS idx_catalog_items_active_sorted
  ON public.catalog_items (business_id, status, sort_order, name)
  WHERE status = 'active';
