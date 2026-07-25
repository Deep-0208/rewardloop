/**
 * RewardLoop — OTP Cooldown Utilities.
 *
 * Implements the hybrid OTP cooldown strategy:
 * 1. Checks lightweight signed device cookie (`rl_otp_lock`).
 * 2. Falls back to database RPC (`check_and_update_otp_cooldown`) for cross-device strictness.
 *
 * @module features/auth/utils/otp-cooldown
 */

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env.server";

const OTP_LOCK_COOKIE = "rl_otp_lock";
const OTP_COOLDOWN_SECONDS = 30;

export async function isOtpRateLimited(phone: string): Promise<boolean> {
  const cookieStore = await cookies();
  const lockValue = cookieStore.get(OTP_LOCK_COOKIE)?.value;

  // 1. Fast path: Check device cookie
  if (lockValue) {
    const { REWARDLOOP_SESSION_SECRET } = getServerEnv();
    const encoder = new TextEncoder();
    const keyData = encoder.encode(REWARDLOOP_SESSION_SECRET);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const parts = lockValue.split(".");
    if (parts.length === 2) {
      const timestampStr = parts[0] as string;
      const signature = parts[1] as string;
      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        encoder.encode(timestampStr),
      );
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (signature === expectedSignature) {
        const sentAt = parseInt(timestampStr, 10);
        if (Date.now() - sentAt < OTP_COOLDOWN_SECONDS * 1000) {
          return true; // Rate limited by cookie
        }
      }
    }
  }

  // 2. Slow path: Check database (source of truth)
  const adminSupabase = createAdminClient();
  const { data: allowed, error } = await adminSupabase.rpc(
    "check_and_update_otp_cooldown",
    {
      p_phone: phone,
      p_cooldown_seconds: OTP_COOLDOWN_SECONDS,
      p_max_requests: 5,
      p_window_minutes: 15,
    },
  );

  if (error) {
    console.error("[isOtpRateLimited] Database rate-limit RPC error:", error);
    // Do not block user login if DB rate-limiting check fails due to RPC error
    return false;
  }

  return allowed === false;
}

export async function setOtpCooldownCookie() {
  const { REWARDLOOP_SESSION_SECRET } = getServerEnv();
  const timestampStr = Date.now().toString();

  const encoder = new TextEncoder();
  const keyData = encoder.encode(REWARDLOOP_SESSION_SECRET);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(timestampStr),
  );

  const hexSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const signedValue = `${timestampStr}.${hexSignature}`;

  const cookieStore = await cookies();
  cookieStore.set(OTP_LOCK_COOKIE, signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OTP_COOLDOWN_SECONDS,
  });
}
