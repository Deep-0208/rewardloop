import { AppShell } from "@/components/app-shell";
import { AppNavigation } from "@/components/navigation/app-navigation";

/**
 * App layout — wraps all main application pages.
 * Provides the AppShell container and active-route persistent BottomNavigation.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell>
      {children}
      <AppNavigation />
    </AppShell>
  );
}
