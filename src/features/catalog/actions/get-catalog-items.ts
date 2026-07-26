/**
 * RewardLoop — Get Catalog Items Server Action.
 *
 * Fetches the active catalog for the authenticated business.
 * Zero client parameters — businessId is derived from RLS.
 *
 * Flow: Request → Auth → DB Query → Zod Validation → Response Mapping → Return
 *
 * @module features/catalog/actions/get-catalog-items
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveCatalog } from "../services/catalog-service";
import type { GetCatalogItemsResponse } from "../types";
import { actionSuccess } from "@/lib/api";
import { handleActionError } from "@/lib/errors";

/**
 * Server Action: Fetch active catalog items.
 *
 * - Accepts no parameters (IDOR prevention).
 * - Auth handled by createClient + RLS.
 * - Returns ActionResult<CatalogItem[]>.
 */
export async function getCatalogItems(
  type?: "service" | "product",
): Promise<GetCatalogItemsResponse> {
  try {
    const supabase = await createClient();
    const items = await getActiveCatalog(supabase, type);
    return actionSuccess(items);
  } catch (error) {
    return handleActionError(error);
  }
}
