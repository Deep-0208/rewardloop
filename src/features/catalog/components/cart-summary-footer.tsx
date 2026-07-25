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
import { Button } from "@/components/ui/button";
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
        "border-t border-border/30 bg-background/90 backdrop-blur-xl",
        "shadow-[0_-8px_32px_rgba(0,0,0,0.08)]",
        "pb-[env(safe-area-inset-bottom,0px)]",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
        {/* Summary area — tap to expand cart */}
        <button
          type="button"
          onClick={onExpandCart}
          disabled={isEmpty}
          className="flex flex-1 items-center gap-2 text-left disabled:opacity-50"
          aria-label={
            isEmpty
              ? "Cart is empty"
              : `View cart: ${totalItems} items, ${totalQuantity} quantity, total ${formatCurrency(subtotal)}`
          }
        >
          <ChevronUp
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="flex flex-col">
            <span
              className="text-xs text-muted-foreground"
              aria-live="polite"
              aria-atomic="true"
            >
              {totalItems} {totalItems === 1 ? "Item" : "Items"} ·{" "}
              {totalQuantity} Qty
            </span>
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </button>

        {/* Continue CTA */}
        <Button
          onClick={onContinue}
          disabled={isEmpty}
          className="shrink-0"
          aria-label="Continue to Reward Calculation"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
