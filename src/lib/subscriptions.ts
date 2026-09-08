/**
 * Subscription Radar — turns a recurring EXPENSE (see RecurringTransaction)
 * into a normalized monthly/annual cost so bills on different cadences
 * (weekly, quarterly, yearly...) can be compared and totaled directly.
 */

export type RecurrenceFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUALLY";

const OCCURRENCES_PER_YEAR: Record<RecurrenceFrequency, number> = {
  WEEKLY: 52,
  BIWEEKLY: 26,
  MONTHLY: 12,
  QUARTERLY: 4,
  ANNUALLY: 1,
};

export function annualEquivalentCents(amountCents: number, frequency: RecurrenceFrequency): number {
  return Math.round(amountCents * OCCURRENCES_PER_YEAR[frequency]);
}

export function monthlyEquivalentCents(amountCents: number, frequency: RecurrenceFrequency): number {
  return Math.round(annualEquivalentCents(amountCents, frequency) / 12);
}

/** A subscription "needs review" if it's never been reviewed and is more
 * than `staleDays` old, or was last reviewed more than `staleDays` ago. */
export function needsReview(
  { createdAt, lastReviewedAt }: { createdAt: Date; lastReviewedAt: Date | null },
  now: Date = new Date(),
  staleDays = 90,
): boolean {
  const baseline = lastReviewedAt ?? createdAt;
  const staleMs = staleDays * 24 * 60 * 60 * 1000;
  return now.getTime() - baseline.getTime() > staleMs;
}
