import "server-only";

import { compare, hash } from "bcryptjs";
import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
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
  rewardAmountPaise: number,
): Promise<{ expiresAt: string }> {
  const adminSupabase = createAdminClient();
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for") ??
    headersList.get("x-real-ip") ??
    "127.0.0.1";

  const { data: allowed, error: rateError } = await adminSupabase.rpc(
    "check_and_update_otp_cooldown",
    {
      p_phone: context.customer.phone,
      p_ip: ip,
      p_business_id: context.businessId,
      p_cooldown_seconds: OTP_COOLDOWN_SECONDS,
    },
  );
  if (rateError) {
    log.error("Reward OTP cooldown check failed", { code: rateError.code });
    throw new AppError(
      `Rate Error: ${rateError.message || rateError.code}`,
      "SERVER_ERROR",
    );
  }
  if (!allowed) {
    throw new AppError(
      "Please wait before requesting another OTP.",
      "RATE_LIMITED",
    );
  }

  // Generate a 4-digit OTP for faster, frictionless reward redemption
  const otp = randomInt(1000, 10000).toString();

  const expiresAt = new Date(
    Date.now() + OTP_TTL_SECONDS * 1_000,
  ).toISOString();
  const { data: request, error: insertError } = await adminSupabase
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
      reward_amount_paise: rewardAmountPaise,
    })
    .select("id")
    .single();
  if (insertError || !request?.id) {
    log.error("Reward OTP request insert failed", { code: insertError?.code });
    throw new AppError(
      `Insert Error: ${insertError?.message || "No ID returned"}`,
      "SERVER_ERROR",
    );
  }

  const msg91AuthKey = process.env.MSG91_AUTH_KEY;
  const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;

  if (!msg91AuthKey || !msg91TemplateId) {
    log.error("Missing MSG91 credentials");
    throw new AppError("SMS service is not configured.", "SERVER_ERROR");
  }

  const msg91Mobile = context.customer.phone.replace("+", "");
  const msg91Url = "https://control.msg91.com/api/v5/otp";
  const amountInRupees = (rewardAmountPaise / 100).toString();

  try {
    const response = await fetch(msg91Url, {
      method: "POST",
      headers: {
        authkey: msg91AuthKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: msg91TemplateId,
        mobile: msg91Mobile,
        otp: otp,
        amount: amountInRupees,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error("Reward OTP delivery failed via MSG91", { errorText });
      throw new Error(errorText);
    }

    // MSG91 returns 200 OK even for some errors, the payload has a type "error" or "success"
    const responseData = await response.json().catch(() => ({}));
    if (responseData.type === "error") {
      log.error("Reward OTP delivery failed via MSG91 API", { responseData });
      throw new Error(responseData.message || "MSG91 API Error");
    }
  } catch (deliveryError: unknown) {
    await adminSupabase
      .from("otp_requests")
      .update({ invalidated: true })
      .eq("id", request.id);
    const message =
      deliveryError instanceof Error
        ? deliveryError.message
        : String(deliveryError);
    log.error("Reward OTP delivery failed", { message });
    throw new AppError(`Twilio Error: ${message}`, "SERVER_ERROR");
  }

  return { expiresAt };
}

/** Invalidates previous pending reward OTPs, then delivers a fresh OTP. */
export async function retryRewardOtp(
  supabase: SupabaseClient,
  context: VisitContext,
  rewardAmountPaise: number,
) {
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
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
  return sendRewardOtp(supabase, context, rewardAmountPaise);
}

/** Verifies a one-time reward OTP and returns the token consumed by complete_visit. */
export async function verifyRewardOtp(
  supabase: SupabaseClient,
  context: VisitContext,
  otp: string,
): Promise<{ verifiedToken: string }> {
  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
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
      await adminSupabase
        .from("otp_requests")
        .update({ invalidated: true })
        .eq("id", request.id);
    throw new AppError(
      "OTP has expired. Please request a new one.",
      "OTP_EXPIRED",
    );
  }
  if (request.attempts >= request.max_attempts) {
    await adminSupabase
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
    await adminSupabase
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

  const { error: verifyError } = await adminSupabase
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
