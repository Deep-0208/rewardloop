"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggle = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // Browser safety fallback
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      className="flex items-center gap-2 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
    >
      {isFullscreen ? (
        <>
          <Minimize className="size-4 text-primary" />
          Exit Full Screen
        </>
      ) : (
        <>
          <Maximize className="size-4 text-primary" />
          Full Screen Mode
        </>
      )}
    </Button>
  );
}
