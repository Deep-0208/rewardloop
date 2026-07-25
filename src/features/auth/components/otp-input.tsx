import * as React from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

export interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  isValid?: boolean;
}

const SLOT_INDICES = [0, 1, 2, 3, 4, 5] as const;

export const OTPInput = React.forwardRef<
  React.ElementRef<typeof InputOTP>,
  OTPInputProps
>(({ value, onChange, disabled, hasError, isValid: customIsValid }, ref) => {
  const isComplete = value?.length === 6;
  const isGreenValid = customIsValid ?? (isComplete && !hasError);

  return (
    <InputOTP
      ref={ref}
      maxLength={6}
      disabled={disabled}
      value={value}
      onChange={onChange}
      autoFocus
    >
      <InputOTPGroup className="gap-2 sm:gap-3">
        {SLOT_INDICES.map((index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className={cn(
              "w-11 h-13 sm:w-12 sm:h-14 text-xl sm:text-2xl rounded-xl border font-semibold transition-all duration-200",
              hasError &&
                "border-destructive text-destructive bg-destructive/5 focus-visible:ring-destructive animate-shake",
              !hasError &&
                isGreenValid &&
                "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
            )}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
});

OTPInput.displayName = "OTPInput";
