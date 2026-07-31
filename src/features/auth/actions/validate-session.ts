/**
 * RewardLoop — Validate Session Server Action.
 *
 * Verifies active session, checks device `rl_sv` cookie signature against DB `session_version`,
 * and enforces single-device session isolation without unnecessary DB joins.
 *
 * @module features/auth/actions/validate-session
 */

"use server";

import { cookies } from "next/headers";
import type { ValidateSessionResponse } from "../types/auth-types";
import { SESSION_VERSION_COOKIE } from "../utils/session-cookie";
import { validateRewardLoopSession } from "../utils/session-validator";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { actionSuccess, actionError } from "@/lib/api";
import { handleActionError } from "@/lib/errors";

export async function validateSession(): Promise<ValidateSessionResponse> {
  try {
    const supabase = await createServerClient();
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(SESSION_VERSION_COOKIE.name)?.value;

    const validation = await validateRewardLoopSession(supabase, cookieValue);

    if (!validation.valid || !validation.user) {
      if (validation.reason === "AUTH_REQUIRED") {
        return actionError(
          "Authentication required. Please log in.",
          "AUTH_REQUIRED",
        );
      }
      if (validation.reason === "ACCOUNT_SUSPENDED") {
        return actionError(
          "Your account has been suspended or removed.",
          "ACCOUNT_SUSPENDED",
        );
      }
      return actionError(
        "You've been logged in on another device. Please log in again.",
        "SESSION_REVOKED",
      );
    }

    return actionSuccess({
      userId: validation.user.id,
      phone: validation.user.phone ?? "",
      businessId: validation.businessId ?? null,
      sessionVersion: validation.sessionVersion ?? 1,
      role: validation.role ?? "owner",
      accountStatus: validation.accountStatus ?? "active",
      onboardingStatus: validation.onboardingStatus ?? "NOT_STARTED",
      lastLogin: validation.lastLogin ?? null,
    });
  } catch (err) {
    return handleActionError(err);
  }
}
