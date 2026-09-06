import "server-only";
import { prisma } from "@/lib/prisma";
import { computeDueOccurrences, type RecurringSeed } from "@/lib/recurring";

/**
 * Materializes any due occurrences of a single active recurring rule into
 * real Transaction rows, then advances the rule's nextRunDate (and flips
 * isActive off once it's past endDate). Idempotent: re-running with the
 * same `asOf` never double-creates, because nextRunDate only ever moves
 * forward past what's already been generated.
 */
async function runOne(rule: {
  id: string;
  userId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  categoryId: string | null;
  description: string | null;
  merchant: string | null;
  notes: string | null;
  frequency: RecurringSeed["frequency"];
  startDate: Date;
  nextRunDate: Date;
  endDate: Date | null;
  isActive: boolean;
}, asOf: Date) {
  const { occurrenceDates, nextRunDate, exhausted } = computeDueOccurrences(
    {
      frequency: rule.frequency,
      startDate: rule.startDate,
      nextRunDate: rule.nextRunDate,
      endDate: rule.endDate,
      isActive: rule.isActive,
    },
    asOf,
  );
  if (occurrenceDates.length === 0 && !exhausted) return 0;

  await prisma.$transaction([
    ...occurrenceDates.map((date) =>
      prisma.transaction.create({
        data: {
          userId: rule.userId,
          type: rule.type,
          amount: rule.amount,
          date,
          categoryId: rule.categoryId,
          description: rule.description,
          merchant: rule.merchant,
          notes: rule.notes,
          recurringTransactionId: rule.id,
        },
      }),
    ),
    prisma.recurringTransaction.update({
      where: { id: rule.id },
      data: { nextRunDate, isActive: exhausted ? false : rule.isActive },
    }),
  ]);

  return occurrenceDates.length;
}

/** Runs due recurring rules for a single user — called opportunistically on page load. */
export async function generateDueTransactionsForUser(userId: string, asOf: Date = new Date()) {
  const rules = await prisma.recurringTransaction.findMany({
    where: { userId, isActive: true, nextRunDate: { lte: asOf } },
  });
  let created = 0;
  for (const rule of rules) {
    created += await runOne(rule, asOf);
  }
  return created;
}

/**
 * Runs due recurring rules for every user. Intended to be invoked by an
 * external scheduler hitting POST /api/cron/recurring (see README —
 * "Recurring transactions" for why a scheduled job is still required even
 * though per-user generation also happens opportunistically on login).
 */
export async function generateDueTransactionsForAllUsers(asOf: Date = new Date()) {
  const rules = await prisma.recurringTransaction.findMany({
    where: { isActive: true, nextRunDate: { lte: asOf } },
  });
  let created = 0;
  for (const rule of rules) {
    created += await runOne(rule, asOf);
  }
  return { rulesProcessed: rules.length, transactionsCreated: created };
}
