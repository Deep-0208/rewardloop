import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GridProps {
  children: ReactNode;
  /** Number of columns */
  cols?: 1 | 2 | 3 | 4;
  /** Gap using Tailwind spacing scale */
  gap?: 2 | 3 | 4 | 6;
  className?: string;
}

const colsMap = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const;

const gapMap = {
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
} as const;

/**
 * Grid — CSS Grid layout with responsive column configuration.
 *
 * Simple wrapper for common grid patterns.
 */
export function Grid({ children, cols = 2, gap = 4, className }: GridProps) {
  return (
    <div className={cn("grid", colsMap[cols], gapMap[gap], className)}>
      {children}
    </div>
  );
}
