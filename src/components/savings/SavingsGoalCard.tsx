"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/money";
import { ProgressBar, Badge } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { SavingsGoalForm } from "./SavingsGoalForm";
import { deleteSavingsGoal, markSavingsGoalComplete, updateSavingsGoal, updateSavingsProgress } from "@/server/actions/savingsGoals";
import { UpdateProgressForm } from "./UpdateProgressForm";

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date | null;
  notes: string | null;
  isCompleted: boolean;
  percentage: number;
};

export function SavingsGoalCard({ goal, currency = "USD" }: { goal: Goal; currency?: string }) {
  const [editing, setEditing] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="card">
      <div className="mb-1.5 flex items-start justify-between">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{goal.name}</h3>
        {goal.isCompleted && <Badge tone="income">Complete 🎉</Badge>}
      </div>
      {goal.targetDate && (
        <p className="mb-2 text-xs text-slate-400">
          Target date: {goal.targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      )}
      <ProgressBar percentage={goal.percentage} status={goal.percentage >= 100 ? "over" : "under"} />
      <div className="mt-2 flex justify-between text-sm text-slate-500">
        <span>{formatCurrency(goal.currentAmount, currency)} saved</span>
        <span>{goal.percentage}% of {formatCurrency(goal.targetAmount, currency)}</span>
      </div>
      {goal.notes && <p className="mt-2 text-sm text-slate-500">{goal.notes}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!goal.isCompleted && (
          <Button size="sm" variant="secondary" onClick={() => setUpdatingProgress(true)}>
            Update progress
          </Button>
        )}
        {!goal.isCompleted && goal.currentAmount < goal.targetAmount && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => startTransition(async () => {
              await markSavingsGoalComplete(goal.id);
              router.refresh();
            })}
          >
            Mark complete
          </Button>
        )}
        <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-brand-600 hover:underline">
          Edit
        </button>
        <ConfirmDeleteButton action={() => deleteSavingsGoal(goal.id)} confirmMessage="Delete this savings goal? This can't be undone." />
      </div>

      {editing && (
        <Modal title="Edit savings goal" onClose={() => setEditing(false)}>
          <SavingsGoalForm
            action={updateSavingsGoal.bind(null, goal.id)}
            defaultValues={{
              name: goal.name,
              targetAmount: (goal.targetAmount / 100).toFixed(2),
              currentAmount: (goal.currentAmount / 100).toFixed(2),
              targetDate: goal.targetDate ? goal.targetDate.toISOString().slice(0, 10) : "",
              notes: goal.notes ?? "",
            }}
            onSuccess={() => setEditing(false)}
            submitLabel="Save changes"
          />
        </Modal>
      )}

      {updatingProgress && (
        <Modal title="Update progress" onClose={() => setUpdatingProgress(false)}>
          <UpdateProgressForm
            action={updateSavingsProgress.bind(null, goal.id)}
            currentAmount={(goal.currentAmount / 100).toFixed(2)}
            onSuccess={() => setUpdatingProgress(false)}
          />
        </Modal>
      )}
    </div>
  );
}
