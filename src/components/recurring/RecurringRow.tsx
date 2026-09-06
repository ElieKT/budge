"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/money";
import { Badge } from "@/components/ui/Misc";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { deleteRecurringTransaction, toggleRecurringActive } from "@/server/actions/recurring";

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUALLY: "Annually",
};

type Row = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  frequency: string;
  merchant: string | null;
  description: string | null;
  category: { name: string; color: string } | null;
  nextRunDate: Date;
  isActive: boolean;
  endDate: Date | null;
};

export function RecurringRow({ rule }: { rule: Row }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800">{rule.merchant || rule.description || rule.category?.name || "Recurring"}</p>
        <p className="text-xs text-slate-400">{rule.category?.name ?? "Uncategorized"}</p>
      </td>
      <td className="px-4 py-3 text-slate-600">{FREQUENCY_LABELS[rule.frequency]}</td>
      <td className="px-4 py-3 text-slate-600">{rule.nextRunDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${rule.type === "INCOME" ? "amount-income" : "amount-expense"}`}>
        {rule.type === "INCOME" ? "+" : "−"}{formatCurrency(rule.amount)}
      </td>
      <td className="px-4 py-3">
        {rule.isActive ? <Badge tone="income">Active</Badge> : <Badge tone="neutral">Paused</Badge>}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => {
              await toggleRecurringActive(rule.id, !rule.isActive);
              router.refresh();
            })}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            {rule.isActive ? "Pause" : "Resume"}
          </button>
          <ConfirmDeleteButton action={() => deleteRecurringTransaction(rule.id)} confirmMessage="Delete this recurring transaction? Past transactions it already created will remain." />
        </div>
      </td>
    </tr>
  );
}
