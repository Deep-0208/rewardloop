import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet } from "@/components/icons";

interface TransactionCardProps {
  /** Customer name or phone */
  customerName: string;
  /** Final paid display (e.g., "₹1,000") */
  finalPaid: string;
  /** Reward used display (e.g., "₹200") */
  rewardUsed?: string;
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
  paymentMethod,
  timestamp,
  onClick,
  className,
}: TransactionCardProps) {
  const { label: methodLabel, icon: MethodIcon } =
    paymentMethodConfig[paymentMethod];

  return (
    <Card
      className={cn(
        "border border-border transition-colors",
        onClick && "cursor-pointer hover:bg-muted/50",
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
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {customerName}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{timestamp}</span>
            {rewardUsed ? (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-medium"
              >
                -{rewardUsed}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {finalPaid}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MethodIcon className="size-3" aria-hidden="true" />
            {methodLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
