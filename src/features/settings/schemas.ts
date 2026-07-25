/**
 * RewardLoop — Settings Validation Schemas.
 *
 * Zod schemas for validating settings mutations (Catalog and Reward Rules).
 *
 * @module features/settings/schemas
 */

import { z } from "zod";

export const catalogItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required."),
  price: z.number().int().min(100, "Minimum price is ₹1 (100 paise)."),
  type: z.enum(["service", "product"]),
});

export const rewardRulesSchema = z.object({
  rewardPercentage: z
    .number()
    .int()
    .min(1)
    .max(50, "Reward percentage must be between 1 and 50."),
  maxRedeemPercentage: z
    .number()
    .int()
    .min(1)
    .max(50, "Max redeem percentage must be between 1 and 50."),
});
