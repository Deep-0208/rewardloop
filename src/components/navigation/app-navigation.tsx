"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNavigation, type BottomNavItem } from "./bottom-navigation";
import {
  LayoutDashboard,
  Plus,
  BarChart3,
  MoreVertical,
  AlertTriangle,
  CreditCard,
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
  const selectedServices = useBillingStore((s) => s.selectedServices);
  const selectedProducts = useBillingStore((s) => s.selectedProducts);
  const resetStore = useBillingStore((s) => s.reset);

  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const hasUnsavedVisit = Boolean(
    customer || selectedServices.length > 0 || selectedProducts.length > 0,
  );
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
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
      onClick: () => handleNavClick("/dashboard"),
    },
    {
      key: "transactions",
      label: "Sales",
      icon: CreditCard,
      active: pathname.startsWith("/transactions"),
      onClick: () => handleNavClick("/transactions"),
    },
    {
      key: "visit",
      label: "",
      icon: Plus,
      custom: (
        <button
          type="button"
          onClick={() => handleNavClick("/visit")}
          className="absolute -top-6 flex items-center justify-center w-[64px] h-[64px] bg-primary rounded-full text-primary-foreground border-[6px] border-background shadow-[0_8px_30px_hsl(var(--primary)/0.5)] transition-all duration-150 active:scale-95 cursor-pointer hover:brightness-110"
          aria-label="New Visit"
        >
          <Plus className="size-8" strokeWidth={2.5} />
        </button>
      ),
    },
    {
      key: "insights",
      label: "Insights",
      icon: BarChart3,
      active: pathname.startsWith("/insights"),
      onClick: () => handleNavClick("/insights"),
    },
    {
      key: "more",
      label: "More",
      icon: MoreVertical,
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
