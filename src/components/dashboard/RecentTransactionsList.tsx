import Link from "next/link";
import { formatCurrency } from "@/lib/money";
import { EmptyState } from "@/components/ui/Misc";

type Row = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date;
  description: string | null;
  merchant: string | null;
  category: { name: string; color: string } | null;
};

export function RecentTransactionsList({ transactions }: { transactions: Row[] }) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Add your first income or expense to start seeing activity here."
        action={
          <Link href="/transactions" className="text-sm font-medium text-brand-600 hover:underline">
            Go to Transactions →
          </Link>
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {transactions.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {t.merchant || t.description || t.category?.name || "Transaction"}
            </p>
            <p className="text-xs text-slate-400">
              {t.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {t.category ? ` · ${t.category.name}` : ""}
            </p>
          </div>
          <span className={`shrink-0 text-sm font-semibold tabular-nums ${t.type === "INCOME" ? "amount-income" : "amount-expense"}`}>
            {t.type === "INCOME" ? "+" : "−"}
            {formatCurrency(t.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
