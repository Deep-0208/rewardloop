import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/feedback-states";
import { FileQuestion } from "@/components/icons";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

/**
 * Custom 404 page.
 *
 * Friendly not-found state with icon, message, and navigation action.
 */
export default function NotFound() {
  return (
    <AppShell>
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        action={
          <Link
            href={ROUTES.DASHBOARD}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Go to Dashboard
          </Link>
        }
      />
    </AppShell>
  );
}
