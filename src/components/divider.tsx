import { cn } from "@/lib/utils";

interface DividerProps {
  className?: string;
}

/**
 * Divider — Semantic horizontal rule.
 *
 * Uses the design system border color.
 */
export function Divider({ className }: DividerProps) {
  return (
    <hr className={cn("border-t border-border", className)} role="separator" />
  );
}
