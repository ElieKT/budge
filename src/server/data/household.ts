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

/**
 * Reconciles a household immediately after one of its HouseholdMember rows
 * has been removed (however that happened — leaving, being removed, or the
 * member's whole account being deleted): deletes the household if nobody
 * remains, or hands ownership to the longest-standing member if the one who
 * left was the owner.
 *
 * This exists because Household has no direct owner foreign key — only the
 * HouseholdMember join table — so a plain cascading delete of a user (see
 * deleteAccount()) removes their membership row but never the household
 * itself, silently leaving a permanent zero-member orphan behind. Every
 * code path that removes a membership must call this afterward.
 */
export async function reconcileHouseholdAfterMemberLeft(householdId: string) {
  const remaining = await prisma.householdMember.findMany({
    where: { householdId },
    orderBy: { joinedAt: "asc" },
  });

  if (remaining.length === 0) {
    await prisma.household.delete({ where: { id: householdId } });
  } else if (!remaining.some((m) => m.role === "OWNER") && remaining[0]) {
    await prisma.householdMember.update({ where: { id: remaining[0].id }, data: { role: "OWNER" } });
  }
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
