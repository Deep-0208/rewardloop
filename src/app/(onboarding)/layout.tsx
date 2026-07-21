import { AppShell } from "@/components/app-shell";

/**
 * Onboarding layout — wraps setup flow pages.
 *
 * No bottom navigation. Stepped flow container.
 * Progress indicator will be added when onboarding feature is built.
 */
export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
