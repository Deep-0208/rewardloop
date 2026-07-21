import { AppShell } from "@/components/app-shell";

/**
 * App layout — wraps all main application pages.
 *
 * Provides the AppShell container. Bottom navigation will be added
 * in a later sprint when the BottomNavigation component is built.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
