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
}

const SLOT_INDICES = [0, 1, 2, 3, 4, 5] as const;

export const OTPInput = React.forwardRef<
  React.ElementRef<typeof InputOTP>,
  OTPInputProps
>(({ value, onChange, disabled, hasError }, ref) => {
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
              "w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl rounded-md border",
              hasError &&
                "border-destructive text-destructive focus-visible:ring-destructive",
            )}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
});

OTPInput.displayName = "OTPInput";
