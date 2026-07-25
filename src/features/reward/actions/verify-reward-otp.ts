"use server";

import { actionSuccess } from "@/lib/api";
import { AppError, handleActionError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { resolveVisitContext } from "@/features/checkout/services/visit-context-service";
import { verifyRewardOtpSchema } from "../schemas";
import { verifyRewardOtp } from "../services/reward-otp-service";
import type { ActionResult } from "@/types";

export interface VerifyRewardOtpResult {
  readonly verifiedToken: string;
}

export async function verifyRewardOTP(input: {
  customerId: string;
  otp: string;
}): Promise<ActionResult<VerifyRewardOtpResult>> {
  try {
    const parsed = verifyRewardOtpSchema.safeParse(input);
    if (!parsed.success)
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid OTP.",
        "VALIDATION_FAILED",
      );
    const supabase = await createClient();
    const context = await resolveVisitContext(supabase, parsed.data.customerId);
    return actionSuccess(
      await verifyRewardOtp(supabase, context, parsed.data.otp),
    );
  } catch (error) {
    return handleActionError(error);
  }
}
