import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "@/types/common";
import { NetworkStatusBanner } from "./layout/network-status-banner";
import { ServiceWorkerRegistry } from "./service-worker-registry";

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
        "mx-auto flex min-h-dvh w-[430px] max-w-full flex-col bg-background",
        "pt-safe pb-safe pl-safe pr-safe",
        className,
      )}
    >
      <ServiceWorkerRegistry />
      <NetworkStatusBanner />
      {children}
    </div>
  );
}
