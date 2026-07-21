import { AppShell } from "@/components/app-shell";

/**
 * Auth layout — wraps login and verification pages.
 *
 * No bottom navigation. Centered content. Mobile-optimized.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell className="items-center justify-center">{children}</AppShell>
  );
}
