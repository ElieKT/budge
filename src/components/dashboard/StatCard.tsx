import { clsx } from "clsx";
import { formatCurrency } from "@/lib/money";

export function StatCard({
  label,
  cents,
  currency = "USD",
  tone = "neutral",
  hint,
}: {
  label: string;
  cents: number;
  currency?: string;
  tone?: "income" | "expense" | "neutral";
  hint?: string;
}) {
  const toneClass = { income: "text-income", expense: "text-expense", neutral: "text-slate-900 dark:text-slate-50" }[tone];
  return (
    <div className="card">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={clsx("mt-2 text-2xl font-semibold tabular-nums", toneClass)}>{formatCurrency(cents, currency)}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
