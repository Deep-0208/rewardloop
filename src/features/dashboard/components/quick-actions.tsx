"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Receipt, TrendingUp } from "@/components/icons";

/**
 * QuickActions — Primary action buttons on the dashboard.
 *
 * Provides fast access to the most common workflows.
 */
export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Link href="/visit" className="contents">
        <Button
          variant="ghost"
          className="flex h-auto flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-150 hover:shadow-[var(--shadow-soft)] active:scale-[0.97]"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PlusCircle className="size-5" />
          </div>
          <span className="text-xs font-medium text-foreground">New Visit</span>
        </Button>
      </Link>
      <Link href="/sales" className="contents">
        <Button
          variant="ghost"
          className="flex h-auto flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-150 hover:shadow-[var(--shadow-soft)] active:scale-[0.97]"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Receipt className="size-5" />
          </div>
          <span className="text-xs font-medium text-foreground">History</span>
        </Button>
      </Link>
      <Link href="/insights" className="contents">
        <Button
          variant="ghost"
          className="flex h-auto flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-150 hover:shadow-[var(--shadow-soft)] active:scale-[0.97]"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <TrendingUp className="size-5" />
          </div>
          <span className="text-xs font-medium text-foreground">Insights</span>
        </Button>
      </Link>
    </div>
  );
}
