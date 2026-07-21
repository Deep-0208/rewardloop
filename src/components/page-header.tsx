import { cn } from "@/lib/utils";
import { ArrowLeft } from "@/components/icons";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
}

/**
 * PageHeader — Reusable page-level header.
 *
 * Displays title with optional back button and action slots.
 * Uses H1 per semantic HTML best practices (one H1 per page).
 */
export function PageHeader({
  title,
  subtitle,
  onBack,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex items-center gap-3 px-4 py-3", className)}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="touch-target flex items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </button>
      ) : null}

      <div className="flex-1">
        <h1 className="text-xl font-semibold leading-7 text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
