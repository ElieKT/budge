import { requireUserId } from "@/lib/auth-guard";
import { resolvePeriod } from "@/lib/period";
import { getReportsData } from "@/server/data/reports";
import { PageHeader } from "@/components/ui/Misc";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { BudgetVsActualChart } from "@/components/reports/BudgetVsActualChart";
import { getUserCurrency } from "@/server/data/preferences";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const period = resolvePeriod(sp);
  const [data, currency] = await Promise.all([getReportsData(userId, period), getUserCurrency(userId)]);

  return (
    <div>
      <PageHeader title="Reports" description="Understand your spending patterns over time" action={<PeriodSelector />} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Income vs. expenses — last 6 months</h2>
          <MonthlyTrendChart data={data.monthlyTrend} currency={currency} />
        </section>

        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Spending by category</h2>
          <CategoryPieChart data={data.categoryBreakdown} currency={currency} />
        </section>

        <section className="card lg:col-span-2">
          <h2 className="mb-1 text-base font-semibold">Budget vs. actual — this month</h2>
          <p className="mb-4 text-sm text-slate-500">Compares each category&apos;s planned limit to what you&apos;ve actually spent this calendar month.</p>
          <BudgetVsActualChart data={data.budgetVsActual.categories.map((c) => ({ name: c.name, limit: c.limit, spent: c.spent }))} currency={currency} />
        </section>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Savings trend isn&apos;t shown yet — it requires recording a goal&apos;s progress over time, which
        this release doesn&apos;t track (a goal only stores its current amount). See Savings Goals for
        current progress.
      </p>
    </div>
  );
}
