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
import { handleActionError, AppError } from "@/lib/errors";
import { cookies } from "next/headers";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";
import { SESSION_VERSION_COOKIE } from "@/features/auth/utils/session-cookie";

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
    const cookieStore = await cookies();
    const supabase = await createClient();

    const validation = await validateRewardLoopSession(
      supabase,
      cookieStore.get(SESSION_VERSION_COOKIE.name)?.value,
    );
    if (!validation.valid) {
      throw new AppError("Authentication required.", "AUTH_REQUIRED");
    }

    const typeKey = type ?? "all";
    const cacheKey = `business:${validation.businessId}:catalog:${typeKey}`;

    const { serverCache } = await import("@/lib/server-cache");
    const items = await serverCache.fetch(
      cacheKey,
      () => getActiveCatalog(supabase, type),
      { ttlSeconds: 3600 }
    );
    
    return actionSuccess(items);
  } catch (error) {
    return handleActionError(error);
  }
}
