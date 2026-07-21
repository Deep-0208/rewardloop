"use client";

/**
 * PhoneInput — Phone number input with +91 prefix.
 *
 * Numeric keyboard, auto-formatting.
 * Source: 09_UI_UX_Specification §13 (Input Standards — Phone Number)
 */

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forwardRef, type ComponentProps } from "react";

interface PhoneInputProps extends Omit<
  ComponentProps<typeof Input>,
  "type" | "inputMode"
> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    {
      label = "Phone Number",
      error,
      helperText,
      required,
      className,
      id,
      ...props
    },
    ref,
  ) {
    const fieldId = id || "phone-input";

    return (
      <div className="flex flex-col gap-1.5">
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

        <div className="relative flex items-center">
          <span className="absolute left-3 text-sm font-medium text-muted-foreground select-none">
            +91
          </span>
          <Input
            ref={ref}
            id={fieldId}
            type="tel"
            inputMode="tel"
            maxLength={10}
            placeholder="Enter 10-digit number"
            autoComplete="tel"
            className={cn(
              "h-12 rounded-xl pl-12",
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
