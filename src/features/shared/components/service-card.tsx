"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "@/components/icons";

interface ServiceCardProps {
  /** Service name */
  name: string;
  /** Price display (e.g., "₹500") */
  price: string;
  /** Whether this service is selected */
  selected?: boolean;
  /** Click handler for selection */
  onSelect?: () => void;
  /** Disabled state */
  disabled?: boolean;
  className?: string;
}

/**
 * ServiceCard — Catalog item card for service selection.
 *
 * Interactive selection state with check indicator.
 * Source: 09_UI_UX_Specification §10 — Component Library (CatalogItemCard)
 */
export function ServiceCard({
  name,
  price,
  selected,
  onSelect,
  disabled,
  className,
}: ServiceCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer border transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/30",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onClick={disabled ? undefined : onSelect}
      role="option"
      aria-selected={selected}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {price}
          </span>
        </div>
        {selected ? (
          <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3.5" />
          </div>
        ) : (
          <div className="size-6 rounded-full border-2 border-border" />
        )}
      </CardContent>
    </Card>
  );
}
