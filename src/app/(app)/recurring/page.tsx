import { requireUserId } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getCategoriesForUser } from "@/server/data/categories";
import { PageHeader, EmptyState } from "@/components/ui/Misc";
import { AddRecurringButton } from "@/components/recurring/AddRecurringButton";
import { RecurringRow } from "@/components/recurring/RecurringRow";

export default async function RecurringPage() {
  const userId = await requireUserId();
  const [rules, categories] = await Promise.all([
    prisma.recurringTransaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: [{ isActive: "desc" }, { nextRunDate: "asc" }],
    }),
    getCategoriesForUser(userId),
  ]);

  return (
    <div>
      <PageHeader
        title="Recurring Transactions"
        description="Automate income and expenses that repeat on a schedule"
        action={<AddRecurringButton categories={categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))} />}
      />

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Due recurring transactions are generated automatically whenever you visit the app. For
        reliable generation even when nobody logs in for a while, a scheduled job should also call{" "}
        <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">POST /api/cron/recurring</code> daily —
        see the README for setup. This is an external scheduling dependency, not something this app
        can guarantee on its own.
      </div>

      {rules.length === 0 ? (
        <EmptyState title="No recurring transactions yet" description="Set up rent, a paycheck, or a subscription to generate transactions automatically." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Frequency</th>
                <th className="px-4 py-3 font-medium">Next run</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((r) => (
                <RecurringRow key={r.id} rule={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
