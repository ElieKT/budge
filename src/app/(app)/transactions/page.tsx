import { requireUserId } from "@/lib/auth-guard";
import { transactionFilterSchema } from "@/lib/validation/transaction";
import { getFilteredTransactions } from "@/server/data/transactions";
import { getCategoriesForUser } from "@/server/data/categories";
import { PageHeader } from "@/components/ui/Misc";
import { Pagination } from "@/components/ui/Pagination";
import { AddTransactionButton } from "@/components/transactions/TransactionModalButtons";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { getUserCurrency } from "@/server/data/preferences";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const filter = transactionFilterSchema.parse(sp);

  const [{ transactions, page, totalPages }, categories, currency] = await Promise.all([
    getFilteredTransactions(userId, filter),
    getCategoriesForUser(userId),
    getUserCurrency(userId),
  ]);

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }));

  return (
    <div>
      <PageHeader title="Transactions" description="All your income and expenses in one place" action={<AddTransactionButton categories={categoryOptions} />} />
      <TransactionFilters categories={categories.filter((c) => c.kind === "EXPENSE")} />
      <TransactionsTable transactions={transactions} categories={categoryOptions} currency={currency} />
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
