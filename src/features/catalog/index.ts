/**
 * RewardLoop — Catalog Feature Module.
 *
 * Public API for the Catalog Selection feature.
 * All imports from this feature must go through this barrel.
 *
 * @module features/catalog
 */

export type {
  CatalogItem,
  CatalogItemType,
  GetCatalogItemsResponse,
} from "./types";

export { catalogItemSchema, catalogItemsResponseSchema } from "./schemas";

export { getCatalogItems } from "./actions/get-catalog-items";
