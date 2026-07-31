/**
 * RewardLoop — Settings Validation Schemas.
 *
 * Zod schemas for validating settings mutations (Catalog and Reward Rules).
 *
 * @module features/settings/schemas
 */

import { z } from "zod";

export const catalogItemSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Item name is required.")
      .max(100, "Item name is too long."),
    price: z
      .number()
      .int()
      .min(100, "Minimum price is ₹1 (100 paise).")
      .max(Number.MAX_SAFE_INTEGER),
    type: z.enum(["service", "product"]),
  })
  .strict();

export const rewardRulesSchema = z
  .object({
    rewardPercentage: z
      .number()
      .int()
      .min(1)
      .max(100, "Reward percentage must be between 1 and 100."),
    maxRedeemPercentage: z
      .number()
      .int()
      .min(1)
      .max(100, "Max redeem percentage must be between 1 and 100."),
  })
  .strict();

export const businessProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Business name must be at least 2 characters.")
      .max(50, "Business name is too long."),
  })
  .strict();
