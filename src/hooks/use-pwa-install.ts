import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/constants/storage-keys";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const dismissed = localStorage.getItem(STORAGE_KEYS.PWA_PROMPT_DISMISSED);
      if (!dismissed) {
        setIsInstallable(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    window.addEventListener("appinstalled", () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "dismissed") {
      localStorage.setItem(STORAGE_KEYS.PWA_PROMPT_DISMISSED, "true");
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const dismissPrompt = () => {
    localStorage.setItem(STORAGE_KEYS.PWA_PROMPT_DISMISSED, "true");
    setIsInstallable(false);
  };

  return { isInstallable, promptInstall, dismissPrompt };
}
