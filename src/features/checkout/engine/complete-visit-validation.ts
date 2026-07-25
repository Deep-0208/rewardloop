import { AppError } from "@/lib/errors";

export type VisitPaymentMethod = "cash" | "online" | "none";

/** Shared preflight checks. The RPC repeats these checks inside the transaction. */
export function validateVisitCompletion(input: {
  readonly finalPayablePaise: number;
  readonly rewardAppliedPaise: number;
  readonly paymentMethod: VisitPaymentMethod;
  readonly otpVerifiedToken: string | null;
}): void {
  if (
    !Number.isSafeInteger(input.finalPayablePaise) ||
    input.finalPayablePaise < 0
  ) {
    throw new AppError("Final payable amount is invalid.", "VALIDATION_FAILED");
  }
  if (
    !Number.isSafeInteger(input.rewardAppliedPaise) ||
    input.rewardAppliedPaise < 0
  ) {
    throw new AppError("Reward amount is invalid.", "VALIDATION_FAILED");
  }
  if (input.rewardAppliedPaise > 0 && !input.otpVerifiedToken) {
    throw new AppError(
      "Verify the reward OTP before completing this visit.",
      "OTP_REQUIRED",
    );
  }
  if (input.finalPayablePaise === 0 && input.paymentMethod !== "none") {
    throw new AppError(
      "A zero-value visit does not need a payment method.",
      "VALIDATION_FAILED",
    );
  }
  if (input.finalPayablePaise > 0 && input.paymentMethod === "none") {
    throw new AppError(
      "Choose cash or online as the payment method.",
      "VALIDATION_FAILED",
    );
  }
}
