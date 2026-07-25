import { z } from "zod";

export { sendRewardOtpSchema, verifyRewardOtpSchema } from "./reward-otp";

export const rewardCartItemSchema = z.object({
  catalogItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

/** Shared input contract for preview, calculation, and validation actions. */
export const rewardCalculationSchema = z
  .object({
    customerId: z.string().uuid(),
    items: z
      .array(rewardCartItemSchema)
      .min(1, "At least one item is required."),
    rewardRequestedPaise: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  })
  .superRefine((value, context) => {
    const itemIds = new Set<string>();
    for (const [index, item] of value.items.entries()) {
      if (itemIds.has(item.catalogItemId)) {
        context.addIssue({
          code: "custom",
          message: "Each catalog item can appear only once.",
          path: ["items", index, "catalogItemId"],
        });
      }
      itemIds.add(item.catalogItemId);
    }
  });
