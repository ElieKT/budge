import "server-only";
import { prisma } from "@/lib/prisma";
import { netWorth } from "@/lib/calculations";

export async function getAccountsForUser(userId: string) {
  const accounts = await prisma.financialAccount.findMany({
    where: { userId, isArchived: false },
    orderBy: [{ source: "asc" }, { createdAt: "asc" }],
  });
  return {
    accounts,
    netWorth: netWorth(accounts.map((a) => ({ type: a.type, currentBalance: a.currentBalance }))),
  };
}
