-- Add sort_order column to catalog_items table
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
