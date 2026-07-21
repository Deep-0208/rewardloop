import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/**
 * Root page — redirects to dashboard.
 *
 * In a later sprint, this will check auth state and redirect
 * to /login or /onboarding as appropriate.
 */
export default function RootPage() {
  redirect(ROUTES.DASHBOARD);
}
