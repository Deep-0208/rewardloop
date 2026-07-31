/**
 * RewardLoop — Cart Item Row.
 *
 * Renders inside the cart drawer. Shows item name, price,
 * and +/- quantity controls with proper ARIA labels.
 *
 * @module features/catalog/components/cart-item-row
 */

"use client";

import { cn } from "@/lib/utils";
import { Plus, Minus, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils";
import type { Paise } from "@/types";

interface CartItemRowProps {
  readonly id: string;
  readonly name: string;
  readonly unitPrice: Paise;
  readonly quantity: number;
  readonly onIncrement: (id: string) => void;
  readonly onDecrement: (id: string) => void;
  readonly className?: string;
}

/**
 * CartItemRow — Single cart entry with quantity controls.
 *
 * - Decrement at quantity 1 removes the item (shows trash icon).
 * - Accessible button labels describe the action and item name.
 */
export function CartItemRow({
  id,
  name,
  unitPrice,
  quantity,
  onIncrement,
  onDecrement,
  className,
}: CartItemRowProps) {
  const isLastUnit = quantity === 1;
  const lineTotal = unitPrice * quantity;

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border/50 py-3 last:border-b-0",
        className,
      )}
    >
      {/* Item info */}
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <span className="truncate text-sm font-medium text-foreground">
          {name}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatCurrency(unitPrice)} × {quantity} ={" "}
          <span className="font-medium text-foreground">
            {formatCurrency(lineTotal)}
          </span>
        </span>
      </div>

      {/* Quantity controls */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 touch-target shrink-0"
          onClick={() => onDecrement(id)}
          aria-label={
            isLastUnit
              ? `Remove ${name} from cart`
              : `Decrease quantity of ${name}`
          }
        >
          {isLastUnit ? (
            <Trash2 className="size-4 text-destructive" />
          ) : (
            <Minus className="size-4" />
          )}
        </Button>

        <span
          className="flex w-8 items-center justify-center text-sm font-semibold tabular-nums"
          aria-label={`${quantity} units`}
        >
          {quantity}
        </span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 touch-target shrink-0"
          onClick={() => onIncrement(id)}
          aria-label={`Increase quantity of ${name}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
