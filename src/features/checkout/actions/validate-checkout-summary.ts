"use server";

import { actionSuccess } from "@/lib/api";
import { AppError, handleActionError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { assertValidRewardRedemption } from "@/features/reward/utils/reward-validation";
import { checkoutSummarySchema } from "../schemas";
import { generateServerCheckoutSummary } from "../services/checkout-summary-service";
import type {
  CheckoutSummaryInput,
  CheckoutSummaryValidationResponse,
} from "../types";

/** Strict pre-flight validation used immediately before Complete Visit. */
export async function validateCheckoutSummary(
  input: CheckoutSummaryInput,
): Promise<CheckoutSummaryValidationResponse> {
  try {
    const parsed = checkoutSummarySchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid checkout summary request.",
        "VALIDATION_FAILED",
      );
    }

    const summary = await generateServerCheckoutSummary(
      await createClient(),
      parsed.data,
    );
    assertValidRewardRedemption(
      parsed.data.rewardRequestedPaise,
      summary.reward,
    );
    return actionSuccess({ valid: true, summary });
  } catch (error) {
    return handleActionError(error);
  }
}
