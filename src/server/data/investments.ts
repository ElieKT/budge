import "server-only";
import { prisma } from "@/lib/prisma";

export async function getInvestmentHoldingsForUser(userId: string) {
  const holdings = await prisma.investmentHolding.findMany({
    where: { account: { userId } },
    include: { account: true },
    orderBy: [{ account: { name: "asc" } }, { securityName: "asc" }],
  });
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCostBasis = holdings.reduce((sum, h) => sum + (h.costBasis ?? 0), 0);
  return { holdings, totalValue, totalCostBasis };
}

export function getInvestmentAccountsForUser(userId: string) {
  return prisma.financialAccount.findMany({
    where: { userId, isArchived: false, type: { in: ["INVESTMENT", "RETIREMENT", "CRYPTO"] } },
    orderBy: { name: "asc" },
  });
}
