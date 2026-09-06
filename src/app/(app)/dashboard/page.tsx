import { requireUserId } from "@/lib/auth-guard";
import { resolvePeriod } from "@/lib/period";
import { getDashboardData } from "@/server/data/dashboard";
import { PageHeader } from "@/components/ui/Misc";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { StatCard } from "@/components/dashboard/StatCard";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { RecentTransactionsList } from "@/components/dashboard/RecentTransactionsList";
import { BudgetProgressList } from "@/components/dashboard/BudgetProgressList";
import { SavingsSummaryCard } from "@/components/dashboard/SavingsSummaryCard";
import { formatCurrency } from "@/lib/money";
import { savingsProgressPercentage } from "@/lib/calculations";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const period = resolvePeriod(sp);
  const data = await getDashboardData(userId, period);

  return (
    <div>
      <PageHeader title="Dashboard" description="Your financial overview" action={<PeriodSelector />} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total balance" cents={data.totalBalance} hint="All-time income minus expenses" />
        <StatCard label="Income" cents={data.income} tone="income" />
        <StatCard label="Expenses" cents={data.expenses} tone="expense" />
        <StatCard
          label="Net cash flow"
          cents={data.net}
          tone={data.net >= 0 ? "income" : "expense"}
          hint="Income minus expenses, this period"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Income vs. expenses — last 6 months</h2>
          <MonthlyTrendChart data={data.monthlyTrend} />
        </section>

        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Spending by category</h2>
          <CategoryPieChart data={data.spendingByCategory} />
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">This month&apos;s budget</h2>
            <span className="text-sm text-slate-500">
              Remaining: <span className="font-medium text-slate-700">{formatCurrency(data.remainingBudget)}</span>
            </span>
          </div>
          <BudgetProgressList categories={data.budgetProgress} hasBudget={data.hasBudgetForThisMonth} />
        </section>

        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Savings goals</h2>
          <SavingsSummaryCard
            totalSaved={data.savings.totalSaved}
            totalTarget={data.savings.totalTarget}
            percentage={data.savings.percentage}
            goals={data.savings.goals.map((g) => ({
              id: g.id,
              name: g.name,
              currentAmount: g.currentAmount,
              targetAmount: g.targetAmount,
              percentage: savingsProgressPercentage(g.currentAmount, g.targetAmount),
            }))}
          />
        </section>
      </div>

      <section className="card mt-6">
        <h2 className="mb-2 text-base font-semibold">Recent activity</h2>
        <RecentTransactionsList transactions={data.recentTransactions} />
      </section>
    </div>
  );
}
