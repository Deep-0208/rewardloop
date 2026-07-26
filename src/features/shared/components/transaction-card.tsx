import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Wallet } from "@/components/icons";

interface TransactionCardProps {
  /** Customer name or phone */
  customerName: string;
  /** Final paid display (e.g., "₹1,000") */
  finalPaid: string;
  /** Reward used display (e.g., "₹200") */
  rewardUsed?: string;
  /** Services split (e.g., "₹500") */
  serviceSubtotal?: string;
  /** Products split (e.g., "₹500") */
  productSubtotal?: string;
  /** Payment method */
  paymentMethod: "cash" | "online" | "none";
  /** Transaction timestamp display */
  timestamp: string;
  /** Click handler */
  onClick?: () => void;
  className?: string;
}

const paymentMethodConfig = {
  cash: { label: "Cash", icon: Wallet },
  online: { label: "Online", icon: CreditCard },
  none: { label: "None", icon: Wallet },
} as const;

/**
 * TransactionCard — Transaction list item.
 *
 * Shows customer, final paid, reward used, payment method, timestamp.
 * Source: 09_UI_UX_Specification §10 — Component Library (TransactionCard)
 */
export function TransactionCard({
  customerName,
  finalPaid,
  rewardUsed,
  serviceSubtotal,
  productSubtotal,
  paymentMethod,
  timestamp,
  onClick,
  className,
}: TransactionCardProps) {
  const { label: methodLabel, icon: MethodIcon } =
    paymentMethodConfig[paymentMethod];

  const initial = customerName.charAt(0).toUpperCase();

  return (
    <Card
      className={cn(
        "border-0 shadow-[var(--shadow-card)] transition-all duration-150",
        onClick &&
          "cursor-pointer hover:shadow-[var(--shadow-soft)] active:scale-[0.98]",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <CardContent className="flex items-center gap-3 p-4">
        {/* Avatar initial */}
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initial}
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-semibold text-foreground truncate leading-tight">
            {customerName}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground tabular-nums">
              {timestamp}
            </span>
            {rewardUsed ? (
              <>
                <span className="text-[8px] text-muted-foreground">•</span>
                <span className="text-xs font-medium tabular-nums text-[var(--color-success)]">
                  -{rewardUsed}
                </span>
              </>
            ) : null}
            {(serviceSubtotal || productSubtotal) && (
              <>
                <span className="text-[8px] text-muted-foreground">•</span>
                <span className="text-[11px] text-muted-foreground">
                  {serviceSubtotal && `S: ${serviceSubtotal}`}
                  {serviceSubtotal && productSubtotal && " | "}
                  {productSubtotal && `P: ${productSubtotal}`}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="text-base font-bold tabular-nums text-foreground tracking-tight">
            {finalPaid}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider leading-none",
              paymentMethod === "online"
                ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                : "bg-muted text-muted-foreground",
            )}
          >
            <MethodIcon className="size-2.5" aria-hidden="true" />
            {methodLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
