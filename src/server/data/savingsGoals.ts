import "server-only";
import { prisma } from "@/lib/prisma";
import { savingsProgressPercentage } from "@/lib/calculations";

export async function getSavingsGoals(userId: string) {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: [{ isCompleted: "asc" }, { createdAt: "desc" }],
  });

  return goals.map((g) => ({
    ...g,
    percentage: savingsProgressPercentage(g.currentAmount, g.targetAmount),
  }));
}
