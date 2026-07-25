import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PhoneInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  onChange: (value: string) => void;
  hasError?: boolean;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, disabled, hasError, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Strip any non-digit characters and limit to 10 digits
      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
      onChange(val);
    };

    return (
      <div className="flex relative">
        <div
          aria-hidden="true"
          className={cn(
            "flex items-center justify-center bg-muted border border-r-0 rounded-l-xl px-3.5 text-muted-foreground text-sm font-semibold select-none",
            disabled && "opacity-50 cursor-not-allowed",
            hasError && "border-destructive text-destructive",
          )}
        >
          +91
        </div>
        <Input
          type="tel"
          inputMode="numeric"
          aria-label="10-digit Indian mobile number"
          placeholder="Enter 10-digit number"
          className={cn(
            "rounded-l-none pl-3",
            hasError && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          disabled={disabled}
          maxLength={10}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";
