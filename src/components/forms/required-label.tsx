import { Label as LabelPrimitive } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

interface RequiredLabelProps extends ComponentProps<typeof LabelPrimitive> {
  /** Show required asterisk */
  required?: boolean;
  /** Show "(Optional)" text */
  optional?: boolean;
}

/**
 * RequiredLabel — Label with required/optional indicators.
 *
 * Source: 09_UI_UX_Specification §13 — Optional fields show "(Optional)".
 */
export function RequiredLabel({
  children,
  required,
  optional,
  className,
  ...props
}: RequiredLabelProps) {
  return (
    <LabelPrimitive
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-0.5 text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
      {optional ? (
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          (Optional)
        </span>
      ) : null}
    </LabelPrimitive>
  );
}
