/**
 * RewardLoop — Catalog Feature Types.
 *
 * Domain types for the Catalog Selection step of the Add Visit workflow.
 * All monetary values are in paise (integer).
 *
 * @module features/catalog/types
 */

import type { UUID, Paise, ActionResult } from "@/types";

/** Catalog item type discriminator */
export type CatalogItemType = "service" | "product";

/**
 * Catalog item DTO returned by getCatalogItems.
 *
 * This is the shape exposed to the frontend — no internal DB fields.
 */
export interface CatalogItem {
  readonly id: UUID;
  readonly name: string;
  readonly price: Paise;
  readonly type: CatalogItemType;
  readonly sortOrder: number;
}

/** Server Action response for getCatalogItems */
export type GetCatalogItemsResponse = ActionResult<CatalogItem[]>;
