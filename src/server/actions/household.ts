"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { parseAmountToCents } from "@/lib/money";
import { assertHouseholdMember } from "@/server/data/household";
import {
  addHouseholdMemberSchema,
  createHouseholdSchema,
  sharedExpenseInputSchema,
} from "@/lib/validation/household";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

export async function createHousehold(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = createHouseholdSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return zodErrorResult(parsed.error);

  await prisma.household.create({
    data: {
      name: parsed.data.name,
      members: { create: { userId, role: "OWNER" } },
    },
  });

  revalidatePath("/household");
  return okResult(undefined);
}

export async function addHouseholdMember(
  householdId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  await assertHouseholdMember(householdId, userId); // any existing member can invite

  const parsed = addHouseholdMemberSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const invitee = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!invitee) {
    return errorResult("No Budge account exists with that email yet — ask them to register first.");
  }

  const existing = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: invitee.id } },
  });
  if (existing) return errorResult("That person is already a member of this household.");

  await prisma.householdMember.create({ data: { householdId, userId: invitee.id, role: "MEMBER" } });
  revalidatePath(`/household/${householdId}`);
  return okResult(undefined);
}

export async function removeHouseholdMember(householdId: string, memberUserId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const membership = await assertHouseholdMember(householdId, userId);

  if (memberUserId !== userId && membership.role !== "OWNER") {
    return errorResult("Only the household owner can remove other members.");
  }

  await prisma.householdMember.delete({
    where: { householdId_userId: { householdId, userId: memberUserId } },
  });

  const remaining = await prisma.householdMember.findMany({
    where: { householdId },
    orderBy: { joinedAt: "asc" },
  });

  if (remaining.length === 0) {
    // Nobody left — remove the household itself (cascades its expenses/splits).
    await prisma.household.delete({ where: { id: householdId } });
  } else if (!remaining.some((m) => m.role === "OWNER") && remaining[0]) {
    // The owner just left — hand ownership to whoever has been a member the longest.
    await prisma.householdMember.update({ where: { id: remaining[0].id }, data: { role: "OWNER" } });
  }

  revalidatePath(`/household/${householdId}`);
  revalidatePath("/household");
  return okResult(undefined);
}

export async function createSharedExpense(
  householdId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  await assertHouseholdMember(householdId, userId);

  const rawSplits = JSON.parse(String(formData.get("splits") || "[]"));
  const parsed = sharedExpenseInputSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    notes: formData.get("notes") || undefined,
    splits: rawSplits,
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  // Every split's userId must actually be a member of this household —
  // otherwise a client could fabricate a split against an arbitrary user id.
  const memberIds = new Set(
    (await prisma.householdMember.findMany({ where: { householdId }, select: { userId: true } })).map(
      (m) => m.userId,
    ),
  );
  if (parsed.data.splits.some((s) => !memberIds.has(s.userId))) {
    return errorResult("One or more selected people are not members of this household.");
  }

  const totalCents = parseAmountToCents(parsed.data.amount);
  const splitCents = parsed.data.splits.map((s) => ({
    userId: s.userId,
    shareAmount: parseAmountToCents(s.shareAmount),
  }));
  const splitSum = splitCents.reduce((sum, s) => sum + s.shareAmount, 0);
  if (splitSum !== totalCents) {
    return errorResult(
      `Splits must add up to the total (${(splitSum / 100).toFixed(2)} vs ${(totalCents / 100).toFixed(2)}).`,
    );
  }

  await prisma.sharedExpense.create({
    data: {
      householdId,
      paidByUserId: userId,
      amount: totalCents,
      description: parsed.data.description,
      date: new Date(parsed.data.date),
      notes: parsed.data.notes ?? null,
      splits: { create: splitCents },
    },
  });

  revalidatePath(`/household/${householdId}`);
  return okResult(undefined);
}

export async function deleteSharedExpense(householdId: string, expenseId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await assertHouseholdMember(householdId, userId);

  const expense = await prisma.sharedExpense.findFirst({ where: { id: expenseId, householdId } });
  if (!expense) return errorResult("Expense not found.");

  await prisma.sharedExpense.delete({ where: { id: expenseId } });
  revalidatePath(`/household/${householdId}`);
  return okResult(undefined);
}
