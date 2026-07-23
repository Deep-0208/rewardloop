/**
 * RewardLoop — Logout Server Action.
 *
 * Terminates Supabase Auth session and clears HTTP-only session cookies including `rl_sv`.
 *
 * @module features/auth/actions/logout
 */

"use server";

import { cookies } from "next/headers";
import type { LogoutResponse } from "../types/auth-types";
import { SESSION_VERSION_COOKIE } from "../utils/session-cookie";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { actionSuccess } from "@/lib/api";
import { handleActionError } from "@/lib/errors";

import { createAdminClient } from "@/lib/supabase/admin";

export async function logout(): Promise<LogoutResponse> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // 1. Atomic increment to invalidate the old session version
      const adminSupabase = createAdminClient();
      await adminSupabase.rpc("increment_session_version", {
        p_auth_user_id: user.id,
      });
    }

    // 2. Sign out of Supabase
    await supabase.auth.signOut();

    // 3. Clear local device cookies
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_VERSION_COOKIE.name);

    return actionSuccess(undefined);
  } catch (err) {
    return handleActionError(err);
  }
}
