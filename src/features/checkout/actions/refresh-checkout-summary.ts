"use server";

import { generateCheckoutSummary } from "./generate-checkout-summary";
import type { CheckoutSummaryInput, CheckoutSummaryResponse } from "../types";

/** Re-fetches checkout data after a recoverable network or catalog error. */
export async function refreshCheckoutSummary(
  input: CheckoutSummaryInput,
): Promise<CheckoutSummaryResponse> {
  return generateCheckoutSummary(input);
}
