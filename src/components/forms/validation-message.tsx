import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "@/components/icons";

interface ValidationMessageProps {
  /** Error or success message text */
  message: string;
  /** Variant determines color and icon */
  variant?: "error" | "success";
  className?: string;
}

/**
 * ValidationMessage — Inline validation feedback.
 *
 * Shows error or success messages below form fields.
 * Source: 09_UI_UX_Specification §13 — Inline validation on blur.
 */
export function ValidationMessage({
  message,
  variant = "error",
  className,
}: ValidationMessageProps) {
  const isError = variant === "error";

  return (
    <p
      className={cn(
        "flex items-center gap-1 text-xs",
        isError ? "text-destructive" : "text-[var(--color-success)]",
        className,
      )}
      role={isError ? "alert" : "status"}
    >
      {isError ? (
        <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle className="size-3 shrink-0" aria-hidden="true" />
      )}
      {message}
    </p>
  );
}
