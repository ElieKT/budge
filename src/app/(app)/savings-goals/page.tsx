import { requireUserId } from "@/lib/auth-guard";
import { getSavingsGoals } from "@/server/data/savingsGoals";
import { PageHeader, EmptyState } from "@/components/ui/Misc";
import { AddSavingsGoalButton } from "@/components/savings/AddSavingsGoalButton";
import { SavingsGoalCard } from "@/components/savings/SavingsGoalCard";

export default async function SavingsGoalsPage() {
  const userId = await requireUserId();
  const goals = await getSavingsGoals(userId);

  return (
    <div>
      <PageHeader title="Savings Goals" description="Set targets and track your progress" action={<AddSavingsGoalButton />} />
      {goals.length === 0 ? (
        <EmptyState title="No savings goals yet" description="Create your first goal — an emergency fund, a trip, anything you're saving toward." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <SavingsGoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}
    </div>
  );
}
