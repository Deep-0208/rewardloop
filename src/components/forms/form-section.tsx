import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * FormSection — Groups related form fields with section title.
 *
 * Consistent spacing between form field groups.
 */
export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <fieldset className={cn("flex flex-col gap-4", className)}>
      {title ? (
        <legend className="flex flex-col gap-0.5 pb-1">
          <span className="text-base font-semibold text-foreground">
            {title}
          </span>
          {description ? (
            <span className="text-sm text-muted-foreground">{description}</span>
          ) : null}
        </legend>
      ) : null}
      {children}
    </fieldset>
  );
}
