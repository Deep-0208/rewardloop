import { ScreenContainer } from "@/components/screen-container";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { EmptyState } from "@/components/feedback/empty-state";
import { TransactionCard } from "@/features/shared/components";
import { getTransactions } from "@/features/transactions/actions/get-transactions";
import { formatCurrency, formatDate } from "@/utils";
import { Receipt, PlusCircle } from "@/components/icons";

import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Transactions page — Full transaction history view.
 *
 * Server component that fetches all business transactions.
 * Displays them chronologically, grouped by date.
 */
export default async function TransactionsPage() {
  const result = await getTransactions();

  if (!result.success) {
    return (
      <ScreenContainer>
        <PageHeader title="Visit History" />
        <Section>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Unable to load transactions. Please try again.
            </p>
          </div>
        </Section>
      </ScreenContainer>
    );
  }

  const transactions = result.data;

  return (
    <ScreenContainer>
      <PageHeader
        title="Visit History"
        subtitle={`${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`}
      />

      {transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-8 text-primary" />}
          title="No Visit History Yet"
          description="Completed customer transactions, reward earnings, and redemptions will appear here."
          action={
            <Link href="/visit">
              <Button size="touch">
                <PlusCircle className="mr-2 size-5" />
                New Visit Transaction
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {transactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              customerName={tx.customerName || tx.customerPhone}
              finalPaid={formatCurrency(tx.finalPaidPaise)}
              rewardUsed={
                tx.rewardUsedPaise > 0
                  ? formatCurrency(tx.rewardUsedPaise)
                  : undefined
              }
              paymentMethod={tx.paymentMethod}
              timestamp={formatDate(tx.createdAt, "datetime")}
            />
          ))}
        </div>
      )}
    </ScreenContainer>
  );
}
