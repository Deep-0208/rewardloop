"use client";

/**
 * NumberInput — Numeric input for currency and percentage values.
 *
 * Uses inputMode="numeric" for mobile numeric keyboard.
 * Source: 09_UI_UX_Specification §13 (Currency/Percentage inputs)
 */

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forwardRef, type ComponentProps, type ReactNode } from "react";

interface NumberInputProps extends Omit<
  ComponentProps<typeof Input>,
  "type" | "inputMode" | "prefix" | "suffix"
> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  /** Prefix element (e.g., ₹ symbol) */
  prefix?: ReactNode;
  /** Suffix element (e.g., % symbol) */
  suffix?: ReactNode;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(
    {
      label,
      error,
      helperText,
      required,
      prefix,
      suffix,
      className,
      id,
      ...props
    },
    ref,
  ) {
    const fieldId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : "number-input");

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <Label
            htmlFor={fieldId}
            className="text-sm font-medium text-foreground"
          >
            {label}
            {required ? (
              <span className="ml-0.5 text-destructive" aria-hidden="true">
                *
              </span>
            ) : null}
          </Label>
        ) : null}

        <div className="relative flex items-center">
          {prefix ? (
            <span className="absolute left-3 text-sm font-medium text-muted-foreground select-none">
              {prefix}
            </span>
          ) : null}
          <Input
            ref={ref}
            id={fieldId}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={cn(
              "h-12 rounded-xl tabular-nums",
              prefix && "pl-10",
              suffix && "pr-10",
              error &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
              className,
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error
                ? `${fieldId}-error`
                : helperText
                  ? `${fieldId}-helper`
                  : undefined
            }
            {...props}
          />
          {suffix ? (
            <span className="absolute right-3 text-sm font-medium text-muted-foreground select-none">
              {suffix}
            </span>
          ) : null}
        </div>

        {error ? (
          <p
            id={`${fieldId}-error`}
            className="text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : helperText ? (
          <p id={`${fieldId}-helper`} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
