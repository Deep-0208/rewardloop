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
        "relative flex items-center gap-3 rounded-2xl bg-card p-3 transition-all duration-200 select-none",
        "cursor-pointer active:scale-[0.98]",
        isInCart
          ? "border-2 border-primary shadow-[var(--shadow-soft)]"
          : "border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {/* Leading slot reserved for future image/icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <span className="text-lg" aria-hidden="true">
          {type === "service" ? "✂" : "📦"}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <span className="truncate text-base font-semibold text-foreground tracking-tight leading-tight">
          {name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tabular-nums text-primary tracking-tight">
            {formatCurrency(price)}
          </span>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] capitalize",
              type === "service"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
            )}
          >
            {type}
          </Badge>
        </div>
      </div>

      {/* Quantity badge */}
      {isInCart ? (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {quantityInCart}
        </div>
      ) : null}
    </div>
  );
});
