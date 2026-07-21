import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StickyCTAProps {
  children: ReactNode;
  className?: string;
}

/**
 * StickyCTA — Sticky bottom CTA container.
 *
 * Full-width, safe-area-aware, stays visible on scroll.
 * Source: 09_UI_UX_Specification §14 — Sticky Primary CTA
 *
 * - Full width
 * - 48px minimum height button inside
 * - Safe area aware
 * - Remains visible when scrolling
 */
export function StickyCTA({ children, className }: StickyCTAProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 border-t border-border bg-background px-4 py-3 pb-safe",
        className,
      )}
    >
      {children}
    </div>
  );
}
