/**
 * RewardLoop — Verify OTP Server Action.
 *
 * Verifies 6-digit OTP code with Supabase Auth, updates `users.session_version` in DB,
 * sets the signed device cookie (`rl_sv`), evaluates business status, and returns routing metadata.
 *
 * @module features/auth/actions/verify-otp
 */

"use server";

import { cookies } from "next/headers";
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
} from "../utils/session-cookie";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/utils/formatters/phone";
import { actionSuccess, actionError } from "@/lib/api";
import { handleActionError } from "@/lib/errors";
import { ROUTES } from "@/constants";

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

    const authUserId = authData.user.id;
    const adminSupabase = createAdminClient();

    let dbUserId: string;
    let role: "owner" | "staff" = "owner";
    let businessId: string | null = null;
    let newSessionVersion = 1;

    try {
      // 2. Fetch or create user record in public.users
      const { data: existingUser, error: userFetchError } = await adminSupabase
        .from("users")
        .select("id, auth_user_id, business_id, phone, role, status")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (userFetchError) {
        throw new Error("Failed to retrieve user profile.");
      }

      if (existingUser) {
        if (existingUser.status === "suspended") {
          throw new Error(
            "Your account has been suspended. Please contact support.",
          );
        }

        dbUserId = existingUser.id;
        role = existingUser.role as "owner" | "staff";
        businessId = existingUser.business_id;

        // Atomic increment of session_version
        const { data: newVersion, error: updateError } =
          await adminSupabase.rpc("increment_session_version", {
            p_auth_user_id: authUserId,
          });

        if (updateError || newVersion === null) {
          throw new Error("Failed to update session version.");
        }
        newSessionVersion = newVersion;
      } else {
        // Create new user profile in public.users
        const { data: newUser, error: createError } = await adminSupabase
          .from("users")
          .insert({
            auth_user_id: authUserId,
            phone: e164Phone,
            role: "owner",
            status: "active",
            session_version: 1,
          })
          .select("id, role, status, business_id, session_version")
          .single();

        if (createError || !newUser) {
          throw new Error("Failed to initialize user account.");
        }

        dbUserId = newUser.id;
        role = newUser.role as "owner" | "staff";
        businessId = newUser.business_id;
        newSessionVersion = newUser.session_version ?? 1;
      }

      // 3. Evaluate Business status and calculate redirect route
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

          if (businessData.status === "active") {
            authBusiness = {
              id: businessData.id,
              name: businessData.name,
              status: "active",
            };
            redirectTo = ROUTES.DASHBOARD;
          } else {
            authBusiness = null;
            redirectTo = ROUTES.ONBOARDING_BUSINESS;
          }
        }
      }

      // 4. Write HMAC-signed rl_sv cookie for device session versioning
      const signedCookieValue = await signSessionVersion(newSessionVersion);
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
      };

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
