import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Admin overview data — aggregate counts only, never a specific user's
 * financial content. This boundary is deliberate: the app's own Privacy
 * and Security pages promise "no unrestricted admin view into your
 * financial records," and this dashboard is built to keep that true rather
 * than being the exception to it.
 */
export async function getAdminOverview() {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    onboardedUsers,
    totalTransactions,
    totalHouseholds,
    totalDebts,
    totalRecurringExpenses,
    connectedPlaidItems,
    unreadMessages,
    localeCounts,
    recentSignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.userPreference.count({ where: { onboardingCompletedAt: { not: null } } }),
    prisma.transaction.count(),
    prisma.household.count(),
    prisma.debt.count(),
    prisma.recurringTransaction.count({ where: { type: "EXPENSE" } }),
    prisma.plaidItem.count(),
    prisma.contactMessage.count({ where: { isResolved: false } }),
    prisma.userPreference.groupBy({ by: ["locale"], _count: { _all: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);

  const dayBuckets = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    dayBuckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const u of recentSignups) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (dayBuckets.has(key)) dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  }

  return {
    totalUsers,
    onboardedUsers,
    totalTransactions,
    totalHouseholds,
    totalDebts,
    totalRecurringExpenses,
    connectedPlaidItems,
    unreadMessages,
    usersByLocale: localeCounts.map((l) => ({ locale: l.locale, count: l._count._all })),
    signupsByDay: Array.from(dayBuckets, ([date, count]) => ({ date, count })),
  };
}

/** Account metadata only — name, email, role, join date, locale, onboarding
 * status. No transactions, balances, budgets, or any other financial content. */
export function getUserRoster() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      preference: { select: { locale: true, onboardingCompletedAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}
