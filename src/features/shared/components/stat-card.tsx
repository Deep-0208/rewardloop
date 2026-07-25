import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "@/components/icons";
import type { ReactNode } from "react";

interface StatCardProps {
  /** Card label (e.g., "Today's Revenue") */
  label: string;
  /** Display value (e.g., "₹12,500") */
  value: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Optional trend indicator */
  trend?: ReactNode;
  /** Optional accent color class */
  accentColor?: string;
  className?: string;
}

/**
 * StatCard — KPI stat card for dashboard.
 *
 * Source: 09_UI_UX_Specification §10 — Dashboard Layout
 * Stripe-style KPI cards at the top.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accentColor,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-all duration-150 active:scale-[0.97]",
        className,
      )}
    >
      <CardContent className="flex items-start justify-between p-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <span className="text-2xl font-bold tabular-nums text-foreground tracking-tight">
            {value}
          </span>
          {trend ? <div className="mt-0.5">{trend}</div> : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              accentColor || "bg-primary/10 text-primary",
            )}
          >
            <Icon className="size-5" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
