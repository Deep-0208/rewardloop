/**
 * RewardLoop — Cart Summary Footer.
 *
 * Sticky bottom bar showing item count, quantity, subtotal,
 * and the "Continue" CTA. Expands cart drawer on tap.
 *
 * @module features/catalog/components/cart-summary-footer
 */

"use client";

import { cn } from "@/lib/utils";
import { ChevronUp } from "@/components/icons";
import { formatCurrency } from "@/utils";
import type { Paise } from "@/types";

interface CartSummaryFooterProps {
  readonly totalItems: number;
  readonly totalQuantity: number;
  readonly subtotal: Paise;
  readonly onExpandCart: () => void;
  readonly onContinue: () => void;
  readonly className?: string;
}

/**
 * CartSummaryFooter — Sticky bottom bar for the catalog step.
 *
 * - Shows "X Items | Y Qty | ₹Z".
 * - Tap summary area to expand cart drawer.
 * - Continue button disabled when cart is empty.
 * - aria-live region announces subtotal changes.
 */
export function CartSummaryFooter({
  totalItems,
  totalQuantity,
  subtotal,
  onExpandCart,
  onContinue,
  className,
}: CartSummaryFooterProps) {
  const isEmpty = totalItems === 0;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40",
        "border-t border-border/20 bg-card/95 backdrop-blur-xl",
        "shadow-[0_-8px_32px_rgba(0,0,0,0.08)]",
        "p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg flex-col gap-3">
        {/* Subtotal & Status Row */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onExpandCart}
            disabled={isEmpty}
            className="flex items-center gap-2 text-left disabled:opacity-50 group cursor-pointer"
            aria-label={
              isEmpty
                ? "Cart is empty"
                : `View cart: ${totalItems} items, ${totalQuantity} quantity, total ${formatCurrency(subtotal)}`
            }
          >
            <div>
              <p className="text-[13px] font-medium text-muted-foreground">
                {isEmpty
                  ? "No services selected"
                  : `${totalItems} ${totalItems === 1 ? "Service" : "Services"} Selected`}
              </p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
                Total: {formatCurrency(subtotal)}
              </p>
            </div>
            {!isEmpty && (
              <ChevronUp className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5" />
            )}
          </button>

          {!isEmpty && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 uppercase tracking-wider dark:text-emerald-400">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Ready
            </div>
          )}
        </div>

        {/* Continue Action Button */}
        <button
          type="button"
          disabled={isEmpty}
          onClick={onContinue}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[0_4px_16px_rgba(79,70,229,0.3)] transition-all cursor-pointer active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
          aria-label="Continue to Reward Calculation"
        >
          <span>Continue</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}
