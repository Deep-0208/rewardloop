"use client";

/**
 * OTPInput — 6-digit OTP input.
 *
 * Auto-advance, paste support, backspace moves to previous field.
 * Source: Decision 12 (6 digits), 09_UI_UX_Specification §12–13
 */

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ClipboardEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";

const OTP_LENGTH = 6;

interface OTPInputProps {
  /** Called when all digits are entered */
  onComplete?: (otp: string) => void;
  /** Called on every value change */
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  /** Auto-focus the first input on mount */
  autoFocus?: boolean;
  className?: string;
}

export function OTPInput({
  onComplete,
  onChange,
  label = "Enter OTP",
  error,
  disabled,
  autoFocus = true,
  className,
}: OTPInputProps) {
  const [values, setValues] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < OTP_LENGTH) {
      inputRefs.current[index]?.focus();
    }
  }, []);

  const handleChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const digit = e.target.value.replace(/\D/g, "").slice(-1);
      const next = [...values];
      next[index] = digit;
      setValues(next);

      const otp = next.join("");
      onChange?.(otp);

      if (digit && index < OTP_LENGTH - 1) {
        focusInput(index + 1);
      }

      if (otp.length === OTP_LENGTH && next.every(Boolean)) {
        onComplete?.(otp);
      }
    },
    [values, onChange, onComplete, focusInput],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (!values[index] && index > 0) {
          e.preventDefault();
          const next = [...values];
          next[index - 1] = "";
          setValues(next);
          onChange?.(next.join(""));
          focusInput(index - 1);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [values, onChange, focusInput],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, OTP_LENGTH);

      if (!pasted) return;

      const next = Array.from(
        { length: OTP_LENGTH },
        (_, i) => pasted[i] || "",
      );
      setValues(next);
      onChange?.(next.join(""));

      const lastFilledIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
      focusInput(lastFilledIndex);

      if (pasted.length === OTP_LENGTH) {
        onComplete?.(pasted);
      }
    },
    [onChange, onComplete, focusInput],
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? (
        <Label className="text-sm font-medium text-foreground">{label}</Label>
      ) : null}

      <div
        className="flex gap-2 justify-center"
        role="group"
        aria-label={label}
      >
        {Array.from({ length: OTP_LENGTH }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={values[i]}
            disabled={disabled}
            aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
            aria-invalid={error ? true : undefined}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className={cn(
              "size-14 rounded-2xl border border-input bg-transparent text-center text-xl font-semibold transition-colors outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "disabled:pointer-events-none disabled:opacity-50",
              error &&
                "border-destructive text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 animate-shake",
            )}
          />
        ))}
      </div>

      {error ? (
        <p className="text-center text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
