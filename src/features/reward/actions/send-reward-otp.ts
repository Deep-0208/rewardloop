"use server";

import { actionSuccess } from "@/lib/api";
import { AppError, handleActionError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { resolveVisitContext } from "@/features/checkout/services/visit-context-service";
import { sendRewardOtpSchema } from "../schemas";
import { sendRewardOtp } from "../services/reward-otp-service";
import type { ActionResult } from "@/types";

export interface SendRewardOtpResult {
  readonly expiresAt: string;
  readonly cooldownSeconds: 30;
}

/** Sends the confirmation OTP required for a reward redemption. */
export async function sendRewardOTP(input: {
  customerId: string;
  rewardAmountPaise: number;
}): Promise<ActionResult<SendRewardOtpResult>> {
  try {
    const parsed = sendRewardOtpSchema.safeParse(input);
    if (!parsed.success)
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid OTP request.",
        "VALIDATION_FAILED",
      );
    const supabase = await createClient();
    const context = await resolveVisitContext(supabase, parsed.data.customerId);
    const result = await sendRewardOtp(
      supabase,
      context,
      parsed.data.rewardAmountPaise,
    );
    return actionSuccess({ ...result, cooldownSeconds: 30 });
  } catch (error) {
    return handleActionError(error);
  }
}
