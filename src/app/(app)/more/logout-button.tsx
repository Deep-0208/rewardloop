"use client";

import { LogOut, Loader2 } from "@/components/icons";
import { useState } from "react";
import posthog from "posthog-js";

/**
 * LogoutButton — Client component for signing out.
 */
export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Import the logout action dynamically to keep server-only imports clean
      const { logout } = await import("@/features/auth/actions");
      await logout();
      posthog.reset();
      window.location.replace("/login");
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      className="group flex w-full items-center gap-3.5 p-4 transition-colors duration-200 hover:bg-destructive/5 active:bg-destructive/10 outline-none disabled:opacity-50 cursor-pointer"
      onClick={handleLogout}
      disabled={loading}
      type="button"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-transform duration-200 group-hover:scale-105">
        {loading ? <Loader2 className="size-5 animate-spin" /> : <LogOut className="size-5" />}
      </div>
      <div className="flex flex-1 flex-col min-w-0 text-left">
        <span className="text-sm font-semibold text-destructive truncate">
          {loading ? "Signing out..." : "Sign Out"}
        </span>
      </div>
    </button>
  );
}
