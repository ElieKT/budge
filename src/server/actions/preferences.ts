"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { parseAmountToCents } from "@/lib/money";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { okResult, zodErrorResult, type ActionResult } from "@/server/action-result";

/** Settings-page equivalent of the onboarding step — does not touch onboardingCompletedAt. */
export async function updatePreferences(_prev: unknown, formData: FormData): Promise<ActionResult> {
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
        : null,
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

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return okResult(undefined);
}
