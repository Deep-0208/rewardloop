/**
 * RewardLoop — Catalog Validation Schemas.
 *
 * Zod schemas for validating database output at the server boundary.
 * Ensures runtime type safety for catalog items before returning to client.
 *
 * @module features/catalog/schemas
 */

import { z } from "zod";

/** Schema for a single catalog item row from the database */
export const catalogItemSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  price: z.int().positive(),
  type: z.enum(["service", "product"]),
  sort_order: z.int(),
});

/** Schema for the full catalog items array */
export const catalogItemsResponseSchema = z.array(catalogItemSchema);

/** Inferred type from the DB row schema (snake_case) */
export type CatalogItemRow = z.infer<typeof catalogItemSchema>;
