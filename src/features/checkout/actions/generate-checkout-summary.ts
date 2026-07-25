"use server";

import { actionSuccess } from "@/lib/api";
import { AppError, handleActionError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { checkoutSummarySchema } from "../schemas";
import { generateServerCheckoutSummary } from "../services/checkout-summary-service";
import type { CheckoutSummaryInput, CheckoutSummaryResponse } from "../types";

/** Generates the non-mutating, authoritative checkout review. */
export async function generateCheckoutSummary(
  input: CheckoutSummaryInput,
): Promise<CheckoutSummaryResponse> {
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
    return actionSuccess(summary);
  } catch (error) {
    return handleActionError(error);
  }
}
