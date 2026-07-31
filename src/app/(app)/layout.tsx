import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { RealtimeProvider } from "@/components/providers/realtime-provider";

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
      <RealtimeProvider>
        {children}
        <BottomNav />
      </RealtimeProvider>
    </AppShell>
  );
}
