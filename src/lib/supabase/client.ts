/**
 * RewardLoop — Browser Supabase client.
 *
 * Used in Client Components. The @supabase/ssr library
 * internally memoizes the client instance.
 */

import { createBrowserClient } from "@supabase/ssr";
import { getClientEnv } from "@/lib/env.client";

export function createClient() {
  const env = getClientEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
