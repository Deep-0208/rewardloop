"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "@/components/icons";
import { useState } from "react";

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
      window.location.replace("/login");
    } catch {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 h-auto p-4 rounded-none text-destructive hover:text-destructive hover:bg-destructive/10 outline-none"
      onClick={handleLogout}
      disabled={loading}
    >
      <LogOut className="size-5 shrink-0" />
      <span className="text-sm font-medium">
        {loading ? "Signing out..." : "Sign Out"}
      </span>
    </Button>
  );
}
