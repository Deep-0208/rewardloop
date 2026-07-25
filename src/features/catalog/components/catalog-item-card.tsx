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
  readonly onIncrement: (id: string) => void;
  readonly onDecrement: (id: string) => void;
  readonly className?: string;
}

/**
 * CatalogItemCard — Renders a single service or product as a 2-column grid box.
 *
 * - Tap card to select (quantity 1).
 * - Shows inline `-` and `+` controls when selected (no arbitrary tap incrementing).
 * - Top-left circular icon bubble, bottom name & price.
 */
export const CatalogItemCard = memo(function CatalogItemCard({
  id,
  name,
  price,
  type,
  quantityInCart,
  onTap,
  onIncrement,
  onDecrement,
  className,
}: CatalogItemCardProps) {
  const isInCart = quantityInCart > 0;

  // Icon chooser helper based on item name and type
  const renderIcon = () => {
    const lowerName = name.toLowerCase();
    if (
      lowerName.includes("haircut") ||
      lowerName.includes("hair color") ||
      lowerName.includes("hair")
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
      lowerName.includes("spa") ||
      lowerName.includes("face")
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
    if (
      type === "product" ||
      lowerName.includes("wax") ||
      lowerName.includes("shampoo") ||
      lowerName.includes("serum") ||
      lowerName.includes("conditioner") ||
      lowerName.includes("oil")
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
      onClick={() => {
        if (!isInCart) {
          onTap(id);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!isInCart) {
            onTap(id);
          }
        }
      }}
      aria-label={`Add ${name} to bill. Price: ${formatCurrency(price)}. Current quantity: ${quantityInCart}.`}
      className={cn(
        "relative flex flex-col justify-between p-4 rounded-3xl transition-all duration-200 select-none min-h-[140px]",
        "cursor-pointer active:scale-[0.98]",
        isInCart
          ? "border-2 border-primary bg-primary/[0.04] shadow-[0_4px_20px_rgba(79,70,229,0.15)] ring-1 ring-primary/20"
          : "border border-border/60 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:border-primary/30",
        className,
      )}
    >
      {/* Top Row: Icon bubble + Quantity controls */}
      <div className="flex items-center justify-between w-full mb-3">
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

        {/* Small + / - Stepper when selected */}
        {isInCart ? (
          <div
            className="flex items-center gap-1 bg-card rounded-full p-1 border border-primary/30 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDecrement(id);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/80 text-xs font-bold transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-4 text-center text-xs font-bold text-primary tabular-nums">
              {quantityInCart}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIncrement(id);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : null}
      </div>

      {/* Bottom Content: Name & Price */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold text-foreground tracking-tight leading-snug line-clamp-1">
          {name}
        </span>
        <span className="text-xs font-bold text-muted-foreground tabular-nums">
          {formatCurrency(price)}
        </span>
      </div>
    </div>
  );
});
