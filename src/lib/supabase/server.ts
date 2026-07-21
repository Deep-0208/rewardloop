/**
 * RewardLoop — Server Supabase client.
 *
 * Used in Server Components, Server Actions, and Route Handlers.
 * Reads/writes auth cookies via Next.js cookies() API.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
