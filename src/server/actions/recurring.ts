"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { parseAmountToCents } from "@/lib/money";
import { recurringTransactionInputSchema } from "@/lib/validation/recurring";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

export async function createRecurringTransaction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = recurringTransactionInputSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId") || undefined,
    description: formData.get("description") || undefined,
    merchant: formData.get("merchant") || undefined,
    notes: formData.get("notes") || undefined,
    frequency: formData.get("frequency"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  if (parsed.data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, OR: [{ userId }, { userId: null }] },
    });
    if (!category) return errorResult("Selected category is not available.");
  }

  const startDate = new Date(parsed.data.startDate);
  await prisma.recurringTransaction.create({
    data: {
      userId,
      type: parsed.data.type,
      amount: parseAmountToCents(parsed.data.amount),
      categoryId: parsed.data.categoryId ?? null,
      description: parsed.data.description ?? null,
      merchant: parsed.data.merchant ?? null,
      notes: parsed.data.notes ?? null,
      frequency: parsed.data.frequency,
      startDate,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      nextRunDate: startDate,
    },
  });

  revalidatePath("/recurring");
  revalidatePath("/transactions");
  return okResult(undefined);
}

export async function toggleRecurringActive(
  recurringId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const rule = await prisma.recurringTransaction.findFirst({ where: { id: recurringId, userId } });
  if (!rule) return errorResult("Recurring transaction not found.");

  await prisma.recurringTransaction.update({ where: { id: recurringId }, data: { isActive } });
  revalidatePath("/recurring");
  return okResult(undefined);
}

export async function deleteRecurringTransaction(recurringId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const rule = await prisma.recurringTransaction.findFirst({ where: { id: recurringId, userId } });
  if (!rule) return errorResult("Recurring transaction not found.");

  await prisma.recurringTransaction.delete({ where: { id: recurringId } });
  revalidatePath("/recurring");
  revalidatePath("/transactions");
  return okResult(undefined);
}
