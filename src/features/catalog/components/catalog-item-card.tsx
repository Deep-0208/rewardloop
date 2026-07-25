/**
 * RewardLoop — Catalog Item Card.
 *
 * Touch-optimized card for a single catalog item.
 * Tapping adds to cart or increments quantity.
 * Displays name, price, type badge, and in-cart indicator.
 *
 * @module features/catalog/components/catalog-item-card
 */

"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils";
import type { CatalogItemType } from "../types";
import type { Paise } from "@/types";

interface CatalogItemCardProps {
  readonly id: string;
  readonly name: string;
  readonly price: Paise;
  readonly type: CatalogItemType;
  readonly quantityInCart: number;
  readonly onTap: (id: string) => void;
  readonly className?: string;
}

/**
 * CatalogItemCard — Renders a single service or product.
 *
 * - Tap to add/increment.
 * - Shows type badge (Service / Product).
 * - Visual ring when item is in cart.
 * - Keyboard accessible (Enter/Space).
 */
export const CatalogItemCard = memo(function CatalogItemCard({
  id,
  name,
  price,
  type,
  quantityInCart,
  onTap,
  className,
}: CatalogItemCardProps) {
  const isInCart = quantityInCart > 0;

  // Icon chooser helper based on item name and type
  const renderIcon = () => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("haircut") || lowerName.includes("hair")) {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="6" r="3"></circle>
          <circle cx="6" cy="18" r="3"></circle>
          <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
          <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
          <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
        </svg>
      );
    }
    if (
      lowerName.includes("shave") ||
      lowerName.includes("trim") ||
      lowerName.includes("beard")
    ) {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 3C7 3 7.5 7 12 7C16.5 7 17 3 17 3"></path>
          <path d="M5 8C5 8 5 14 12 18C19 14 19 8 19 8"></path>
        </svg>
      );
    }
    if (
      lowerName.includes("facial") ||
      lowerName.includes("massage") ||
      lowerName.includes("spa")
    ) {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
      );
    }
    if (type === "product") {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      );
    }
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
      </svg>
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onTap(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap(id);
        }
      }}
      aria-label={`Add ${name} to bill. Price: ${formatCurrency(price)}. Current quantity: ${quantityInCart}.`}
      className={cn(
        "relative flex items-center gap-3.5 rounded-2xl bg-card p-3.5 transition-all duration-200 select-none",
        "cursor-pointer active:scale-[0.97]",
        isInCart
          ? "border-2 border-primary bg-primary/[0.04] shadow-[0_4px_20px_rgba(79,70,229,0.15)] ring-1 ring-primary/20"
          : "border border-border/60 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:border-primary/30",
        className,
      )}
    >
      {/* Icon bubble */}
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
          isInCart
            ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(79,70,229,0.25)]"
            : "bg-primary/10 text-primary",
        )}
      >
        {renderIcon()}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <span className="truncate text-[15px] font-semibold text-foreground tracking-tight leading-tight">
          {name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tabular-nums text-primary tracking-tight">
            {formatCurrency(price)}
          </span>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] font-semibold capitalize rounded-full px-2 py-0.5",
              type === "service"
                ? "bg-primary/10 text-primary dark:bg-primary/20"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            )}
          >
            {type}
          </Badge>
        </div>
      </div>

      {/* Quantity badge */}
      {isInCart ? (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-[0_2px_8px_rgba(79,70,229,0.4)] animate-in zoom-in-75 duration-150">
          {quantityInCart}
        </div>
      ) : null}
    </div>
  );
});
