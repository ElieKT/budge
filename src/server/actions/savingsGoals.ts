"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { parseAmountToCents } from "@/lib/money";
import { savingsGoalInputSchema, updateSavingsProgressSchema } from "@/lib/validation/savingsGoal";
import { SAVINGS_GOAL_TEMPLATES } from "@/lib/savingsTemplates";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

/** Bulk-creates the selected starter buckets (Travel, Medical Emergency, etc.) in one go. */
export async function createStarterSavingsGoals(names: string[]): Promise<ActionResult> {
  const userId = await requireUserId();
  const templates = SAVINGS_GOAL_TEMPLATES.filter((t) => names.includes(t.name));
  if (templates.length === 0) return errorResult("Select at least one goal to add.");

  await prisma.savingsGoal.createMany({
    data: templates.map((t) => ({
      userId,
      name: t.name,
      targetAmount: t.targetAmountCents,
      currentAmount: 0,
    })),
  });

  revalidatePath("/savings-goals");
  revalidatePath("/dashboard");
  return okResult(undefined);
}

export async function createSavingsGoal(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = savingsGoalInputSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount") || undefined,
    targetDate: formData.get("targetDate") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const targetAmount = parseAmountToCents(parsed.data.targetAmount);
  const currentAmount = parsed.data.currentAmount ? parseAmountToCents(parsed.data.currentAmount) : 0;

  await prisma.savingsGoal.create({
    data: {
      userId,
      name: parsed.data.name,
      targetAmount,
      currentAmount,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
      notes: parsed.data.notes ?? null,
      isCompleted: currentAmount >= targetAmount,
    },
  });

  revalidatePath("/savings-goals");
  revalidatePath("/dashboard");
  return okResult(undefined);
}

export async function updateSavingsGoal(
  goalId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const goal = await prisma.savingsGoal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return errorResult("Savings goal not found.");

  const parsed = savingsGoalInputSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount") || undefined,
    targetDate: formData.get("targetDate") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const targetAmount = parseAmountToCents(parsed.data.targetAmount);
  const currentAmount = parsed.data.currentAmount
    ? parseAmountToCents(parsed.data.currentAmount)
    : goal.currentAmount;

  await prisma.savingsGoal.update({
    where: { id: goalId },
    data: {
      name: parsed.data.name,
      targetAmount,
      currentAmount,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
      notes: parsed.data.notes ?? null,
      isCompleted: currentAmount >= targetAmount,
    },
  });

  revalidatePath("/savings-goals");
  revalidatePath("/dashboard");
  return okResult(undefined);
}

export async function updateSavingsProgress(
  goalId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const goal = await prisma.savingsGoal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return errorResult("Savings goal not found.");

  const parsed = updateSavingsProgressSchema.safeParse({
    currentAmount: formData.get("currentAmount"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const currentAmount = parseAmountToCents(parsed.data.currentAmount);
  await prisma.savingsGoal.update({
    where: { id: goalId },
    data: { currentAmount, isCompleted: currentAmount >= goal.targetAmount },
  });

  revalidatePath("/savings-goals");
  revalidatePath("/dashboard");
  return okResult(undefined);
}

export async function markSavingsGoalComplete(goalId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const goal = await prisma.savingsGoal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return errorResult("Savings goal not found.");

  await prisma.savingsGoal.update({
    where: { id: goalId },
    data: { isCompleted: true, currentAmount: Math.max(goal.currentAmount, goal.targetAmount) },
  });
  revalidatePath("/savings-goals");
  revalidatePath("/dashboard");
  return okResult(undefined);
}

export async function deleteSavingsGoal(goalId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const goal = await prisma.savingsGoal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return errorResult("Savings goal not found.");

  await prisma.savingsGoal.delete({ where: { id: goalId } });
  revalidatePath("/savings-goals");
  revalidatePath("/dashboard");
  return okResult(undefined);
}
