import * as React from "react";
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
      <div 
        className={cn(
          "flex relative shadow-sm rounded-[14px] border border-border/60 bg-background overflow-hidden transition-all focus-within:ring-[3px] focus-within:ring-primary/20 focus-within:border-primary h-[52px]",
          hasError && "border-destructive focus-within:ring-destructive focus-within:border-destructive",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div
          aria-hidden="true"
          className="flex items-center justify-center bg-muted/40 border-r border-border/60 px-4 text-muted-foreground text-[15px] font-bold select-none"
        >
          +91
        </div>
        <input
          type="tel"
          inputMode="numeric"
          aria-label="10-digit Indian mobile number"
          placeholder="Enter 10-digit number"
          className={cn(
            "flex-1 bg-transparent border-none outline-none text-[16px] font-medium tracking-wide pl-3 text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed min-w-0",
            className
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
