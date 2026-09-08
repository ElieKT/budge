import { requireAdmin } from "@/lib/auth-guard";
import { getAdminOverview } from "@/server/data/admin";
import { PageHeader } from "@/components/ui/Misc";
import { SignupsChart } from "@/components/admin/SignupsChart";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString("en-US")}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const stats = await getAdminOverview();

  return (
    <div>
      <PageHeader
        title="Admin overview"
        description="Aggregate usage stats only — no individual user's transactions, balances, or budgets are ever shown here."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="Completed onboarding" value={stats.onboardedUsers} />
        <StatCard label="Total transactions logged" value={stats.totalTransactions} />
        <StatCard label="Households" value={stats.totalHouseholds} />
        <StatCard label="Debts tracked" value={stats.totalDebts} />
        <StatCard label="Recurring bills tracked" value={stats.totalRecurringExpenses} />
        <StatCard label="Bank connections (Plaid)" value={stats.connectedPlaidItems} />
      </div>

      <div className="card mt-6">
        <h2 className="mb-1 text-base font-semibold">Signups, last 30 days</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Daily new account count.</p>
        <SignupsChart data={stats.signupsByDay} />
      </div>

      {stats.usersByLocale.length > 0 && (
        <div className="card mt-6">
          <h2 className="mb-3 text-base font-semibold">Language preference</h2>
          <ul className="space-y-1.5 text-sm">
            {stats.usersByLocale.map((l) => (
              <li key={l.locale} className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">{l.locale}</span>
                <span className="font-medium tabular-nums">{l.count.toLocaleString("en-US")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
