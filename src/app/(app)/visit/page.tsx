/**
 * RewardLoop — Visit Wizard Page.
 *
 * Step-based wizard for the Add Visit workflow:
 * 1. Customer Selection
 * 2. Catalog Selection
 * 3. Reward Calculation
 * 4. Checkout Summary
 *
 * Uses useBillingStore for step routing.
 * On hard refresh, redirects to step 1 (store is ephemeral).
 *
 * @module app/(app)/visit/page
 */

"use client";

import { useEffect, useState } from "react";
import { useBillingStore } from "@/stores/billing-store";
import { CatalogSelectionStep } from "@/features/catalog/components/catalog-selection-step";
import { CustomerSelectionStep } from "@/features/customer/components/customer-selection-step";
import { CheckoutSummaryStep } from "@/features/checkout/components/checkout-summary-step";

export default function VisitPage() {
  const [mounted, setMounted] = useState(false);
  const step = useBillingStore((s) => s.step);
  const customer = useBillingStore((s) => s.customer);
  const setStep = useBillingStore((s) => s.setStep);

  // Browser refresh guard: if no customer is selected, force back to step 1
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (step !== "customer" && !customer) {
      setStep("customer");
    }
  }, [step, customer, setStep]);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  switch (step) {
    case "customer":
      return <CustomerSelectionStep />;

    case "catalog":
      return <CatalogSelectionStep />;

    case "summary":
      return <CheckoutSummaryStep />;
  }
}
