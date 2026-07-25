"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNavigation, type BottomNavItem } from "./bottom-navigation";
import {
  Home,
  Receipt,
  PlusCircle,
  TrendingUp,
  MoreHorizontal,
  AlertTriangle,
} from "@/components/icons";
import { useBillingStore } from "@/stores/billing-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * AppNavigation — Active-route aware bottom navigation container with unsaved visit protection.
 */
export function AppNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const step = useBillingStore((s) => s.step);
  const customer = useBillingStore((s) => s.customer);
  const items = useBillingStore((s) => s.items);
  const resetStore = useBillingStore((s) => s.reset);

  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const hasUnsavedVisit = Boolean(customer || items.length > 0);
  const isInsideActiveWizard =
    pathname.startsWith("/visit") && step !== "customer";

  const handleNavClick = (href: string) => {
    if (pathname.startsWith("/visit") && hasUnsavedVisit && href !== "/visit") {
      setPendingHref(href);
      return;
    }
    router.push(href);
  };

  const confirmDiscard = () => {
    if (pendingHref) {
      resetStore();
      const target = pendingHref;
      setPendingHref(null);
      router.push(target);
    }
  };

  // Hide BottomNavigation during active wizard steps (Catalog, Reward, Summary) to prevent UI collisions
  if (isInsideActiveWizard) {
    return null;
  }

  const navItems: BottomNavItem[] = [
    {
      key: "dashboard",
      label: "Home",
      icon: Home,
      active: pathname === "/dashboard",
      onClick: () => handleNavClick("/dashboard"),
    },
    {
      key: "transactions",
      label: "History",
      icon: Receipt,
      active: pathname.startsWith("/transactions"),
      onClick: () => handleNavClick("/transactions"),
    },
    {
      key: "visit",
      label: "",
      icon: PlusCircle,
      custom: (
        <button
          type="button"
          onClick={() => handleNavClick("/visit")}
          className="absolute -top-5 flex items-center justify-center w-[56px] h-[56px] bg-primary rounded-full text-primary-foreground border-4 border-background animate-fab-glow transition-all duration-150 active:scale-90 cursor-pointer hover:brightness-110"
          aria-label="New Visit"
        >
          <PlusCircle className="size-6" strokeWidth={2.5} />
        </button>
      ),
    },
    {
      key: "insights",
      label: "Insights",
      icon: TrendingUp,
      active: pathname.startsWith("/insights"),
      onClick: () => handleNavClick("/insights"),
    },
    {
      key: "more",
      label: "More",
      icon: MoreHorizontal,
      active: pathname.startsWith("/more"),
      onClick: () => handleNavClick("/more"),
    },
  ];

  return (
    <>
      <BottomNavigation items={navItems} />

      <Dialog
        open={Boolean(pendingHref)}
        onOpenChange={(open) => !open && setPendingHref(null)}
      >
        <DialogContent className="max-w-[360px] rounded-2xl">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              Discard Current Visit?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              You have an in-progress visit. Navigating away will clear the
              selected customer and cart.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="destructive"
              onClick={confirmDiscard}
              className="w-full h-11 rounded-xl font-semibold"
            >
              Discard Visit
            </Button>
            <Button
              variant="outline"
              onClick={() => setPendingHref(null)}
              className="w-full h-11 rounded-xl"
            >
              Keep Editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
