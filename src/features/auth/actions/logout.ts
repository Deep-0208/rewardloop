/**
 * RewardLoop — Logout Server Action.
 *
 * Terminates Supabase Auth session, revokes device session token in DB,
 * and clears HTTP-only session cookies including `rl_sv`.
 *
 * @module features/auth/actions/logout
 */

"use server";

import { cookies } from "next/headers";
import type { LogoutResponse } from "../types/auth-types";
import { SESSION_VERSION_COOKIE, hashSessionToken } from "../utils/session-cookie";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { actionSuccess } from "@/lib/api";
import { handleActionError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export async function logout(): Promise<LogoutResponse> {
  try {
    const supabase = await createServerClient();
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(SESSION_VERSION_COOKIE.name)?.value;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && cookieValue) {
      const adminSupabase = createAdminClient();
      const tokenHash = await hashSessionToken(cookieValue);
      await adminSupabase.rpc("revoke_device_session", {
        p_auth_user_id: user.id,
        p_session_token_hash: tokenHash,
      });
    }

    // Sign out of Supabase
    await supabase.auth.signOut();

    // Clear local device cookies
    cookieStore.delete(SESSION_VERSION_COOKIE.name);

    return actionSuccess(undefined);
  } catch (err) {
    return handleActionError(err);
  }
}
