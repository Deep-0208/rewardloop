"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "@/components/icons";

export function useIsOffline() {
  const [isOffline, setIsOffline] = useState(() =>
    typeof window !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    let pingInterval: NodeJS.Timeout;

    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health", {
          method: "GET",
          cache: "no-store",
        });
        if (res.ok) {
          setIsOffline(false);
        } else {
          setIsOffline(true);
        }
      } catch {
        setIsOffline(true);
      }
    };

    const handleOnline = () => {
      checkHealth();
      pingInterval = setInterval(checkHealth, 10000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      if (pingInterval) clearInterval(pingInterval);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (navigator.onLine) {
      handleOnline();
    } else {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (pingInterval) clearInterval(pingInterval);
    };
  }, []);

  return isOffline;
}

export function NetworkStatusBanner() {
  const isOffline = useIsOffline();

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-red-500 text-white px-4 py-2 text-sm flex items-center justify-center gap-2 font-medium z-50 animate-in slide-in-from-top-full duration-300"
    >
      <AlertCircle className="w-4 h-4" />
      <span>
        You are currently offline. Checkouts are temporarily disabled.
      </span>
      <RefreshCw className="w-3 h-3 animate-spin ml-2 opacity-70" />
    </div>
  );
}
