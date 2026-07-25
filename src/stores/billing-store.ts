/**
 * RewardLoop — Billing Store.
 *
 * Zustand store managing the complete Add Visit workflow state.
 * Owns: wizard step, selected customer, cart items, and subtotal.
 *
 * State is ephemeral (lost on hard refresh → redirects to step 1).
 * Cart is preserved when navigating back to Customer Selection.
 *
 * @module stores/billing-store
 */

"use client";

import { create } from "zustand";
import { calculateSubtotal } from "@/lib/billing/billing-math";
import type { Paise, UUID } from "@/types";
import type { RewardSummary } from "@/features/reward/types";
import type { CheckoutSummary } from "@/features/checkout/types";
import type { VisitPaymentMethod } from "@/features/checkout/types";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

/** Wizard step progression */
export type BillingStep = "customer" | "catalog" | "reward" | "summary";

/** Selected customer for the current visit */
export interface SelectedCustomer {
  readonly id: UUID;
  readonly phone: string;
  readonly name: string | null;
}

/** A single item in the billing cart */
export interface CartItem {
  readonly catalogItemId: UUID;
  readonly name: string;
  readonly unitPrice: Paise;
  readonly quantity: number;
}

/* ─── State Shape ───────────────────────────────────────────────────────────── */

interface BillingState {
  /** Current wizard step */
  step: BillingStep;

  /** Selected customer (set in step 1) */
  customer: SelectedCustomer | null;

  /** Cart items (built in step 2) */
  items: CartItem[];

  /** Reward amount selected for the current bill, in paise. */
  rewardAppliedPaise: Paise;

  /** Last server-authoritative reward summary for the current bill. */
  rewardSummary: RewardSummary | null;

  /** Last server-authoritative checkout review for the current bill. */
  checkoutSummary: CheckoutSummary | null;

  /** Selected payment method for the final visit commit. */
  paymentMethod: VisitPaymentMethod;

  /** A verified, single-use reward OTP token for this pending visit. */
  otpVerifiedToken: UUID | null;
}

interface BillingActions {
  /** Navigate to a specific wizard step */
  setStep: (step: BillingStep) => void;

  /** Set the selected customer */
  setCustomer: (customer: SelectedCustomer) => void;

  /**
   * Add an item to the cart.
   * If the item already exists, increment its quantity by 1.
   * Otherwise, add it with quantity 1.
   */
  addItem: (item: Omit<CartItem, "quantity">) => void;

  /**
   * Update the quantity of a cart item by a delta (+1 or -1).
   * If the resulting quantity is less than 1, the item is removed.
   */
  updateQuantity: (catalogItemId: UUID, delta: number) => void;

  /** Remove an item from the cart entirely */
  removeItem: (catalogItemId: UUID) => void;

  /** Set the validated reward amount for the current bill. */
  setRewardAppliedPaise: (rewardAppliedPaise: Paise) => void;

  /** Store the latest reward calculation returned by the server. */
  setRewardSummary: (rewardSummary: RewardSummary | null) => void;

  /** Clear a pending redemption and its server summary. */
  resetReward: () => void;

  /** Store the latest checkout review returned by the server. */
  setCheckoutSummary: (checkoutSummary: CheckoutSummary | null) => void;

  setPaymentMethod: (paymentMethod: VisitPaymentMethod) => void;

  setOtpVerifiedToken: (otpVerifiedToken: UUID | null) => void;

  /** Calculate the subtotal in paise */
  getSubtotal: () => Paise;

  /** Get total number of unique items in cart */
  getTotalItems: () => number;

  /** Get total quantity across all items */
  getTotalQuantity: () => number;

  /** Reset the entire billing flow */
  reset: () => void;
}

/* ─── Initial State ─────────────────────────────────────────────────────────── */

const initialState: BillingState = {
  step: "customer",
  customer: null,
  items: [],
  rewardAppliedPaise: 0,
  rewardSummary: null,
  checkoutSummary: null,
  paymentMethod: "cash",
  otpVerifiedToken: null,
};

/* ─── Store ─────────────────────────────────────────────────────────────────── */

export const useBillingStore = create<BillingState & BillingActions>(
  (set, get) => ({
    ...initialState,

    setStep: (step) => set({ step }),

    setCustomer: (customer) =>
      set({
        customer,
        rewardAppliedPaise: 0,
        rewardSummary: null,
        checkoutSummary: null,
        otpVerifiedToken: null,
      }),

    addItem: (item) =>
      set((state) => {
        const existing = state.items.find(
          (i) => i.catalogItemId === item.catalogItemId,
        );

        if (existing) {
          return {
            items: state.items.map((i) =>
              i.catalogItemId === item.catalogItemId
                ? { ...i, quantity: i.quantity + 1 }
                : i,
            ),
            rewardAppliedPaise: 0,
            rewardSummary: null,
            checkoutSummary: null,
            otpVerifiedToken: null,
          };
        }

        return {
          items: [...state.items, { ...item, quantity: 1 }],
          rewardAppliedPaise: 0,
          rewardSummary: null,
          checkoutSummary: null,
          otpVerifiedToken: null,
        };
      }),

    updateQuantity: (catalogItemId, delta) =>
      set((state) => {
        const updated = state.items
          .map((i) =>
            i.catalogItemId === catalogItemId
              ? { ...i, quantity: i.quantity + delta }
              : i,
          )
          .filter((i) => i.quantity >= 1);

        return {
          items: updated,
          rewardAppliedPaise: 0,
          rewardSummary: null,
          checkoutSummary: null,
          otpVerifiedToken: null,
        };
      }),

    removeItem: (catalogItemId) =>
      set((state) => ({
        items: state.items.filter((i) => i.catalogItemId !== catalogItemId),
        rewardAppliedPaise: 0,
        rewardSummary: null,
        checkoutSummary: null,
        otpVerifiedToken: null,
      })),

    setRewardAppliedPaise: (rewardAppliedPaise) =>
      set({
        rewardAppliedPaise,
        checkoutSummary: null,
        otpVerifiedToken: null,
      }),

    setRewardSummary: (rewardSummary) => set({ rewardSummary }),

    resetReward: () =>
      set({
        rewardAppliedPaise: 0,
        rewardSummary: null,
        checkoutSummary: null,
        otpVerifiedToken: null,
      }),

    setCheckoutSummary: (checkoutSummary) => set({ checkoutSummary }),

    setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

    setOtpVerifiedToken: (otpVerifiedToken) => set({ otpVerifiedToken }),

    getSubtotal: () => {
      const { items } = get();
      return calculateSubtotal(
        items.map((item) => ({
          unitPricePaise: item.unitPrice,
          quantity: item.quantity,
        })),
      );
    },

    getTotalItems: () => get().items.length,

    getTotalQuantity: () =>
      get().items.reduce((total, item) => total + item.quantity, 0),

    reset: () => set(initialState),
  }),
);
