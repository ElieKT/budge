"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { parseAmountToCents } from "@/lib/money";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

/**
 * Called once, at the end of the onboarding wizard (or immediately if the
 * user skips it). Every step before this persists nothing on its own —
 * the wizard passes its accumulated choices here in one shot — except the
 * budget/expense/goal steps, which use the normal create actions directly
 * so they behave identically whether created during onboarding or later.
 */
export async function completeOnboarding(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = onboardingSchema.safeParse({
    currency: formData.get("currency") || undefined,
    monthlyIncomeEstimate: formData.get("monthlyIncomeEstimate") || undefined,
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  await prisma.userPreference.upsert({
    where: { userId },
    update: {
      currency: parsed.data.currency,
      monthlyIncomeEstimate: parsed.data.monthlyIncomeEstimate
        ? parseAmountToCents(parsed.data.monthlyIncomeEstimate)
        : undefined,
      onboardingCompletedAt: new Date(),
    },
    create: {
      userId,
      currency: parsed.data.currency,
      monthlyIncomeEstimate: parsed.data.monthlyIncomeEstimate
        ? parseAmountToCents(parsed.data.monthlyIncomeEstimate)
        : undefined,
      onboardingCompletedAt: new Date(),
    },
  });

  revalidatePath("/dashboard");
  return okResult(undefined);
}

export async function skipOnboarding(): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.userPreference.upsert({
    where: { userId },
    update: { onboardingCompletedAt: new Date() },
    create: { userId, onboardingCompletedAt: new Date() },
  });
  revalidatePath("/dashboard");
  return okResult(undefined);
}
