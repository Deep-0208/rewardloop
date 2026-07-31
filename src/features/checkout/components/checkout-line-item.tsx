import type { CheckoutLineItem } from "../types";
import { formatCurrency } from "@/utils";

export function CheckoutLine({ item }: { readonly item: CheckoutLineItem }) {
  return (
    <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {item.name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatCurrency(item.unitPricePaise)} × {item.quantity}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums">
        {formatCurrency(item.totalPaise)}
      </span>
    </li>
  );
}
