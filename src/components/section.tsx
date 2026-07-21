import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "@/types/common";

interface SectionProps extends PropsWithChildren {
  title?: string;
  description?: string;
}

/**
 * Section — Content section wrapper.
 *
 * Groups related content with consistent spacing.
 * Optionally displays a section title and description.
 */
export function Section({
  title,
  description,
  children,
  className,
}: SectionProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {title ? (
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
