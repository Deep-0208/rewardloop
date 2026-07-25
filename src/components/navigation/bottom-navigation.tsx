"use client";

/**
 * BottomNavigation — Premium floating mobile bottom navigation bar.
 *
 * Floating glass material, rounded, 5 items max, with a raised FAB center button.
 * Source: Reference project BottomNav + 09_UI_UX_Specification §14
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
  /** Whether this is the center FAB action */
  isFab?: boolean;
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
        "flex h-[72px] w-[calc(100%-32px)] max-w-[400px] items-center justify-around",
        "rounded-3xl px-2",
        "bg-background/95 backdrop-blur-xl",
        "shadow-[var(--shadow-float)]",
        "pb-safe",
        className,
      )}
      aria-label="Main navigation"
    >
      {items.map((item) => {
        /* ── Center FAB ── */
        if (item.custom) {
          return (
            <div
              key={item.key}
              className="relative flex items-center justify-center min-w-[60px] h-full"
            >
              {item.custom}
            </div>
          );
        }

        const Icon = item.icon;
        const isActive = item.active;

        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center justify-center gap-[3px] w-[60px] h-full",
              "transition-all duration-150 cursor-pointer select-none relative",
              isActive
                ? "text-primary"
                : "text-muted-foreground/70 hover:text-muted-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
          >
            <Icon
              className="size-[22px]"
              strokeWidth={isActive ? 2.5 : 1.8}
              fill={isActive ? "currentColor" : "none"}
            />
            <span
              className={cn(
                "text-[10px] font-semibold leading-none",
                isActive && "text-primary",
              )}
            >
              {item.label}
            </span>
            {/* Active dot indicator */}
            {isActive && (
              <div className="absolute bottom-[6px] w-1 h-1 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
