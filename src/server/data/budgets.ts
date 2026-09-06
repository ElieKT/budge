import "server-only";
import { prisma } from "@/lib/prisma";
import { budgetStatus, budgetUsedPercentage, remainingBudget, spendByCategory } from "@/lib/calculations";

export async function getMonthlyBudget(userId: string, year: number, month: number) {
  const [budget, expenseTransactions] = await Promise.all([
    prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId, year, month } },
      include: { categories: { include: { category: true }, orderBy: { category: { name: "asc" } } } },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0, 23, 59, 59, 999) },
      },
      select: { amount: true, categoryId: true, type: true },
    }),
  ]);

  const spendMap = spendByCategory(expenseTransactions);

  const categories = (budget?.categories ?? []).map((bc) => {
    const spent = spendMap.get(bc.categoryId) ?? 0;
    return {
      id: bc.id,
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

  return {
    budgetId: budget?.id ?? null,
    year,
    month,
    categories,
    totalLimit: categories.reduce((s, c) => s + c.limit, 0),
    totalSpent: categories.reduce((s, c) => s + c.spent, 0),
  };
}

export function listBudgetedMonths(userId: string) {
  return prisma.monthlyBudget.findMany({
    where: { userId },
    select: { year: true, month: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}
