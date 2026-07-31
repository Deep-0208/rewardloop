import { cn } from "@/lib/utils";
import { ArrowLeft } from "@/components/icons";
import Link from "next/link";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Optional path to go back to. If provided, renders a back link. */
  backTo?: string;
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
  backTo,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex items-center gap-3 px-5 pt-6 pb-3", className)}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="touch-target flex items-center justify-center rounded-xl text-foreground transition-all duration-150 hover:bg-muted active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </button>
      ) : null}
      {backTo ? (
        <Link
          href={backTo}
          className="touch-target flex items-center justify-center rounded-xl text-foreground transition-all duration-150 hover:bg-muted active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </Link>
      ) : null}

      <div className="flex-1">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
