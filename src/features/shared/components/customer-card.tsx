import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { User, Phone } from "@/components/icons";

interface CustomerCardProps {
  /** Customer name (can be null for unnamed customers) */
  name: string | null;
  /** Phone number */
  phone: string;
  /** Total visit count */
  visitCount?: number;
  /** Wallet balance display (e.g., "₹250") */
  walletBalance?: string;
  className?: string;
}

/**
 * CustomerCard — Customer display card for visit flow.
 *
 * Shows customer name/phone, visit count, wallet balance.
 * Source: 09_UI_UX_Specification §10 — Component Library (CustomerCard)
 */
export function CustomerCard({
  name,
  phone,
  visitCount,
  walletBalance,
  className,
}: CustomerCardProps) {
  return (
    <Card className={cn("border border-border", className)}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="size-5" />
        </div>

        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {name || "Unnamed Customer"}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="size-3" aria-hidden="true" />
            {phone}
          </span>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          {walletBalance ? (
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {walletBalance}
            </span>
          ) : null}
          {visitCount !== undefined ? (
            <span className="text-xs text-muted-foreground">
              {visitCount} {visitCount === 1 ? "visit" : "visits"}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
