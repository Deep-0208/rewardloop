import { cn } from "@/lib/utils";

interface SpacerProps {
  /** Fixed size using spacing scale */
  size?: 1 | 2 | 3 | 4 | 6 | 8;
  /** Flex grow to fill remaining space */
  flex?: boolean;
  className?: string;
}

const sizeMap = {
  1: "h-1",
  2: "h-2",
  3: "h-3",
  4: "h-4",
  6: "h-6",
  8: "h-8",
} as const;

/**
 * Spacer — Flexible spacer for pushing content apart.
 *
 * Use `flex` to fill remaining space (e.g., between form and CTA).
 * Use `size` for fixed vertical spacing.
 */
export function Spacer({ size, flex, className }: SpacerProps) {
  return (
    <div
      className={cn(flex && "flex-1", size && sizeMap[size], className)}
      aria-hidden="true"
    />
  );
}
