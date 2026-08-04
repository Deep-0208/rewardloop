import { SplashScreen } from "@/components/splash-screen";

/**
 * Root page — Splash screen with auth-based routing.
 *
 * Shows a branded splash screen while checking authentication state,
 * then navigates to /dashboard (authenticated) or /login (unauthenticated).
 */
export default function RootPage() {
  return <SplashScreen />;
}
