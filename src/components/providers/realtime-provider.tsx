"use client";

import { useRealtimeSync } from "@/hooks/use-realtime-sync";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeSync();
  return <>{children}</>;
}
