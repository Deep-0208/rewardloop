"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * LogoutButton — Client component for signing out.
 */
export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Import the logout action dynamically to keep server-only imports clean
      const { logout } = await import("@/features/auth/actions");
      await logout();
      router.push("/login");
    } catch {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border">
      <CardContent className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
          disabled={loading}
        >
          <LogOut className="size-5" />
          <span className="text-sm font-medium">
            {loading ? "Signing out..." : "Sign Out"}
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}
