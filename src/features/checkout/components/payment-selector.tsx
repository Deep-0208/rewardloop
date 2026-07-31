import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Banknote, Smartphone } from "@/components/icons";
import type { VisitPaymentMethod } from "../types";

export interface PaymentSelectorProps {
  value: VisitPaymentMethod;
  onChange: (value: VisitPaymentMethod) => void;
}

export function PaymentSelector({ value, onChange }: PaymentSelectorProps) {
  return (
    <div className="mb-6 mt-4">
      <p className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider mb-2 pl-1">
        Payment Method
      </p>
      <div className="flex bg-muted/40 rounded-[var(--radius-card)] p-1 gap-1 border border-border/40 relative">
        <RadioGroup
          value={value}
          onValueChange={(val) => onChange(val as VisitPaymentMethod)}
          className="flex w-full gap-1"
          aria-label="Payment method"
        >
          <div className="relative flex-1">
            <RadioGroupItem
              value="cash"
              id="payment-cash"
              className="peer sr-only"
            />
            <Label
              htmlFor="payment-cash"
              className={cn(
                "relative z-10 flex w-full items-center justify-center gap-2 h-11 rounded-[var(--radius-button)] transition-all duration-[var(--transition-normal)] outline-none cursor-pointer border border-transparent",
                "peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                value === "cash"
                  ? "bg-background text-foreground font-semibold shadow-[var(--shadow-sm)] border-border/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]"
              )}
            >
              <Banknote className={cn("size-[18px]", value === "cash" ? "text-primary" : "opacity-70")} aria-hidden="true" />
              <span className="text-[14px]">Cash</span>
            </Label>
          </div>
          
          <div className="relative flex-1">
            <RadioGroupItem
              value="online"
              id="payment-online"
              className="peer sr-only"
            />
            <Label
              htmlFor="payment-online"
              className={cn(
                "relative z-10 flex w-full items-center justify-center gap-2 h-11 rounded-[var(--radius-button)] transition-all duration-[var(--transition-normal)] outline-none cursor-pointer border border-transparent",
                "peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                value === "online"
                  ? "bg-background text-foreground font-semibold shadow-[var(--shadow-sm)] border-border/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]"
              )}
            >
              <Smartphone className={cn("size-[18px]", value === "online" ? "text-primary" : "opacity-70")} aria-hidden="true" />
              <span className="text-[14px]">Online</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
