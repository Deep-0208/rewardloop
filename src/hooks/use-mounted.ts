"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe mount detection.
 *
 * Returns `false` during server rendering and `true` after hydration.
 * Uses useSyncExternalStore for React 19 compliance.
 */

function subscribe(callback: () => void): () => void {
  // No-op: mount state never changes after initial render
  void callback;
  return () => {};
}

function getSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
