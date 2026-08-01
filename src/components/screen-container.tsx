import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "@/types/common";

/**
 * ScreenContainer — Page-level content wrapper.
 *
 * Provides consistent padding, flex-grow, and scroll behavior
 * per the design system (16px horizontal padding, 24px section gaps).
 */
export function ScreenContainer({ children, className }: PropsWithChildren) {
  return (
    <main
      className={cn(
        "flex flex-1 flex-col gap-4 overflow-y-auto px-5 pt-1 pb-28 stagger-children",
        className,
      )}
    >
      {children}
    </main>
  );
}
