-- Enable realtime for customers and catalog_items
BEGIN;

-- Check if they are already in the publication to avoid errors, or just use ADD TABLE.
-- Standard Supabase way is:
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE catalog_items;

COMMIT;
