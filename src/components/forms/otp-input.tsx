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
  /** Number of digits for the OTP (defaults to 6) */
  length?: number;
  className?: string;
}

export function OTPInput({
  onComplete,
  onChange,
  label = "Enter OTP",
  error,
  disabled,
  autoFocus = true,
  length = 6,
  className,
}: OTPInputProps) {
  const [values, setValues] = useState<string[]>(
    Array.from({ length }, () => ""),
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const focusInput = useCallback(
    (index: number) => {
      if (index >= 0 && index < length) {
        inputRefs.current[index]?.focus();
      }
    },
    [length],
  );

  const handleChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const digit = e.target.value.replace(/\D/g, "").slice(-1);
      const next = [...values];
      next[index] = digit;
      setValues(next);

      const otp = next.join("");
      onChange?.(otp);

      if (digit && index < length - 1) {
        focusInput(index + 1);
      }

      if (otp.length === length && next.every(Boolean)) {
        onComplete?.(otp);
      }
    },
    [values, onChange, onComplete, focusInput, length],
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
        .slice(0, length);

      if (!pasted) return;

      const next = Array.from({ length }, (_, i) => pasted[i] || "");
      setValues(next);
      onChange?.(next.join(""));

      const lastFilledIndex = Math.min(pasted.length, length) - 1;
      focusInput(lastFilledIndex);

      if (pasted.length === length) {
        onComplete?.(pasted);
      }
    },
    [onChange, onComplete, focusInput, length],
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
        {Array.from({ length }, (_, i) => (
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
            aria-label={`Digit ${i + 1} of ${length}`}
            aria-invalid={error ? true : undefined}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className={cn(
              "w-12 h-14 sm:w-14 sm:h-16 rounded-[16px] border border-border/60 bg-muted/30 text-center text-[24px] font-bold text-foreground transition-all outline-none",
              "focus-visible:border-primary focus-visible:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-primary/15 focus-visible:shadow-sm",
              "disabled:pointer-events-none disabled:opacity-50",
              error &&
                "border-destructive text-destructive bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/20 animate-shake",
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
