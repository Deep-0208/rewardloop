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
>(({ value, onChange, onComplete, disabled, hasError, error, isValid: customIsValid, length = 6, autoFocus = true }, ref) => {
  const isComplete = value?.length === length;
  const isGreenValid = customIsValid ?? (isComplete && !hasError && !error);
  
  // Create an array of indices based on length
  const slotIndices = React.useMemo(() => Array.from({ length }, (_, i) => i), [length]);

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
          {slotIndices.map((index) => (
            <InputOTPSlot
              key={index}
              index={index}
              className={cn(
                "w-11 h-13 sm:w-12 sm:h-14 text-xl sm:text-2xl rounded-xl border font-semibold transition-all duration-200",
                (hasError || error) &&
                  "border-destructive text-destructive bg-destructive/5 focus-visible:ring-destructive animate-shake",
                !(hasError || error) &&
                  isGreenValid &&
                  "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
              )}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
      {error && (
        <p className="text-sm font-medium text-destructive mt-1">{error}</p>
      )}
    </div>
  );
});

OTPInput.displayName = "OTPInput";
