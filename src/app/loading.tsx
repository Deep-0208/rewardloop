import { LoadingScreen } from "@/components/loading-screen";
import { AppShell } from "@/components/app-shell";

/**
 * Root loading state.
 *
 * Shown by Next.js when navigating between routes.
 * Uses skeleton-based loading per design system.
 */
export default function RootLoading() {
  return (
    <AppShell>
      <LoadingScreen />
    </AppShell>
  );
}
