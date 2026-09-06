import Link from "next/link";
import { formatCurrency } from "@/lib/money";
import { ProgressBar, EmptyState } from "@/components/ui/Misc";

type Goal = { id: string; name: string; currentAmount: number; targetAmount: number; percentage: number };

export function SavingsSummaryCard({
  totalSaved,
  totalTarget,
  percentage,
  goals,
}: {
  totalSaved: number;
  totalTarget: number;
  percentage: number;
  goals: Goal[];
}) {
  if (goals.length === 0) {
    return (
      <EmptyState
        title="No savings goals yet"
        description="Set a target and track your progress over time."
        action={
          <Link href="/savings-goals" className="text-sm font-medium text-brand-600 hover:underline">
            Create a savings goal →
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold tabular-nums">{formatCurrency(totalSaved)}</span>
          <span className="text-sm text-slate-500">of {formatCurrency(totalTarget)} goal</span>
        </div>
        <div className="mt-2">
          <ProgressBar percentage={percentage} status={percentage >= 100 ? "over" : "under"} />
        </div>
      </div>
      <ul className="space-y-3">
        {goals.map((g) => (
          <li key={g.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{g.name}</span>
              <span className="text-slate-500">{g.percentage}%</span>
            </div>
            <ProgressBar percentage={g.percentage} status={g.percentage >= 100 ? "over" : "under"} />
          </li>
        ))}
      </ul>
      <Link href="/savings-goals" className="mt-4 block text-sm font-medium text-brand-600 hover:underline">
        View all goals →
      </Link>
    </div>
  );
}
