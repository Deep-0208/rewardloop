/**
 * RewardLoop — Verify OTP Server Action.
 *
 * Verifies 6-digit OTP code with Supabase Auth, updates `users.session_version` in DB,
 * registers device session in `user_sessions`, sets the signed device cookie (`rl_sv`),
 * evaluates business status, and returns routing metadata.
 *
 * @module features/auth/actions/verify-otp
 */

"use server";

import { cookies, headers } from "next/headers";
import { otpSchema } from "../schemas/otp-schema";
import type {
  VerifyOTPInput,
  VerifyOTPResponse,
  AuthUser,
  AuthBusiness,
} from "../types/auth-types";
import {
  SESSION_VERSION_COOKIE,
  signSessionVersion,
  hashSessionToken,
} from "../utils/session-cookie";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/utils/formatters/phone";
import { actionSuccess, actionError } from "@/lib/api";
import { handleActionError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { ROUTES } from "@/constants";

const log = createLogger("verify-otp");

export async function verifyOTP(
  input: VerifyOTPInput,
): Promise<VerifyOTPResponse> {
  try {
    const parseResult = otpSchema.safeParse(input);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return actionError(
        issue?.message ?? "Invalid phone or OTP",
        "VALIDATION_FAILED",
      );
    }

    const { phone: rawPhone, otp } = parseResult.data;
    const e164Phone = normalizePhone(rawPhone);
    if (!e164Phone) {
      return actionError(
        "Enter a valid 10-digit Indian mobile number",
        "VALIDATION_FAILED",
      );
    }

    const supabase = await createServerClient();

    // 1. Verify OTP with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      phone: e164Phone,
      token: otp,
      type: "sms",
    });

    if (authError || !authData.user) {
      const msg = authError?.message || "";
      if (msg.toLowerCase().includes("expired")) {
        return actionError(
          "OTP code has expired. Please request a new code.",
          "OTP_EXPIRED",
        );
      }
      return actionError(
        "Invalid OTP code entered. Please check and try again.",
        "INVALID_OTP",
      );
    }

    const headerStore = await headers();
    const userAgent = headerStore.get("user-agent") ?? "Unknown Device";
    const rawIp = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

    const authUserId = authData.user.id;
    const adminSupabase = createAdminClient();

    try {
      // 2. Generate signed cookie value & token hash before RPC call
      const tempCookieValue = await signSessionVersion(Date.now());
      const sessionTokenHash = await hashSessionToken(tempCookieValue);

      // 3. Execute idempotent, atomic verify RPC with session registration
      const { data: rpcData, error: rpcError } = await adminSupabase.rpc(
        "verify_user_session",
        {
          p_auth_user_id: authUserId,
          p_phone: e164Phone,
          p_session_token_hash: sessionTokenHash,
          p_device_info: userAgent,
          p_ip_address: rawIp,
        },
      );

      if (rpcError) {
        log.error("verify_user_session RPC failed", {
          error: rpcError,
          authUserId,
        });
        throw new Error("Failed to initialize user session.");
      }

      if (!rpcData.success) {
        throw new Error(
          rpcData.message || "Failed to initialize user session.",
        );
      }

      const {
        user_id: dbUserId,
        business_id: businessId,
        session_version: newSessionVersion,
        onboarding_status: onboardingStatus,
        role,
      } = rpcData.data;

      // 4. Evaluate Business status and calculate redirect route
      let authBusiness: AuthBusiness | null = null;
      let redirectTo: string = ROUTES.ONBOARDING_BUSINESS;

      if (businessId) {
        const { data: businessData } = await adminSupabase
          .from("businesses")
          .select("id, name, status")
          .eq("id", businessId)
          .maybeSingle();

        if (businessData) {
          if (businessData.status === "suspended") {
            throw new Error(
              "Your business account is suspended. Please contact support.",
            );
          }
          authBusiness = {
            id: businessData.id,
            name: businessData.name,
            status: "active",
          };
        }
      }

      // Route explicitly by onboarding status
      if (onboardingStatus === "COMPLETED") {
        redirectTo = ROUTES.DASHBOARD;
      } else {
        redirectTo = ROUTES.ONBOARDING_BUSINESS;
      }

      // 5. Write HMAC-signed rl_sv cookie for device session versioning
      const signedCookieValue = tempCookieValue;
      const cookieStore = await cookies();
      cookieStore.set(
        SESSION_VERSION_COOKIE.name,
        signedCookieValue,
        SESSION_VERSION_COOKIE.options,
      );

      const authUser: AuthUser = {
        id: dbUserId,
        authUserId,
        phone: e164Phone,
        role,
        businessId,
        sessionVersion: newSessionVersion,
        onboardingStatus,
        lastLogin: new Date().toISOString(),
      };

      log.info("OTP verified successfully", {
        authUserId,
        businessId,
        onboardingStatus,
      });

      return actionSuccess({
        user: authUser,
        business: authBusiness,
        redirectTo,
      });
    } catch (processErr: unknown) {
      // Rollback: Force signout and delete cookie on any post-verification failure
      await supabase.auth.signOut();
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_VERSION_COOKIE.name);

      const errorMessage =
        processErr instanceof Error
          ? processErr.message
          : "An error occurred during verification.";
      const isSuspended = errorMessage.includes("suspended");
      return actionError(
        errorMessage,
        isSuspended ? "ACCOUNT_SUSPENDED" : "SERVER_ERROR",
      );
    }
  } catch (err) {
    return handleActionError(err);
  }
}
