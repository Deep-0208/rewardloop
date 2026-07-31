import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getTrustedClientIp } from "@/lib/ip";

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
  "/sales",
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
export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Rate Limiting
  const ip = getTrustedClientIp(request);

  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      const { globalRateLimit, authRateLimit } =
        await import("@/lib/rate-limit");

      let rateLimitResult;
      if (isAuthRoute(pathname)) {
        rateLimitResult = await authRateLimit.limit(ip);
      } else {
        rateLimitResult = await globalRateLimit.limit(ip);
      }

      if (!rateLimitResult.success) {
        return new NextResponse("Too Many Requests", { status: 429 });
      }
    } catch (error) {
      console.error("[Middleware] Rate limiting error (failing open):", error);
    }
  }

  // Enforce strict DB checks for app, auth, and onboarding routes to correctly fetch onboardingStatus
  const requireStrictValidation =
    isAppRoute(pathname) ||
    isAuthRoute(pathname) ||
    isOnboardingRoute(pathname);

  const { response, user, onboardingStatus } = await updateSession(
    request,
    requireStrictValidation,
  );

  // Unauthenticated -> redirect from protected routes to /login
  if (!user && (isAppRoute(pathname) || isOnboardingRoute(pathname))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated -> redirect from auth routes to /dashboard or /onboarding
  if (user && isAuthRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname =
      onboardingStatus === "COMPLETED" ? "/dashboard" : "/onboarding/business";
    return NextResponse.redirect(url);
  }

  // Business Routing Guards based on explicit state machine
  if (user && onboardingStatus !== "COMPLETED" && isAppRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding/business";
    return NextResponse.redirect(url);
  }

  if (user && onboardingStatus === "COMPLETED" && isOnboardingRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Apply OWASP Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
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
