import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  hasError?: boolean;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
}

function Input({ className, type, hasError, leftSection, rightSection, ...props }: InputProps) {
  const isComposite = leftSection || rightSection;
  
  const inputClass = cn(
    "h-11 w-full min-w-0 rounded-[var(--radius-input)] border border-input bg-transparent px-3.5 py-2 text-base transition-all duration-[var(--transition-normal)] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:border-border/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]",
    leftSection && "pl-10",
    rightSection && "pr-10",
    className,
  );

  if (isComposite) {
    return (
      <div className="relative flex w-full items-center">
        {leftSection && (
          <div className="absolute left-3 flex items-center justify-center pointer-events-none text-muted-foreground">
            {leftSection}
          </div>
        )}
        <InputPrimitive
          type={type}
          data-slot="input"
          aria-invalid={hasError ? true : props["aria-invalid"]}
          className={inputClass}
          {...props}
        />
        {rightSection && (
          <div className="absolute right-3 flex items-center justify-center pointer-events-none text-muted-foreground">
            {rightSection}
          </div>
        )}
      </div>
    );
  }

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      aria-invalid={hasError ? true : props["aria-invalid"]}
      className={inputClass}
      {...props}
    />
  );
}

export { Input };
