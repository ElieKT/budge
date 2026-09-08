import { requireUserId } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getUserCurrency } from "@/server/data/preferences";
import { PageHeader, EmptyState } from "@/components/ui/Misc";
import { AddDebtButton } from "@/components/debts/AddDebtButton";
import { DebtCard } from "@/components/debts/DebtCard";
import { DebtPayoffPlanner } from "@/components/debts/DebtPayoffPlanner";

export default async function DebtPayoffPage() {
  const userId = await requireUserId();
  const [debts, currency] = await Promise.all([
    prisma.debt.findMany({ where: { userId }, orderBy: { apr: "desc" } }),
    getUserCurrency(userId),
  ]);

  return (
    <div>
      <PageHeader
        title="Debt Payoff Planner"
        description="Avalanche vs. snowball — see exactly how much faster and cheaper you can be debt-free"
        action={<AddDebtButton />}
      />

      {debts.length === 0 ? (
        <EmptyState
          title="No debts added yet"
          description="Add a credit card, loan, or line of credit with its balance, APR, and minimum payment to build a payoff plan."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {debts.map((d) => (
              <DebtCard key={d.id} debt={d} currency={currency} />
            ))}
          </div>

          <DebtPayoffPlanner debts={debts} currency={currency} />
        </div>
      )}
    </div>
  );
}
