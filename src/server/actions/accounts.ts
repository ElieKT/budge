"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { parseAmountToCents } from "@/lib/money";
import { manualAccountInputSchema, updateAccountBalanceSchema } from "@/lib/validation/financialAccount";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

export async function createManualAccount(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = manualAccountInputSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    currentBalance: formData.get("currentBalance"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  await prisma.financialAccount.create({
    data: {
      userId,
      name: parsed.data.name,
      type: parsed.data.type,
      currentBalance: parseAmountToCents(parsed.data.currentBalance),
      source: "MANUAL",
    },
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return okResult(undefined);
}

export async function updateAccountBalance(
  accountId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const account = await prisma.financialAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) return errorResult("Account not found.");
  if (account.source !== "MANUAL") {
    return errorResult("This account is synced automatically and can't be edited manually.");
  }

  const parsed = updateAccountBalanceSchema.safeParse({ currentBalance: formData.get("currentBalance") });
  if (!parsed.success) return zodErrorResult(parsed.error);

  await prisma.financialAccount.update({
    where: { id: accountId },
    data: { currentBalance: parseAmountToCents(parsed.data.currentBalance) },
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return okResult(undefined);
}

export async function archiveAccount(accountId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const account = await prisma.financialAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) return errorResult("Account not found.");

  await prisma.financialAccount.update({ where: { id: accountId }, data: { isArchived: true } });
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return okResult(undefined);
}
