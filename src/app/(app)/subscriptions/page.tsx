import Link from "next/link";
import { requireUserId } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getUserCurrency } from "@/server/data/preferences";
import { PageHeader, EmptyState } from "@/components/ui/Misc";
import { formatCurrency } from "@/lib/money";
import { annualEquivalentCents, monthlyEquivalentCents, needsReview } from "@/lib/subscriptions";
import { SubscriptionRow } from "@/components/subscriptions/SubscriptionRow";

export default async function SubscriptionsPage() {
  const userId = await requireUserId();
  const [rules, currency] = await Promise.all([
    prisma.recurringTransaction.findMany({
      where: { userId, type: "EXPENSE" },
      include: { category: { select: { name: true } } },
    }),
    getUserCurrency(userId),
  ]);

  const active = rules.filter((r) => r.isActive);
  const pausedCount = rules.length - active.length;

  const withMonthly = active
    .map((r) => ({
      rule: r,
      monthlyCents: monthlyEquivalentCents(r.amount, r.frequency),
      annualCents: annualEquivalentCents(r.amount, r.frequency),
      needsReview: needsReview(r),
    }))
    .sort((a, b) => b.monthlyCents - a.monthlyCents);

  const totalMonthly = withMonthly.reduce((sum, x) => sum + x.monthlyCents, 0);
  const reviewCount = withMonthly.filter((x) => x.needsReview).length;

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Every recurring bill, normalized to a monthly cost — so you can see what's actually adding up"
      />

      {rules.length === 0 ? (
        <EmptyState
          title="No recurring bills tracked yet"
          description="Add your subscriptions and bills on the Recurring page to see them totaled up here."
          action={
            <Link href="/recurring" className="text-sm font-medium text-brand-600 hover:underline">
              Go to Recurring →
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Monthly total</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(totalMonthly, currency)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Projected yearly</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(totalMonthly * 12, currency)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500 dark:text-slate-400">Active subscriptions</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{withMonthly.length}</p>
              {reviewCount > 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  {reviewCount} haven&apos;t been reviewed in 90+ days
                </p>
              )}
            </div>
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Frequency</th>
                  <th className="px-4 py-3 text-right font-medium">Per charge</th>
                  <th className="px-4 py-3 text-right font-medium">Monthly</th>
                  <th className="px-4 py-3 text-right font-medium">Yearly</th>
                  <th className="px-4 py-3 font-medium"></th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {withMonthly.map((item) => (
                  <SubscriptionRow key={item.rule.id} item={item} currency={currency} />
                ))}
              </tbody>
            </table>
          </div>

          {pausedCount > 0 && (
            <p className="mt-4 text-xs text-slate-400">
              {pausedCount} paused recurring expense{pausedCount === 1 ? "" : "s"} not counted above — manage them on{" "}
              <Link href="/recurring" className="underline">
                Recurring
              </Link>
              .
            </p>
          )}
        </>
      )}
    </div>
  );
}
