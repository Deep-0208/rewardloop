/**
 * RewardLoop — Core Session Validation Helper.
 *
 * Provides a single source of truth for session validation used by both
 * Next.js Edge Middleware and the Server Action.
 *
 * @module features/auth/utils/session-validator
 */

import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { parseAndVerifySessionVersion } from "./session-cookie";

export interface SessionValidationResult {
  valid: boolean;
  user?: User;
  reason?: "AUTH_REQUIRED" | "SESSION_REVOKED" | "ACCOUNT_SUSPENDED";
}

/**
 * Validates a RewardLoop session given an authenticated Supabase client and the `rl_sv` cookie value.
 */
export async function validateRewardLoopSession(
  supabase: SupabaseClient,
  cookieValue: string | undefined,
): Promise<SessionValidationResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { valid: false, reason: "AUTH_REQUIRED" };
  }

  // 1. Verify rl_sv cookie signature
  const cookieVersion = await parseAndVerifySessionVersion(cookieValue);

  if (cookieVersion === null) {
    return { valid: false, reason: "SESSION_REVOKED" };
  }

  // 2. Fetch DB session_version and status using RLS
  const { data: dbUser } = await supabase
    .from("users")
    .select("session_version, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!dbUser || dbUser.status === "suspended") {
    return {
      valid: false,
      reason:
        dbUser?.status === "suspended"
          ? "ACCOUNT_SUSPENDED"
          : "SESSION_REVOKED",
    };
  }

  const dbVersion = dbUser.session_version ?? 1;
  if (dbVersion > cookieVersion) {
    return { valid: false, reason: "SESSION_REVOKED" };
  }

  return { valid: true, user };
}
