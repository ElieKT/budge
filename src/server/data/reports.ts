import "server-only";
import { prisma } from "@/lib/prisma";
import { spendByCategory } from "@/lib/calculations";
import { lastNMonths, type ResolvedPeriod } from "@/lib/period";
import { getMonthlyBudget } from "./budgets";

export async function getReportsData(userId: string, period: ResolvedPeriod) {
  const now = new Date();

  const [monthlyRows, periodTransactions, currentBudget] = await Promise.all([
    Promise.all(
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
    ),
    prisma.transaction.findMany({
      where: { userId, type: "EXPENSE", date: { gte: period.from, lte: period.to } },
      include: { category: true },
    }),
    getMonthlyBudget(userId, now.getFullYear(), now.getMonth() + 1),
  ]);

  const spendMap = spendByCategory(periodTransactions);
  const categoryBreakdown = Array.from(spendMap.entries())
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

  return {
    monthlyTrend: monthlyRows,
    categoryBreakdown,
    budgetVsActual: currentBudget,
  };
}
