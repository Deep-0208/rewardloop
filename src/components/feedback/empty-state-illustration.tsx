import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateIllustrationProps {
  icon: ReactNode;
  className?: string;
}

export function EmptyStateIllustration({
  icon,
  className,
}: EmptyStateIllustrationProps) {
  return (
    <div className={cn("relative flex items-center justify-center size-32 mb-2", className)}>
      {/* Background Glow */}
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl scale-125 pointer-events-none" />

      {/* Layer 1: Large faint circle */}
      <div className="absolute inset-2 border-[1.5px] border-primary/10 rounded-full animate-pulse-soft" />

      {/* Layer 2: Medium dashed circle */}
      <div className="absolute inset-6 border-[1.5px] border-primary/20 border-dashed rounded-full rotate-45" />

      {/* Layer 3: Solid core */}
      <div className="absolute inset-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full shadow-inner ring-1 ring-primary/20" />

      {/* Floating particles */}
      <div className="absolute top-4 left-6 size-1.5 bg-primary/40 rounded-full animate-fade-in" style={{ animationDelay: "200ms" }} />
      <div className="absolute bottom-6 right-4 size-2 bg-primary/30 rounded-full animate-fade-in" style={{ animationDelay: "400ms" }} />
      <div className="absolute top-1/2 -right-1 size-1 bg-primary/50 rounded-full animate-fade-in" style={{ animationDelay: "600ms" }} />

      {/* Central Icon */}
      <div className="relative z-10 flex items-center justify-center p-3 text-primary drop-shadow-sm transition-transform hover:scale-110 duration-300">
        {icon}
      </div>
    </div>
  );
}
