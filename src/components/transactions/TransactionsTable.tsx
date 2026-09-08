import { formatCurrency } from "@/lib/money";
import { EmptyState } from "@/components/ui/Misc";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { deleteTransaction } from "@/server/actions/transactions";
import { EditTransactionButton } from "./TransactionModalButtons";
import type { CategoryOption } from "./TransactionForm";

type Row = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date;
  description: string | null;
  merchant: string | null;
  notes: string | null;
  categoryId: string | null;
  receiptUrl: string | null;
  category: { id: string; name: string; color: string } | null;
};

export function TransactionsTable({
  transactions,
  categories,
  currency = "USD",
}: {
  transactions: Row[];
  categories: CategoryOption[];
  currency?: string;
}) {
  if (transactions.length === 0) {
    return <EmptyState title="No transactions found" description="Try adjusting your filters, or add a new transaction." />;
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((t) => (
            <tr key={t.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {t.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{t.merchant || t.description || "—"}</p>
                  {t.receiptUrl && (
                    <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" title="View receipt" aria-label="View receipt" className="shrink-0">
                      🧾
                    </a>
                  )}
                </div>
                {t.merchant && t.description && <p className="text-xs text-slate-400">{t.description}</p>}
              </td>
              <td className="px-4 py-3">
                {t.category ? (
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.category.color }} />
                    {t.category.name}
                  </span>
                ) : (
                  <span className="text-slate-400">Uncategorized</span>
                )}
              </td>
              <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${t.type === "INCOME" ? "amount-income" : "amount-expense"}`}>
                {t.type === "INCOME" ? "+" : "−"}
                {formatCurrency(t.amount, currency)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  <EditTransactionButton
                    transactionId={t.id}
                    categories={categories}
                    defaultValues={{
                      type: t.type,
                      amount: (t.amount / 100).toFixed(2),
                      date: t.date.toISOString().slice(0, 10),
                      categoryId: t.categoryId ?? "",
                      description: t.description ?? "",
                      merchant: t.merchant ?? "",
                      notes: t.notes ?? "",
                      receiptUrl: t.receiptUrl ?? "",
                    }}
                  />
                  <ConfirmDeleteButton action={deleteTransaction.bind(null, t.id)} confirmMessage="Delete this transaction? This can't be undone." />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
