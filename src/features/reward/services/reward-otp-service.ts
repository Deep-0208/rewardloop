import "server-only";

import { compare, hash } from "bcryptjs";
import { randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import type { VisitContext } from "@/features/checkout/services/visit-context-service";

const log = createLogger("reward-otp");
const OTP_TTL_SECONDS = 3 * 60;
const OTP_COOLDOWN_SECONDS = 30;
const OTP_MAX_REQUESTS = 5;
const OTP_WINDOW_MINUTES = 15;
const OTP_MAX_ATTEMPTS = 3;

interface RewardOtpRow {
  id: string;
  otp_hash: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
  verified_at: string | null;
  invalidated: boolean;
}

function isExpired(expiresAt: string): boolean {
  return Date.parse(expiresAt) <= Date.now();
}

/** Creates and delivers a customer-confirmation OTP. Its plaintext is never persisted or returned. */
export async function sendRewardOtp(
  supabase: SupabaseClient,
  context: VisitContext,
): Promise<{ expiresAt: string }> {
  const { data: allowed, error: rateError } = await supabase.rpc(
    "check_and_update_otp_cooldown",
    {
      p_phone: context.customer.phone,
      p_cooldown_seconds: OTP_COOLDOWN_SECONDS,
      p_max_requests: OTP_MAX_REQUESTS,
      p_window_minutes: OTP_WINDOW_MINUTES,
    },
  );
  if (rateError) {
    log.error("Reward OTP cooldown check failed", { code: rateError.code });
    throw new AppError("Unable to send OTP. Please try again.", "SERVER_ERROR");
  }
  if (!allowed) {
    throw new AppError(
      "Please wait before requesting another OTP.",
      "RATE_LIMITED",
    );
  }

  const otp = randomInt(100000, 1_000_000).toString();
  const expiresAt = new Date(
    Date.now() + OTP_TTL_SECONDS * 1_000,
  ).toISOString();
  const { data: request, error: insertError } = await supabase
    .from("otp_requests")
    .insert({
      phone: context.customer.phone,
      purpose: "reward_redemption",
      business_id: context.businessId,
      otp_hash: await hash(otp, 10),
      expires_at: expiresAt,
      attempts: 0,
      max_attempts: OTP_MAX_ATTEMPTS,
      invalidated: false,
    })
    .select("id")
    .single();
  if (insertError || !request?.id) {
    log.error("Reward OTP request insert failed", { code: insertError?.code });
    throw new AppError("Unable to send OTP. Please try again.", "SERVER_ERROR");
  }

  const { error: deliveryError } = await supabase.functions.invoke("send-otp", {
    body: {
      phone: context.customer.phone,
      otp,
      templateId: process.env.MSG91_OTP_TEMPLATE_ID,
      purpose: "reward_redemption",
    },
  });
  if (deliveryError) {
    await supabase
      .from("otp_requests")
      .update({ invalidated: true })
      .eq("id", request.id);
    log.error("Reward OTP delivery failed", { message: deliveryError.message });
    throw new AppError("Unable to send OTP. Please try again.", "SERVER_ERROR");
  }

  return { expiresAt };
}

/** Invalidates previous pending reward OTPs, then delivers a fresh OTP. */
export async function retryRewardOtp(
  supabase: SupabaseClient,
  context: VisitContext,
) {
  const { error } = await supabase
    .from("otp_requests")
    .update({ invalidated: true })
    .eq("business_id", context.businessId)
    .eq("phone", context.customer.phone)
    .eq("purpose", "reward_redemption")
    .is("verified_at", null)
    .eq("invalidated", false);
  if (error) {
    log.error("Reward OTP invalidation failed", { code: error.code });
    throw new AppError(
      "Unable to resend OTP. Please try again.",
      "SERVER_ERROR",
    );
  }
  return sendRewardOtp(supabase, context);
}

/** Verifies a one-time reward OTP and returns the token consumed by complete_visit. */
export async function verifyRewardOtp(
  supabase: SupabaseClient,
  context: VisitContext,
  otp: string,
): Promise<{ verifiedToken: string }> {
  const { data, error } = await supabase
    .from("otp_requests")
    .select(
      "id, otp_hash, expires_at, attempts, max_attempts, verified_at, invalidated",
    )
    .eq("business_id", context.businessId)
    .eq("phone", context.customer.phone)
    .eq("purpose", "reward_redemption")
    .eq("invalidated", false)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    log.error("Reward OTP lookup failed", { code: error.code });
    throw new AppError(
      "Unable to verify OTP. Please try again.",
      "SERVER_ERROR",
    );
  }
  const request = data as RewardOtpRow | null;
  if (!request || isExpired(request.expires_at)) {
    if (request?.id)
      await supabase
        .from("otp_requests")
        .update({ invalidated: true })
        .eq("id", request.id);
    throw new AppError(
      "OTP has expired. Please request a new one.",
      "OTP_EXPIRED",
    );
  }
  if (request.attempts >= request.max_attempts) {
    await supabase
      .from("otp_requests")
      .update({ invalidated: true })
      .eq("id", request.id);
    throw new AppError(
      "Too many failed attempts. Please request a new OTP.",
      "OTP_MAX_ATTEMPTS",
    );
  }

  if (!(await compare(otp, request.otp_hash))) {
    const attempts = request.attempts + 1;
    await supabase
      .from("otp_requests")
      .update({ attempts, invalidated: attempts >= request.max_attempts })
      .eq("id", request.id);
    if (attempts >= request.max_attempts) {
      throw new AppError(
        "Too many failed attempts. Please request a new OTP.",
        "OTP_MAX_ATTEMPTS",
      );
    }
    throw new AppError("Invalid OTP. Please try again.", "INVALID_OTP");
  }

  const { error: verifyError } = await supabase
    .from("otp_requests")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", request.id)
    .eq("invalidated", false)
    .is("verified_at", null);
  if (verifyError) {
    log.error("Reward OTP verification write failed", {
      code: verifyError.code,
    });
    throw new AppError(
      "Unable to verify OTP. Please try again.",
      "SERVER_ERROR",
    );
  }
  return { verifiedToken: request.id };
}
