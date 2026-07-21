"use client";

/**
 * BottomNavigation — Mobile bottom navigation bar.
 *
 * Floating glass material, rounded, 5 items max.
 * Source: 09_UI_UX_Specification §14 — Bottom Navigation
 *
 * Generic component — accepts items as props.
 * No business route bindings.
 */

import { cn } from "@/lib/utils";
import type { LucideIcon } from "@/components/icons";
import type { ReactNode } from "react";

export interface BottomNavItem {
  /** Unique key for the item */
  key: string;
  /** Display label */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Whether this item is currently active */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Optional href for link navigation */
  href?: string;
  /** Custom element (e.g., the center "+" button) */
  custom?: ReactNode;
}

interface BottomNavigationProps {
  items: BottomNavItem[];
  className?: string;
}

export function BottomNavigation({ items, className }: BottomNavigationProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-4 left-1/2 z-40 -translate-x-1/2",
        "flex items-center gap-1 rounded-3xl px-2 py-1.5",
        "border border-border/50 bg-background/85 backdrop-blur-xl",
        "shadow-[var(--shadow-float)]",
        "pb-safe",
        className,
      )}
      aria-label="Main navigation"
    >
      {items.map((item) => {
        if (item.custom) {
          return (
            <div key={item.key} className="px-1">
              {item.custom}
            </div>
          );
        }

        const Icon = item.icon;
        const Component = item.href ? "a" : "button";

        return (
          <Component
            key={item.key}
            href={item.href}
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-1.5 transition-colors",
              "min-w-[48px] touch-target",
              item.active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={item.active ? "page" : undefined}
            aria-label={item.label}
          >
            <Icon className="size-5" strokeWidth={item.active ? 2.5 : 2} />
            <span className="text-[10px] font-medium leading-tight">
              {item.label}
            </span>
          </Component>
        );
      })}
    </nav>
  );
}
