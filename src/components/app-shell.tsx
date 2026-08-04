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
        "mx-auto flex min-h-dvh w-full max-w-[430px] sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl flex-col bg-background transition-all duration-200",
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
