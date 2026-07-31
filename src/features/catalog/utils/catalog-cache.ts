import { getCatalogItems } from "../actions/get-catalog-items";
import { CacheManager } from "@/utils/cache-manager";
import type { GetCatalogItemsResponse } from "../types";

export const catalogCache = new CacheManager<
  "catalog",
  GetCatalogItemsResponse
>("catalog_cache", {
  maxSize: 1, // We only store 1 big array for the whole catalog
  ttlMs: 5 * 60 * 1000,
});

export function triggerCatalogPrefetch() {
  catalogCache.fetchWithRetry("catalog", async () => {
    // If we passed signal down to fetch we could abort the network req,
    // but Next.js Server Actions don't easily accept AbortSignal from the client.
    // However, the CacheManager will ignore the result if aborted.
    return getCatalogItems();
  });
}

export function clearCatalogPromise() {
  catalogCache.abort("catalog");
}
