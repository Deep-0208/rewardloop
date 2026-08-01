import * as React from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

export interface OTPInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  error?: string;
  isValid?: boolean;
  length?: number;
  autoFocus?: boolean;
}

export const OTPInput = React.forwardRef<
  React.ElementRef<typeof InputOTP>,
  OTPInputProps
>(
  (
    {
      value = "",
      onChange,
      onComplete,
      disabled,
      hasError,
      error,
      isValid: customIsValid,
      length = 6,
      autoFocus = true,
    },
    ref,
  ) => {
    const isComplete = value.length === length;
    const isSuccess = customIsValid ?? (isComplete && !hasError && !error);

    const slotIndices = React.useMemo(
      () => Array.from({ length }, (_, i) => i),
      [length],
    );

    return (
      <div className="flex flex-col items-center gap-2">
        <InputOTP
          ref={ref}
          maxLength={length}
          disabled={disabled}
          value={value}
          onChange={onChange}
          onComplete={onComplete}
          autoFocus={autoFocus}
        >
          <InputOTPGroup className="gap-2 sm:gap-3">
            {slotIndices.map((index) => {
              const isFilled = index < (value?.length || 0);

              return (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={cn(
                    "w-12 h-14 sm:w-13 sm:h-15 text-xl sm:text-2xl font-bold rounded-2xl border transition-all duration-200 shadow-sm",
                    // Default State
                    "border-input/60 bg-muted/20 text-foreground",
                    // Filled State
                    isFilled &&
                      !hasError &&
                      !error &&
                      "border-primary/40 bg-primary/5 text-primary font-bold",
                    // Focused / Active State
                    "data-[active=true]:border-primary data-[active=true]:ring-4 data-[active=true]:ring-primary/15 data-[active=true]:bg-background data-[active=true]:scale-[1.04]",
                    // Success State
                    isSuccess &&
                      !hasError &&
                      !error &&
                      "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-[0_0_12px_rgba(79,70,229,0.2)]",
                    // Error State
                    (hasError || error) &&
                      "border-destructive text-destructive bg-destructive/5 ring-2 ring-destructive/20 animate-shake",
                  )}
                />
              );
            })}
          </InputOTPGroup>
        </InputOTP>

        {error && (
          <p className="text-sm font-medium text-destructive mt-1">{error}</p>
        )}
      </div>
    );
  },
);

OTPInput.displayName = "OTPInput";
