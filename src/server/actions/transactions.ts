"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { parseAmountToCents } from "@/lib/money";
import { transactionInputSchema } from "@/lib/validation/transaction";
import { ALLOWED_RECEIPT_TYPES, MAX_RECEIPT_BYTES } from "@/lib/validation/receipt";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

async function assertCategoryUsable(userId: string, categoryId: string | undefined) {
  if (!categoryId) return;
  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ userId }, { userId: null }] },
  });
  if (!category) throw new Error("Selected category is not available.");
}

/**
 * Reads an optional "receipt" file field. Returns:
 * - `{ dataUrl: undefined }` — no new file was submitted, leave whatever's there alone
 * - `{ dataUrl: null }` — the "remove receipt" checkbox was checked
 * - `{ dataUrl: "data:..." }` — a new receipt to store
 */
function extractReceipt(formData: FormData): { ok: true; dataUrl?: string | null } | { ok: false; error: string } {
  if (formData.get("removeReceipt") === "true") return { ok: true, dataUrl: null };

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) return { ok: true, dataUrl: undefined };

  if (!ALLOWED_RECEIPT_TYPES.includes(file.type as (typeof ALLOWED_RECEIPT_TYPES)[number])) {
    return { ok: false, error: "Please upload a PNG, JPEG, WebP, or GIF image for the receipt." };
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return { ok: false, error: `That receipt image is too large — please use one under ${MAX_RECEIPT_BYTES / 1024 / 1024}MB.` };
  }

  return { ok: true, dataUrl: `pending` }; // placeholder — actual read happens async below (File.arrayBuffer)
}

async function readReceiptDataUrl(formData: FormData): Promise<{ ok: true; dataUrl?: string | null } | { ok: false; error: string }> {
  const check = extractReceipt(formData);
  if (!check.ok || check.dataUrl !== "pending") return check;

  const file = formData.get("receipt") as File;
  const buffer = Buffer.from(await file.arrayBuffer());
  return { ok: true, dataUrl: `data:${file.type};base64,${buffer.toString("base64")}` };
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

  const receipt = await readReceiptDataUrl(formData);
  if (!receipt.ok) return errorResult(receipt.error);

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
      receiptUrl: receipt.dataUrl ?? null,
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

  const receipt = await readReceiptDataUrl(formData);
  if (!receipt.ok) return errorResult(receipt.error);

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
      // undefined = leave column alone; null = clear it; string = replace it
      ...(receipt.dataUrl !== undefined ? { receiptUrl: receipt.dataUrl } : {}),
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
