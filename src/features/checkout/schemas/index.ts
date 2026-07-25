import { z } from "zod";
import { rewardCalculationSchema } from "@/features/reward/schemas";

export { completeVisitSchema } from "./complete-visit";

/** Reused billing request contract; checkout has no client-owned monetary totals. */
export const checkoutSummarySchema = rewardCalculationSchema;

export const checkoutCatalogItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(["service", "product"]),
  price: z.number().int().min(0),
});
