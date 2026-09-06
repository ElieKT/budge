import "server-only";
import { prisma } from "@/lib/prisma";
import {
  budgetStatus,
  budgetUsedPercentage,
  netCashFlow,
  remainingBudget,
  savingsProgressPercentage,
  spendByCategory,
  totalExpenses,
  totalIncome,
  type CalcTransaction,
} from "@/lib/calculations";
import { lastNMonths, type ResolvedPeriod } from "@/lib/period";

export async function getDashboardData(userId: string, period: ResolvedPeriod) {
  const now = new Date();

  const [periodTransactions, recentTransactions, currentMonthBudget, savingsGoals, allTimeAgg] =
    await Promise.all([
      prisma.transaction.findMany({
        where: { userId, date: { gte: period.from, lte: period.to } },
        include: { category: true },
        orderBy: { date: "desc" },
      }),
      prisma.transaction.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: "desc" },
        take: 8,
      }),
      prisma.monthlyBudget.findUnique({
        where: {
          userId_year_month: { userId, year: now.getFullYear(), month: now.getMonth() + 1 },
        },
        include: { categories: { include: { category: true } } },
      }),
      prisma.savingsGoal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId },
        _sum: { amount: true },
      }),
    ]);

  const calcTx: CalcTransaction[] = periodTransactions.map((t) => ({
    type: t.type,
    amount: t.amount,
    categoryId: t.categoryId,
  }));

  const income = totalIncome(calcTx);
  const expenses = totalExpenses(calcTx);
  const net = netCashFlow(calcTx);

  const allTimeIncome = allTimeAgg.find((a) => a.type === "INCOME")?._sum.amount ?? 0;
  const allTimeExpenses = allTimeAgg.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0;
  const totalBalance = allTimeIncome - allTimeExpenses;

  const spendMap = spendByCategory(calcTx);
  const spendingByCategory = Array.from(spendMap.entries())
    .map(([categoryId, amount]) => {
      if (categoryId === "uncategorized") {
        return { categoryId, name: "Uncategorized", color: "#6b7280", amount };
      }
      const tx = periodTransactions.find((t) => t.categoryId === categoryId);
      return {
        categoryId,
        name: tx?.category?.name ?? "Uncategorized",
        color: tx?.category?.color ?? "#6b7280",
        amount,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Budget progress is always for the current calendar month, regardless of
  // the dashboard's selected reporting period (budgets are inherently
  // monthly) — reuse the already-fetched period transactions when the
  // period happens to be exactly this month, otherwise fetch separately.
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthTransactions =
    period.from.getTime() === monthStart.getTime() && period.to.getTime() <= monthEnd.getTime()
      ? calcTx
      : (
          await prisma.transaction.findMany({
            where: { userId, type: "EXPENSE", date: { gte: monthStart, lte: monthEnd } },
            select: { amount: true, categoryId: true, type: true },
          })
        ).map((t) => ({ type: t.type, amount: t.amount, categoryId: t.categoryId }));

  const monthSpendMap = spendByCategory(monthTransactions);
  const budgetProgress = (currentMonthBudget?.categories ?? []).map((bc) => {
    const spent = monthSpendMap.get(bc.categoryId) ?? 0;
    return {
      categoryId: bc.categoryId,
      name: bc.category.name,
      color: bc.category.color,
      limit: bc.amountLimit,
      spent,
      remaining: remainingBudget(bc.amountLimit, spent),
      percentage: budgetUsedPercentage(bc.amountLimit, spent),
      status: budgetStatus(bc.amountLimit, spent),
    };
  });

  const totalPlanned = budgetProgress.reduce((s, b) => s + b.limit, 0);
  const totalSpentAgainstBudget = budgetProgress.reduce((s, b) => s + b.spent, 0);

  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);

  const monthly = await Promise.all(
    lastNMonths(6, now).map(async (m) => {
      const rows = await prisma.transaction.groupBy({
        by: ["type"],
        where: { userId, date: { gte: m.from, lte: m.to } },
        _sum: { amount: true },
      });
      return {
        label: m.label,
        income: rows.find((r) => r.type === "INCOME")?._sum.amount ?? 0,
        expenses: rows.find((r) => r.type === "EXPENSE")?._sum.amount ?? 0,
      };
    }),
  );

  return {
    totalBalance,
    income,
    expenses,
    net,
    remainingBudget: remainingBudget(totalPlanned, totalSpentAgainstBudget),
    totalPlanned,
    totalSpentAgainstBudget,
    spendingByCategory,
    recentTransactions,
    budgetProgress,
    hasBudgetForThisMonth: !!currentMonthBudget,
    savings: {
      totalTarget,
      totalSaved,
      percentage: savingsProgressPercentage(totalSaved, totalTarget),
      goals: savingsGoals.slice(0, 3),
    },
    monthlyTrend: monthly,
  };
}
