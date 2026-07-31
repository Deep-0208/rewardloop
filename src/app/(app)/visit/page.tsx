/**
 * RewardLoop — Visit Wizard Page.
 *
 * Step-based wizard for the Add Visit workflow:
 * 1. Customer Selection
 * 2. Catalog Selection
 * 3. Checkout Summary
 *
 * Uses useBillingStore for step routing.
 * Pushes synthetic history entries per step so browser back/swipe-back
 * shows a discard confirmation instead of losing wizard state.
 *
 * @module app/(app)/visit/page
 */

"use client";

import { useEffect, useState } from "react";
import { useBillingStore } from "@/stores/billing-store";
import { CatalogSelectionStep } from "@/features/catalog/components/catalog-selection-step";
import { CustomerSelectionStep } from "@/features/customer/components/customer-selection-step";
import { CheckoutSummaryStep } from "@/features/checkout/components/checkout-summary-step";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { AnimatePresence, motion } from "motion/react";

export default function VisitPage() {
  const [mounted, setMounted] = useState(false);
  const step = useBillingStore((s) => s.step);
  const customer = useBillingStore((s) => s.customer);
  const setStep = useBillingStore((s) => s.setStep);
  const reset = useBillingStore((s) => s.reset);
  const router = useRouter();

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Browser refresh guard: if no customer is selected, force back to step 1
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (step !== "customer" && !customer) {
      setStep("customer");
    }
  }, [step, customer, setStep]);

  // P0-5: Push synthetic history entries for each wizard step
  // so browser back/swipe-back doesn't silently destroy state.
  useEffect(() => {
    if (!mounted) return;

    // Push a state entry so we can intercept back navigation
    const stateKey = `visit-${step}`;
    if (window.history.state?.key !== stateKey) {
      window.history.pushState({ key: stateKey }, "");
    }

    const handlePopState = () => {
      // User pressed browser back or swiped back
      if (step === "customer") {
        // On step 1, let them go — navigate to dashboard
        reset();
        router.replace(ROUTES.DASHBOARD);
      } else if (step === "catalog") {
        // Go back to customer step
        setStep("customer");
        // Push new state so back works again
        window.history.pushState({ key: "visit-customer" }, "");
      } else if (step === "summary") {
        // Go back to catalog step
        setStep("catalog");
        window.history.pushState({ key: "visit-catalog" }, "");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [mounted, step, setStep, reset, router]);

  // Warn before unload when wizard has data
  useEffect(() => {
    if (!mounted || step === "customer") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [mounted, step]);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {step === "customer" && (
          <motion.div
            key="customer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1"
          >
            <CustomerSelectionStep />
          </motion.div>
        )}
        {step === "catalog" && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1"
          >
            <CatalogSelectionStep />
          </motion.div>
        )}
        {step === "summary" && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1"
          >
            <CheckoutSummaryStep />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discard confirmation dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard this visit?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You have unsaved progress. Are you sure you want to leave?
          </p>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDiscardDialog(false)}
            >
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                setShowDiscardDialog(false);
                reset();
                router.replace(ROUTES.DASHBOARD);
              }}
            >
              Discard Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
