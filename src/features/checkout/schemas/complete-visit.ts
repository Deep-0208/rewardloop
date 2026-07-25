import { z } from "zod";
import { rewardCartItemSchema } from "@/features/reward/schemas";

export const completeVisitSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    customerId: z.string().uuid(),
    items: z
      .array(rewardCartItemSchema)
      .min(1, "At least one item is required."),
    rewardAppliedPaise: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    paymentMethod: z.enum(["cash", "online", "none"]),
    otpVerifiedToken: z.string().uuid().nullable(),
  })
  .superRefine((value, context) => {
    if (
      new Set(value.items.map((item) => item.catalogItemId)).size !==
      value.items.length
    ) {
      context.addIssue({
        code: "custom",
        message: "Each catalog item can appear only once.",
        path: ["items"],
      });
    }
    if (value.rewardAppliedPaise > 0 && !value.otpVerifiedToken) {
      context.addIssue({
        code: "custom",
        message: "Reward redemption requires OTP verification.",
        path: ["otpVerifiedToken"],
      });
    }
  });
