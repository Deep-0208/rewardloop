"use client";

import { useEffect } from "react";
import { logger } from "@/lib/observability/logger";

export function ServiceWorkerRegistry() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          logger.debug("Service Worker registered with scope:", {
            scope: registration.scope,
          });
        })
        .catch((error) => {
          logger.error("Service Worker registration failed:", error);
        });

      // Listen for messages from the service worker (e.g. background sync triggers)
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "TRIGGER_SYNC") {
          logger.info("Service Worker requested background sync");
          window.dispatchEvent(new Event("offline-queue-updated"));
        }
      });
    }
  }, []);

  return null;
}
