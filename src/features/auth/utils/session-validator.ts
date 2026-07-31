/**
 * RewardLoop — Core Session Validation Helper.
 *
 * Provides a single source of truth for session validation used by both
 * Next.js Edge Middleware and the Server Action. Supports granular `user_sessions`
 * validation, idle timeouts (7 days), and absolute lifetime checks (30 days).
 *
 * @module features/auth/utils/session-validator
 */

import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { parseAndVerifySessionVersion, hashSessionToken } from "./session-cookie";

export interface SessionValidationResult {
  valid: boolean;
  user?: User;
  reason?: "AUTH_REQUIRED" | "SESSION_REVOKED" | "ACCOUNT_SUSPENDED" | "SESSION_EXPIRED";
  businessId?: string | null;
  onboardingStatus?: string;
  role?: string;
  lastLogin?: string | null;
  sessionVersion?: number;
  accountStatus?: string;
}

// In-memory Edge/Node session cache to avoid DB touch RPC inflation on every request (60-second TTL)
const sessionCache = new Map<
  string,
  { result: SessionValidationResult; expiresAt: number }
>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Validates a RewardLoop session given an authenticated Supabase client and the `rl_sv` cookie value.
 */
export async function validateRewardLoopSession(
  supabase: SupabaseClient,
  cookieValue: string | undefined,
  requireStrictValidation: boolean = true,
): Promise<SessionValidationResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { valid: false, reason: "AUTH_REQUIRED" };
  }

  if (!requireStrictValidation) {
    return { valid: true, user };
  }

  // 1. Verify rl_sv cookie HMAC signature
  const cookieVersion = await parseAndVerifySessionVersion(cookieValue);

  if (cookieVersion === null || !cookieValue) {
    return { valid: false, reason: "SESSION_REVOKED" };
  }

  // 2. Check fast path session cache
  const cacheKey = `${user.id}:${cookieValue}`;
  const now = Date.now();
  const cached = sessionCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.result;
  }

  // 3. Query user & device session RPC for validation, idle timeout, and active status
  const tokenHash = await hashSessionToken(cookieValue);
  const { data: rpcRes, error: rpcErr } = await supabase.rpc(
    "validate_and_touch_session",
    {
      p_auth_user_id: user.id,
      p_session_token_hash: tokenHash,
    },
  );

  let result: SessionValidationResult;

  if (!rpcErr && rpcRes && typeof rpcRes === "object") {
    const res = rpcRes as {
      valid: boolean;
      reason?: "AUTH_REQUIRED" | "SESSION_REVOKED" | "ACCOUNT_SUSPENDED" | "SESSION_EXPIRED";
      user_id?: string;
      business_id?: string | null;
      onboarding_status?: string;
      role?: string;
      status?: string;
      session_version?: number;
      last_login_at?: string | null;
    };

    if (!res.valid) {
      return { valid: false, reason: res.reason || "SESSION_REVOKED" };
    }

    result = {
      valid: true,
      user,
      businessId: res.business_id ?? null,
      onboardingStatus: res.onboarding_status ?? "NOT_STARTED",
      role: res.role ?? "owner",
      lastLogin: res.last_login_at ?? null,
      sessionVersion: res.session_version ?? 1,
      accountStatus: res.status ?? "active",
    };
  } else {
    // Fallback check directly on users table if user_sessions RPC isn't available
    const { data: dbUser } = await supabase
      .from("users")
      .select(
        "session_version, status, business_id, onboarding_status, role, last_login_at",
      )
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

    result = {
      valid: true,
      user,
      businessId: dbUser.business_id,
      onboardingStatus: dbUser.onboarding_status,
      role: dbUser.role,
      lastLogin: dbUser.last_login_at,
      sessionVersion: dbUser.session_version,
      accountStatus: dbUser.status,
    };
  }

  // Cache valid session result for 60 seconds
  if (result.valid) {
    // Prune stale cache entries if cache grows large
    if (sessionCache.size > 2000) {
      for (const [k, v] of sessionCache.entries()) {
        if (now >= v.expiresAt) sessionCache.delete(k);
      }
    }
    sessionCache.set(cacheKey, { result, expiresAt: now + CACHE_TTL_MS });
  }

  return result;
}

