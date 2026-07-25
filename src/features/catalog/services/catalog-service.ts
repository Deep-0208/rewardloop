/**
 * RewardLoop — Catalog Business Service.
 *
 * Fetches active catalog items for the authenticated business.
 * Handles data access via Supabase client and validates output with Zod.
 *
 * Architecture: Server Action → Service → Supabase (no repository layer).
 *
 * @module features/catalog/services/catalog-service
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { catalogItemsResponseSchema } from "../schemas";
import type { CatalogItem } from "../types";
import { createLogger } from "@/lib/logger";

const log = createLogger("catalog");

/**
 * Fetch all active catalog items for the current business.
 *
 * - Filters: `status = 'active'` (inactive items never leave the DB).
 * - Ordering: `sort_order` ASC, then `name` ASC.
 * - RLS: Supabase client enforces `business_id = auth_business_id()`.
 *
 * @param supabase - Authenticated Supabase server client
 * @returns Array of CatalogItem DTOs (camelCase)
 * @throws On database or validation errors
 */
export async function getActiveCatalog(
  supabase: SupabaseClient,
): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from("catalog_items")
    .select("id, name, price, type, sort_order")
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    log.error("Failed to query catalog_items", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  // Validate DB output matches expected shape
  const parsed = catalogItemsResponseSchema.parse(data);

  // Map snake_case DB rows → camelCase DTOs
  return parsed.map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price,
    type: row.type,
    sortOrder: row.sort_order,
  }));
}
