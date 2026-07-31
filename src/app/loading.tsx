import { LoadingState } from "@/components/ui/feedback-states";
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
      <LoadingState variant="full" />
    </AppShell>
  );
}
