"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { parseAmountToCents } from "@/lib/money";
import { transactionInputSchema } from "@/lib/validation/transaction";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

async function assertCategoryUsable(userId: string, categoryId: string | undefined) {
  if (!categoryId) return;
  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ userId }, { userId: null }] },
  });
  if (!category) throw new Error("Selected category is not available.");
}

export async function createTransaction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = transactionInputSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId") || undefined,
    description: formData.get("description") || undefined,
    merchant: formData.get("merchant") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  try {
    await assertCategoryUsable(userId, parsed.data.categoryId);
  } catch (e) {
    return errorResult((e as Error).message);
  }

  await prisma.transaction.create({
    data: {
      userId,
      type: parsed.data.type,
      amount: parseAmountToCents(parsed.data.amount),
      date: new Date(parsed.data.date),
      categoryId: parsed.data.categoryId ?? null,
      description: parsed.data.description ?? null,
      merchant: parsed.data.merchant ?? null,
      notes: parsed.data.notes ?? null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/reports");
  return okResult(undefined);
}

export async function updateTransaction(
  transactionId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();

  const existing = await prisma.transaction.findFirst({ where: { id: transactionId, userId } });
  if (!existing) return errorResult("Transaction not found.");

  const parsed = transactionInputSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId") || undefined,
    description: formData.get("description") || undefined,
    merchant: formData.get("merchant") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  try {
    await assertCategoryUsable(userId, parsed.data.categoryId);
  } catch (e) {
    return errorResult((e as Error).message);
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      type: parsed.data.type,
      amount: parseAmountToCents(parsed.data.amount),
      date: new Date(parsed.data.date),
      categoryId: parsed.data.categoryId ?? null,
      description: parsed.data.description ?? null,
      merchant: parsed.data.merchant ?? null,
      notes: parsed.data.notes ?? null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/reports");
  return okResult(undefined);
}

export async function deleteTransaction(transactionId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const existing = await prisma.transaction.findFirst({ where: { id: transactionId, userId } });
  if (!existing) return errorResult("Transaction not found.");

  await prisma.transaction.delete({ where: { id: transactionId } });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/reports");
  return okResult(undefined);
}
