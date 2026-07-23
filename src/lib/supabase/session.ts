/**
 * RewardLoop — Authentication-agnostic session helper.
 *
 * Provides a thin wrapper to read the current Supabase session
 * without any business logic (no business_id lookup, no session_version check).
 * Authentication-specific helpers belong in the Auth feature (Phase 2).
 */

import "server-only";

import { createClient } from "./server";

/**
 * Get the current Supabase auth session.
 *
 * Returns the authenticated user or null if no session exists.
 * Does NOT validate session_version or resolve business_id — those
 * responsibilities belong to the Auth feature module.
 */
export async function getSupabaseUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}
