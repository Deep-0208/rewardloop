import { ScreenContainer } from "@/components/screen-container";
import { EmptyState } from "@/components/empty-state";
import { Home } from "@/components/icons";

/**
 * Dashboard page — placeholder.
 *
 * Required for the root redirect to work. Will be replaced
 * with the full dashboard implementation in Sprint 1.2+.
 */
export default function DashboardPage() {
  return (
    <ScreenContainer>
      <EmptyState
        icon={<Home className="size-8 text-primary" />}
        title="Welcome to RewardLoop"
        description="Your dashboard will appear here once setup is complete."
      />
    </ScreenContainer>
  );
}
