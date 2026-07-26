/**
 * RewardLoop — Supabase middleware helper.
 *
 * Refreshes the Supabase auth session on each request using NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Called from the root middleware.ts.
 */

/* eslint-disable no-console */
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { validateRewardLoopSession } from "@/features/auth/utils/session-validator";

export async function updateSession(
  request: NextRequest,
  requireStrictValidation: boolean = true,
) {
  let supabaseResponse = NextResponse.next({ request });

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { response: supabaseResponse, user: null };
  }

  // Fast path: If no Supabase auth cookies exist, return immediately without network roundtrips
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));

  if (!hasAuthCookie) {
    console.error(
      "[MIDDLEWARE REJECT] NO AUTH COOKIE FOUND",
      request.cookies.getAll(),
    );
    return { response: supabaseResponse, user: null };
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const cookieValue = request.cookies.get("rl_sv")?.value;
  const validation = await validateRewardLoopSession(
    supabase,
    cookieValue,
    requireStrictValidation,
  );

  if (!validation.valid) {
    console.error("[MIDDLEWARE REJECT]", {
      cookieValue,
      reason: validation.reason,
      hasAuthCookie,
    });
    // Tampered, missing cookie, revoked, or suspended -> revoke session
    await supabase.auth.signOut();
    supabaseResponse.cookies.delete("rl_sv");
    return { response: supabaseResponse, user: null };
  }

  return { response: supabaseResponse, user: validation.user };
}
