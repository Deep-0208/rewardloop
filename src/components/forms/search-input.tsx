"use client";

/**
 * SearchInput — Search field with icon and clear button.
 *
 * Source: 09_UI_UX_Specification §13 — Auto search, auto focus.
 */

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, X } from "@/components/icons";
import { forwardRef, type ComponentProps } from "react";

interface SearchInputProps extends Omit<ComponentProps<typeof Input>, "type"> {
  /** Called when the clear button is clicked */
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ onClear, value, className, ...props }, ref) {
    const hasValue = value !== undefined && value !== "";

    return (
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            "h-12 rounded-xl pl-10",
            hasValue && "pr-10",
            className,
          )}
          {...props}
        />
        {hasValue && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
            aria-label="Clear search"
          >
            <X className="size-3" />
          </button>
        ) : null}
      </div>
    );
  },
);
