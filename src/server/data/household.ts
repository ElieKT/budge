import "server-only";
import { prisma } from "@/lib/prisma";
import { householdNetBalances } from "@/lib/calculations";

export function getHouseholdsForUser(userId: string) {
  return prisma.household.findMany({
    where: { members: { some: { userId } } },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    orderBy: { createdAt: "asc" },
  });
}

/** Throws unless userId is a member of householdId — call before any household read/write. */
export async function assertHouseholdMember(householdId: string, userId: string) {
  const membership = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!membership) throw new Error("You're not a member of this household.");
  return membership;
}

export async function getHouseholdDetail(householdId: string, userId: string) {
  await assertHouseholdMember(householdId, userId);

  const household = await prisma.household.findUniqueOrThrow({
    where: { id: householdId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      expenses: {
        include: { splits: true, paidBy: { select: { id: true, name: true, email: true } } },
        orderBy: { date: "desc" },
      },
    },
  });

  const balances = householdNetBalances(
    household.expenses.map((e) => ({
      paidByUserId: e.paidByUserId,
      splits: e.splits.map((s) => ({ userId: s.userId, shareAmount: s.shareAmount })),
    })),
  );

  const memberBalances = household.members.map((m) => ({
    userId: m.userId,
    name: m.user.name ?? m.user.email,
    balance: balances.get(m.userId) ?? 0,
  }));

  return { household, memberBalances };
}
