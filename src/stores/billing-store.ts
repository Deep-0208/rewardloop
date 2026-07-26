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
import { persist, createJSONStorage } from "zustand/middleware";
import { calculateSubtotal } from "@/lib/billing/billing-math";
import type { Paise, UUID } from "@/types";
import type { RewardSummary } from "@/features/reward/types";
import type { CheckoutSummary } from "@/features/checkout/types";
import type { VisitPaymentMethod } from "@/features/checkout/types";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

/** Wizard step progression */
export type BillingStep = "customer" | "catalog" | "summary";

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
  readonly type: "service" | "product";
  readonly unitPrice: Paise;
  readonly quantity: number;
}

/* ─── State Shape ───────────────────────────────────────────────────────────── */

interface BillingState {
  /** Current wizard step */
  step: BillingStep;

  /** Selected customer (set in step 1) */
  customer: SelectedCustomer | null;

  /** Selected services (built in step 2) */
  selectedServices: CartItem[];

  /** Selected products (built in step 2) */
  selectedProducts: CartItem[];

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

  addService: (item: Omit<CartItem, "quantity" | "type">) => void;
  addProduct: (item: Omit<CartItem, "quantity" | "type">) => void;
  updateServiceQuantity: (catalogItemId: UUID, delta: number) => void;
  updateProductQuantity: (catalogItemId: UUID, delta: number) => void;
  removeService: (catalogItemId: UUID) => void;
  removeProduct: (catalogItemId: UUID) => void;
  getCartItems: () => CartItem[];

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

  getTotalItems: () => number;
  getTotalServices: () => number;
  getTotalProducts: () => number;
  getServiceSubtotal: () => Paise;
  getProductSubtotal: () => Paise;

  /** Get total quantity across all items */
  getTotalQuantity: () => number;

  /** Reset the entire billing flow */
  reset: () => void;
}

/* ─── Initial State ─────────────────────────────────────────────────────────── */

const initialState: BillingState = {
  step: "customer",
  customer: null,
  selectedServices: [],
  selectedProducts: [],
  rewardAppliedPaise: 0,
  rewardSummary: null,
  checkoutSummary: null,
  paymentMethod: "cash",
  otpVerifiedToken: null,
};

/* ─── Store ─────────────────────────────────────────────────────────────────── */

export const useBillingStore = create<BillingState & BillingActions>()(
  persist(
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

      addService: (item) =>
        set((state) => {
          const existing = state.selectedServices.find(
            (i) => i.catalogItemId === item.catalogItemId,
          );
          if (existing) {
            return {
              selectedServices: state.selectedServices.map((i) =>
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
            selectedServices: [
              ...state.selectedServices,
              { ...item, type: "service", quantity: 1 },
            ],
            rewardAppliedPaise: 0,
            rewardSummary: null,
            checkoutSummary: null,
            otpVerifiedToken: null,
          };
        }),

      addProduct: (item) =>
        set((state) => {
          const existing = state.selectedProducts.find(
            (i) => i.catalogItemId === item.catalogItemId,
          );
          if (existing) {
            return {
              selectedProducts: state.selectedProducts.map((i) =>
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
            selectedProducts: [
              ...state.selectedProducts,
              { ...item, type: "product", quantity: 1 },
            ],
            rewardAppliedPaise: 0,
            rewardSummary: null,
            checkoutSummary: null,
            otpVerifiedToken: null,
          };
        }),

      updateServiceQuantity: (catalogItemId, delta) =>
        set((state) => {
          const updated = state.selectedServices
            .map((i) =>
              i.catalogItemId === catalogItemId
                ? { ...i, quantity: i.quantity + delta }
                : i,
            )
            .filter((i) => i.quantity >= 1);
          return {
            selectedServices: updated,
            rewardAppliedPaise: 0,
            rewardSummary: null,
            checkoutSummary: null,
            otpVerifiedToken: null,
          };
        }),

      updateProductQuantity: (catalogItemId, delta) =>
        set((state) => {
          const updated = state.selectedProducts
            .map((i) =>
              i.catalogItemId === catalogItemId
                ? { ...i, quantity: i.quantity + delta }
                : i,
            )
            .filter((i) => i.quantity >= 1);
          return {
            selectedProducts: updated,
            rewardAppliedPaise: 0,
            rewardSummary: null,
            checkoutSummary: null,
            otpVerifiedToken: null,
          };
        }),

      removeService: (catalogItemId) =>
        set((state) => ({
          selectedServices: state.selectedServices.filter(
            (i) => i.catalogItemId !== catalogItemId,
          ),
          rewardAppliedPaise: 0,
          rewardSummary: null,
          checkoutSummary: null,
          otpVerifiedToken: null,
        })),

      removeProduct: (catalogItemId) =>
        set((state) => ({
          selectedProducts: state.selectedProducts.filter(
            (i) => i.catalogItemId !== catalogItemId,
          ),
          rewardAppliedPaise: 0,
          rewardSummary: null,
          checkoutSummary: null,
          otpVerifiedToken: null,
        })),

      getCartItems: () => {
        const { selectedServices, selectedProducts } = get();
        return [...selectedServices, ...selectedProducts];
      },

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
        return get().getServiceSubtotal() + get().getProductSubtotal();
      },

      getServiceSubtotal: () => {
        return calculateSubtotal(
          get().selectedServices.map((item) => ({
            unitPricePaise: item.unitPrice,
            quantity: item.quantity,
          })),
        );
      },

      getProductSubtotal: () => {
        return calculateSubtotal(
          get().selectedProducts.map((item) => ({
            unitPricePaise: item.unitPrice,
            quantity: item.quantity,
          })),
        );
      },

      getTotalItems: () => get().getCartItems().length,
      getTotalServices: () => get().selectedServices.length,
      getTotalProducts: () => get().selectedProducts.length,

      getTotalQuantity: () =>
        get()
          .getCartItems()
          .reduce((total, item) => total + item.quantity, 0),

      reset: () => set(initialState),
    }),
    {
      name: "billing-storage",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        customer: state.customer,
        selectedServices: state.selectedServices,
        selectedProducts: state.selectedProducts,
        step: state.step, // Persisting step helps UX if they refresh on catalog page
      }),
      merge: (persistedState: unknown, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<BillingState>),
        // Always reset volatile financial state on reload
        rewardAppliedPaise: 0,
        rewardSummary: null,
        checkoutSummary: null,
        otpVerifiedToken: null,
      }),
    },
  ),
);
