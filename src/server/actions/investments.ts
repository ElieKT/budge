"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { parseAmountToCents } from "@/lib/money";
import { investmentHoldingInputSchema } from "@/lib/validation/investmentHolding";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

export async function createInvestmentHolding(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = investmentHoldingInputSchema.safeParse({
    accountId: formData.get("accountId"),
    securityName: formData.get("securityName"),
    ticker: formData.get("ticker") || undefined,
    assetClass: formData.get("assetClass"),
    quantity: formData.get("quantity"),
    costBasis: formData.get("costBasis") || undefined,
    currentValue: formData.get("currentValue"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const account = await prisma.financialAccount.findFirst({
    where: { id: parsed.data.accountId, userId },
  });
  if (!account) return errorResult("Account not found.");

  await prisma.investmentHolding.create({
    data: {
      accountId: parsed.data.accountId,
      securityName: parsed.data.securityName,
      ticker: parsed.data.ticker ?? null,
      assetClass: parsed.data.assetClass,
      quantity: parsed.data.quantity,
      costBasis: parsed.data.costBasis ? parseAmountToCents(parsed.data.costBasis) : null,
      currentValue: parseAmountToCents(parsed.data.currentValue),
    },
  });

  revalidatePath("/investments");
  revalidatePath("/dashboard");
  return okResult(undefined);
}

export async function deleteInvestmentHolding(holdingId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const holding = await prisma.investmentHolding.findFirst({
    where: { id: holdingId, account: { userId } },
  });
  if (!holding) return errorResult("Holding not found.");

  await prisma.investmentHolding.delete({ where: { id: holdingId } });
  revalidatePath("/investments");
  revalidatePath("/dashboard");
  return okResult(undefined);
}
