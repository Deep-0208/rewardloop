import * as React from "react";
import { cn } from "@/lib/utils";
import { Inbox, AlertTriangle, RefreshCcw, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BaseFeedbackProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  variant?: "card" | "full" | "inline";
}

export function EmptyState({
  title = "No data found",
  description,
  icon: Icon = Inbox,
  action,
  variant = "card",
  className,
  ...props
}: BaseFeedbackProps & {
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "card" && "p-8",
        variant === "full" && "min-h-[50vh] p-8",
        variant === "inline" && "p-4",
        className
      )}
      {...props}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/50 mb-4">
        <Icon className="size-6 text-muted-foreground/50" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "An error occurred",
  description = "Something went wrong while loading this data.",
  icon: Icon = AlertTriangle,
  retry,
  variant = "card",
  className,
  ...props
}: BaseFeedbackProps & {
  icon?: LucideIcon;
  retry?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "card" && "p-8",
        variant === "full" && "min-h-[50vh] p-8",
        variant === "inline" && "p-4",
        className
      )}
      {...props}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
        <Icon className="size-6 text-destructive" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {retry && (
        <Button variant="outline" onClick={retry} className="mt-6">
          <RefreshCcw className="mr-2 size-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}

export function LoadingState({
  text = "Loading...",
  variant = "card",
  className,
  ...props
}: BaseFeedbackProps & {
  text?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "card" && "p-8",
        variant === "full" && "min-h-[50vh] p-8",
        variant === "inline" && "p-4",
        className
      )}
      {...props}
    >
      <Loader2 className="size-8 animate-spin text-primary mb-4" aria-hidden="true" />
      {text && <p className="text-sm font-medium text-muted-foreground">{text}</p>}
    </div>
  );
}
