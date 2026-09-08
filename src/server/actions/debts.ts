"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { parseAmountToCents } from "@/lib/money";
import { debtInputSchema } from "@/lib/validation/debt";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

export async function createDebt(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = debtInputSchema.safeParse({
    name: formData.get("name"),
    balance: formData.get("balance"),
    apr: formData.get("apr"),
    minPayment: formData.get("minPayment"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  await prisma.debt.create({
    data: {
      userId,
      name: parsed.data.name,
      balance: parseAmountToCents(parsed.data.balance),
      apr: parsed.data.apr,
      minPayment: parseAmountToCents(parsed.data.minPayment),
    },
  });

  revalidatePath("/debt-payoff");
  return okResult(undefined);
}

export async function updateDebt(debtId: string, _prev: unknown, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const debt = await prisma.debt.findFirst({ where: { id: debtId, userId } });
  if (!debt) return errorResult("Debt not found.");

  const parsed = debtInputSchema.safeParse({
    name: formData.get("name"),
    balance: formData.get("balance"),
    apr: formData.get("apr"),
    minPayment: formData.get("minPayment"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  await prisma.debt.update({
    where: { id: debtId },
    data: {
      name: parsed.data.name,
      balance: parseAmountToCents(parsed.data.balance),
      apr: parsed.data.apr,
      minPayment: parseAmountToCents(parsed.data.minPayment),
    },
  });

  revalidatePath("/debt-payoff");
  return okResult(undefined);
}

export async function deleteDebt(debtId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const debt = await prisma.debt.findFirst({ where: { id: debtId, userId } });
  if (!debt) return errorResult("Debt not found.");

  await prisma.debt.delete({ where: { id: debtId } });
  revalidatePath("/debt-payoff");
  return okResult(undefined);
}
