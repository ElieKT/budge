"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-guard";
import { errorResult, okResult, type ActionResult } from "@/server/action-result";

/** Confirms the user still wants/uses this recurring bill, resetting its
 * "needs review" staleness clock. Purely a self-reported check-in — this
 * app has no way to observe actual usage of what a subscription pays for. */
export async function markSubscriptionReviewed(recurringId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const rule = await prisma.recurringTransaction.findFirst({ where: { id: recurringId, userId } });
  if (!rule) return errorResult("Recurring transaction not found.");

  await prisma.recurringTransaction.update({ where: { id: recurringId }, data: { lastReviewedAt: new Date() } });
  revalidatePath("/subscriptions");
  return okResult(undefined);
}
