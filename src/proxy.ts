import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/* ─── Route Classification ─────────────────────────────────────────────────
 *
 * These helpers classify incoming requests by route group.
 * Used by the middleware to apply group-specific routing guards.
 *
 * ─────────────────────────────────────────────────────────────────────────── */

const PUBLIC_ROUTES = new Set(["/", "/login", "/verify"]);
const AUTH_ROUTE_PREFIX = "/login";
const VERIFY_ROUTE_PREFIX = "/verify";
const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/visit",
  "/insights",
  "/more",
] as const;
const ONBOARDING_ROUTE_PREFIX = "/onboarding";

/** Check if a path is a public route (no auth required) */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.has(pathname);
}

/** Check if a path is an auth route (login, verify) */
export function isAuthRoute(pathname: string): boolean {
  return (
    pathname.startsWith(AUTH_ROUTE_PREFIX) ||
    pathname.startsWith(VERIFY_ROUTE_PREFIX)
  );
}

/** Check if a path is a main app route (requires auth) */
export function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Check if a path is an onboarding route */
export function isOnboardingRoute(pathname: string): boolean {
  return pathname.startsWith(ONBOARDING_ROUTE_PREFIX);
}

/**
 * Next.js 16 Root Proxy Interceptor — session refresh & route protection.
 *
 * 1. Refreshes Supabase session via NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * 2. Unauthenticated user accessing app/onboarding routes -> redirect to /login.
 * 3. Authenticated user accessing auth routes (/login, /verify) -> redirect to /dashboard.
 */
export default async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const skipAuth = process.env.SKIP_AUTH_MIDDLEWARE === "true";

  // Unauthenticated -> redirect from protected routes to /login
  if (
    !skipAuth &&
    !user &&
    (isAppRoute(pathname) || isOnboardingRoute(pathname))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated -> redirect from auth routes to /dashboard
  if (user && isAuthRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - icons/ (PWA icons)
     * - manifest.webmanifest
     * - SVG/image assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icons/|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
