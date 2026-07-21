"use client";

/**
 * FormField — Form field wrapper with label, helper text, and error display.
 *
 * Provides consistent form field layout per 09_UI_UX_Specification §13.
 * Labels above fields. Errors shown directly below in color-error.
 */

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ReactNode, ComponentProps } from "react";

interface FormFieldProps extends Omit<
  ComponentProps<typeof Input>,
  "prefix" | "suffix"
> {
  /** Field label text */
  label: string;
  /** Optional helper text below the input */
  helperText?: string;
  /** Error message — shows in destructive color */
  error?: string;
  /** Mark as required with asterisk */
  required?: boolean;
  /** Prefix element (e.g., currency symbol) */
  prefix?: ReactNode;
  /** Suffix element (e.g., icon) */
  suffix?: ReactNode;
  /** Container className */
  containerClassName?: string;
}

export function FormField({
  label,
  helperText,
  error,
  required,
  prefix,
  suffix,
  containerClassName,
  className,
  id,
  ...inputProps
}: FormFieldProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <Label htmlFor={fieldId} className="text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>

      <div className="relative flex items-center">
        {prefix ? (
          <span className="absolute left-3 text-sm text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <Input
          id={fieldId}
          className={cn(
            "h-12 rounded-xl",
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
          {...inputProps}
        />
        {suffix ? (
          <span className="absolute right-3 text-muted-foreground">
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
}
