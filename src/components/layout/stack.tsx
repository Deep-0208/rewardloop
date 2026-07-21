import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StackProps {
  children: ReactNode;
  /** Flex direction */
  direction?: "row" | "column";
  /** Gap using Tailwind spacing scale */
  gap?: 1 | 2 | 3 | 4 | 6 | 8;
  /** Align items */
  align?: "start" | "center" | "end" | "stretch";
  /** Justify content */
  justify?: "start" | "center" | "end" | "between";
  className?: string;
}

const gapMap = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
} as const;

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
} as const;

const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const;

/**
 * Stack — Flex-based layout with configurable direction, gap, and alignment.
 *
 * Replaces repetitive `flex flex-col gap-*` patterns.
 */
export function Stack({
  children,
  direction = "column",
  gap = 4,
  align = "stretch",
  justify = "start",
  className,
}: StackProps) {
  return (
    <div
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        gapMap[gap],
        alignMap[align],
        justifyMap[justify],
        className,
      )}
    >
      {children}
    </div>
  );
}
