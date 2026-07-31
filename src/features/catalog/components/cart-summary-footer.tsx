"use client";

import { IndianRupee } from "@/components/icons";
import { formatCurrency } from "@/utils";
import type { Paise } from "@/types";
import { useIsOffline } from "@/components/layout/network-status-banner";
import { Button } from "@/components/ui/button";

interface CartSummaryFooterProps {
  readonly totalItems: number;
  readonly totalQuantity: number;
  readonly subtotal: Paise;
  readonly onContinue: () => void;
  readonly className?: string;
}

/**
 * CartSummaryFooter — Sticky bottom bar for the catalog step.
 *
 * Designed with a premium glassmorphic background, clean typography,
 * and standard Tailwind utility classes instead of inline styles.
 */
export function CartSummaryFooter({
  totalItems,
  totalQuantity,
  subtotal,
  onContinue,
  className = "",
}: CartSummaryFooterProps) {
  const isOffline = useIsOffline();
  const isEmpty = totalItems === 0;
  const isContinueDisabled = isEmpty || isOffline;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[60] bg-background/80 backdrop-blur-xl border-t border-border/40 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_32px_rgba(0,0,0,0.04)] ${className}`}
    >
      <div className="max-w-[768px] mx-auto w-full flex flex-col gap-4">
        {/* Cart Info */}
        <div
          className={`flex items-center justify-between px-1 py-1 ${
            isEmpty ? "opacity-60" : ""
          }`}
        >
          <div className="flex flex-col text-left">
            <div className="flex items-center text-[12px] font-bold tracking-wider uppercase text-muted-foreground mb-1">
              {isEmpty
                ? "No items selected"
                : `${totalItems} ${totalItems === 1 ? "Item" : "Items"} Selected`}
            </div>
            <div className="text-[22px] font-bold tracking-tight text-foreground leading-none">
              Total: {formatCurrency(subtotal)}
            </div>
          </div>
          
          <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${isEmpty ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary shadow-sm'}`}>
            <IndianRupee className="size-6" />
          </div>
        </div>

        {/* Continue CTA */}
        <Button
          size="full"
          className="h-14 text-[16px] font-bold shadow-[0_4px_16px_rgba(79,70,229,0.3)] transition-all duration-300 active:scale-[0.98]"
          disabled={isContinueDisabled}
          onClick={onContinue}
        >
          {isOffline ? "Offline" : "Continue to Checkout"}
          {!isOffline && (
            <svg
              className="ml-2 size-5"
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
          )}
        </Button>
      </div>
    </div>
  );
}
