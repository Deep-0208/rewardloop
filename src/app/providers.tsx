"use client";

/**
 * RewardLoop — Application providers.
 *
 * Composes all client-side providers in a single wrapper.
 * Sprint 1.1: Sonner (toasts) only.
 * TanStack Query provider will be added in a later sprint.
 */

import { Toaster } from "sonner";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: "var(--font-sans)",
          },
        }}
        richColors
        closeButton
      />
    </>
  );
}
