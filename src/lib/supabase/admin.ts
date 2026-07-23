/**
 * RewardLoop — Supabase admin client (service role).
 *
 * Used for operations requiring elevated privileges (e.g. RPC calls).
 * MUST NOT be imported from client components.
 */

import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env.server";

/**
 * Create a Supabase client using the service role key.
 *
 * This client bypasses Row Level Security.
 * Use only for administrative operations and RPC function calls
 * where the calling Server Action has already validated authorization.
 */
export function createAdminClient() {
  const env = getServerEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
