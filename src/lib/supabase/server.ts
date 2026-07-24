/**
 * RewardLoop — Server Supabase client.
 *
 * Used in Server Components, Server Actions, and Route Handlers.
 * Reads/writes auth cookies via Next.js cookies() API.
 */

import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getClientEnv } from "@/lib/env.client";

export async function createClient() {
  const cookieStore = await cookies();
  const env = getClientEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll is called from Server Component where cookies cannot be set.
            // This is expected when reading session in RSC — the middleware handles refresh.
          }
        },
      },
    },
  );
}
