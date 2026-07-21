import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "@/types/common";

/**
 * AppShell — Mobile-first application container.
 *
 * Centers content in a max-width container optimized for 360–430px viewports.
 * Handles safe area insets.
 */
export function AppShell({ children, className }: PropsWithChildren) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background",
        "pt-safe pb-safe pl-safe pr-safe",
        className,
      )}
    >
      {children}
    </div>
  );
}
