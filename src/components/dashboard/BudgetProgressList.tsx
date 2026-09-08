import Link from "next/link";
import { formatCurrency } from "@/lib/money";
import { ProgressBar, EmptyState, Badge } from "@/components/ui/Misc";

type Row = {
  categoryId: string;
  name: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "under" | "warning" | "over";
};

export function BudgetProgressList({
  categories,
  hasBudget,
  currency = "USD",
}: {
  categories: Row[];
  hasBudget: boolean;
  currency?: string;
}) {
  if (!hasBudget || categories.length === 0) {
    return (
      <EmptyState
        title="No budget set for this month"
        description="Create a monthly budget to track spending limits by category."
        action={
          <Link href="/budgets" className="text-sm font-medium text-brand-600 hover:underline">
            Set up a budget →
          </Link>
        }
      />
    );
  }

  return (
    <ul className="space-y-4">
      {categories.map((c) => (
        <li key={c.categoryId}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{c.name}</span>
            <span className="flex items-center gap-2 text-slate-500">
              {formatCurrency(c.spent, currency)} / {formatCurrency(c.limit, currency)}
              {c.status === "over" && <Badge tone="expense">Over budget</Badge>}
              {c.status === "warning" && <Badge tone="warning">Almost there</Badge>}
            </span>
          </div>
          <ProgressBar percentage={c.percentage} status={c.status} />
        </li>
      ))}
    </ul>
  );
}
