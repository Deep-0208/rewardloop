"use client";

import { useEffect } from "react";

/**
 * Automatically triggers true Native Fullscreen API when the app is launched
 * as a PWA or upon the user's first touch/tap interaction.
 */
export function PwaAutoFullscreen() {
  useEffect(() => {
    const tryFullscreen = async () => {
      if (
        !document.fullscreenElement &&
        typeof document.documentElement.requestFullscreen === "function"
      ) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {
          // Ignored if browser requires user gesture
        }
      }
    };

    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      ("standalone" in navigator &&
        (navigator as { standalone?: boolean }).standalone);

    // Auto-request on PWA launch
    if (isPWA) {
      tryFullscreen();
    }

    // Auto-enter fullscreen on very first screen touch/tap
    const handleFirstTouch = () => {
      tryFullscreen();
      window.removeEventListener("click", handleFirstTouch);
      window.removeEventListener("touchstart", handleFirstTouch);
    };

    window.addEventListener("click", handleFirstTouch, { passive: true });
    window.addEventListener("touchstart", handleFirstTouch, { passive: true });

    return () => {
      window.removeEventListener("click", handleFirstTouch);
      window.removeEventListener("touchstart", handleFirstTouch);
    };
  }, []);

  return null;
}
