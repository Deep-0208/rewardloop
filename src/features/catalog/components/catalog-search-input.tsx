/**
 * RewardLoop — Catalog Search Input.
 *
 * Sticky, full-width search bar with clear button.
 * Handles mobile keyboard dismissal via blur on scroll.
 *
 * @module features/catalog/components/catalog-search-input
 */

"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "@/components/icons";
import { Input } from "@/components/ui/input";

interface CatalogSearchInputProps {
  readonly value: string;
  readonly onChange: (query: string) => void;
  readonly onClear: () => void;
  readonly className?: string;
}

/**
 * CatalogSearchInput — Search bar for filtering catalog items.
 *
 * - Magnifying glass icon.
 * - Clear (X) button when text is present.
 * - `role="searchbox"` with proper ARIA.
 */
export function CatalogSearchInput({
  value,
  onChange,
  onClear,
  className,
}: CatalogSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />

      <Input
        ref={inputRef}
        role="searchbox"
        aria-label="Search catalog"
        type="search"
        placeholder="Search services & products..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 pl-9 pr-14"
      />

      {value.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            onClear();
            inputRef.current?.focus();
          }}
          className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
