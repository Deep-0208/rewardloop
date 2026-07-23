"use client";

import { useMediaQuery } from "./use-media-query";

/**
 * Convenience hook to detect mobile viewport.
 *
 * Returns `true` when viewport is ≤ 768px wide.
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}
