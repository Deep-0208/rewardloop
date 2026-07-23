/**
 * RewardLoop — Resend OTP Server Action.
 *
 * Re-dispatches a 6-digit OTP code to the requested mobile number.
 * Backend enforces rate limiting and cooldowns.
 *
 * @module features/auth/actions/resend-otp
 */

"use server";

import { phoneSchema } from "../schemas/phone-schema";
import type { SendOTPInput, SendOTPResponse } from "../types/auth-types";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/utils/formatters/phone";
import { actionSuccess, actionError } from "@/lib/api";
import { handleActionError } from "@/lib/errors";
import { isOtpRateLimited, setOtpCooldownCookie } from "../utils/otp-cooldown";

export async function resendOTP(input: SendOTPInput): Promise<SendOTPResponse> {
  try {
    const parseResult = phoneSchema.safeParse(input);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return actionError(
        issue?.message ?? "Invalid phone number",
        "VALIDATION_FAILED",
      );
    }

    const sanitizedPhone = parseResult.data.phone;
    const e164Phone = normalizePhone(sanitizedPhone);
    if (!e164Phone) {
      return actionError(
        "Enter a valid 10-digit Indian mobile number",
        "VALIDATION_FAILED",
      );
    }

    // Check custom hybrid rate limit (Cookie + DB)
    const rateLimited = await isOtpRateLimited(e164Phone);
    if (rateLimited) {
      return actionError(
        "Too many OTP requests. Please wait before trying again.",
        "RATE_LIMITED",
      );
    }

    const supabase = await createServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164Phone,
    });

    if (error) {
      if (error.status === 429) {
        return actionError(
          "Too many OTP requests. Please wait before trying again.",
          "RATE_LIMITED",
        );
      }
      return actionError(
        error.message || "Failed to resend OTP",
        "SERVER_ERROR",
      );
    }

    await setOtpCooldownCookie();

    return actionSuccess({ phone: sanitizedPhone });
  } catch (err) {
    return handleActionError(err);
  }
}
