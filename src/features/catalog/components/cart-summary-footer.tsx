/**
 * RewardLoop — Cart Summary Footer.
 *
 * Sticky bottom bar showing item count, quantity, subtotal,
 * and the "Continue" CTA. Expands cart drawer on tap.
 *
 * @module features/catalog/components/cart-summary-footer
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

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
      className={className}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        backgroundColor: "var(--color-card, #ffffff)",
        borderTop: "1px solid var(--color-border, #e5e7eb)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "512px",
          margin: "0 auto",
          height: "140px",
        }}
      >
        {/* Info Area (Clickable to expand cart) */}
        <button
          type="button"
          onClick={onExpandCart}
          disabled={isEmpty}
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            right: "100px",
            height: "48px",
            background: "transparent",
            border: "none",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            cursor: isEmpty ? "default" : "pointer",
            opacity: isEmpty ? 0.5 : 1,
          }}
          aria-label="View cart"
        >
          <div
            style={{
              fontSize: "13px",
              color: "var(--color-text-secondary, #6b7280)",
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: "100%",
            }}
          >
            {isEmpty
              ? "No services selected"
              : `${totalItems} ${totalItems === 1 ? "Service" : "Services"} Selected`}
            {!isEmpty && (
              <ChevronUp
                className="size-4 inline-block ml-1"
                style={{ verticalAlign: "text-bottom" }}
              />
            )}
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "var(--color-text-primary, #111827)",
              marginTop: "2px",
              whiteSpace: "nowrap",
            }}
          >
            Total: {formatCurrency(subtotal)}
          </div>
        </button>

        {/* Continue Button */}
        <button
          type="button"
          disabled={isEmpty}
          onClick={onContinue}
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            right: "16px",
            height: "56px",
            backgroundColor: "var(--color-primary, #4F46E5)",
            color: "var(--color-primary-foreground, #ffffff)",
            borderRadius: "16px",
            fontWeight: "bold",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            cursor: isEmpty ? "default" : "pointer",
            opacity: isEmpty ? 0.5 : 1,
            width: "calc(100% - 32px)",
          }}
          aria-label="Continue to Reward Calculation"
        >
          Continue
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
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
