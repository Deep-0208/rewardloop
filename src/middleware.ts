import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Root middleware — session refresh only.
 *
 * Sprint 1.1: Minimal middleware that refreshes the Supabase auth session.
 * No authentication guards or redirects yet.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
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
