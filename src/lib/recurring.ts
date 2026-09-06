import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
} from "date-fns";

export type RecurrenceFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUALLY";

const PERIOD_DAYS: Partial<Record<RecurrenceFrequency, number>> = { WEEKLY: 7, BIWEEKLY: 14 };
const PERIOD_MONTHS: Partial<Record<RecurrenceFrequency, number>> = { MONTHLY: 1, QUARTERLY: 3 };

/**
 * Computes the Nth occurrence of a recurrence rule, anchored to the
 * original `startDate` rather than compounding off the previous
 * occurrence. This matters for month-based frequencies: naively calling
 * `addMonths` repeatedly on the last computed date lets a month-end date
 * drift permanently downward (Jan 31 -> Feb 28 -> Mar 28 instead of Mar
 * 31) the first time it crosses a short month, because date-fns clamps
 * Feb 31 to Feb 28 and that clamped day then becomes the new base. Adding
 * `n` periods to the immutable start date every time avoids that drift —
 * Jan 31 -> Feb 28 -> Mar 31 -> Apr 30, "snapping back" to the 31st
 * whenever the target month has one. Day-based frequencies (weekly,
 * biweekly) have no such clamping behavior, but are computed the same
 * anchored way for consistency.
 */
export function addPeriods(startDate: Date, frequency: RecurrenceFrequency, count: number): Date {
  const days = PERIOD_DAYS[frequency];
  if (days !== undefined) return addDays(startDate, days * count);

  const months = PERIOD_MONTHS[frequency];
  if (months !== undefined) return addMonths(startDate, months * count);

  return addYears(startDate, count); // ANNUALLY
}

/** Advances a date by exactly one occurrence of the given frequency (used only to display/estimate "next time"; occurrence generation uses the anchored addPeriods above). */
export function advanceByFrequency(date: Date, frequency: RecurrenceFrequency): Date {
  return addPeriods(date, frequency, 1);
}

export type RecurringSeed = {
  frequency: RecurrenceFrequency;
  startDate: Date;
  nextRunDate: Date;
  endDate: Date | null;
  isActive: boolean;
};

export type DueOccurrencesResult = {
  /** Occurrence dates that are due (<= asOf, and <= endDate if set). */
  occurrenceDates: Date[];
  /** The nextRunDate the recurring rule should be updated to after materializing occurrenceDates. */
  nextRunDate: Date;
  /** True once nextRunDate has passed endDate — caller should set isActive = false. */
  exhausted: boolean;
};

// Safety cap so a rule left dormant for years (or a bad end date) can't
// generate an unbounded number of transactions in one pass.
const MAX_OCCURRENCES_PER_RUN = 366;

/** The occurrence index `n` such that addPeriods(startDate, frequency, n) === nextRunDate. */
function periodIndexOf(seed: Pick<RecurringSeed, "frequency" | "startDate" | "nextRunDate">): number {
  switch (seed.frequency) {
    case "WEEKLY":
      return Math.round(differenceInCalendarDays(seed.nextRunDate, seed.startDate) / 7);
    case "BIWEEKLY":
      return Math.round(differenceInCalendarDays(seed.nextRunDate, seed.startDate) / 14);
    case "MONTHLY":
      return differenceInCalendarMonths(seed.nextRunDate, seed.startDate);
    case "QUARTERLY":
      return Math.round(differenceInCalendarMonths(seed.nextRunDate, seed.startDate) / 3);
    case "ANNUALLY":
      return differenceInCalendarYears(seed.nextRunDate, seed.startDate);
  }
}

/**
 * Given a recurring rule and "as of" instant (normally "now"), returns every
 * occurrence date that is due but hasn't been materialized yet, plus the
 * rule's updated nextRunDate. Pure function — the caller is responsible for
 * actually persisting the generated Transaction rows and the new
 * nextRunDate/isActive within a single transaction (see
 * src/server/recurring-runner.ts).
 */
export function computeDueOccurrences(seed: RecurringSeed, asOf: Date): DueOccurrencesResult {
  if (!seed.isActive) {
    return { occurrenceDates: [], nextRunDate: seed.nextRunDate, exhausted: false };
  }

  const occurrenceDates: Date[] = [];
  let periodIndex = periodIndexOf(seed);
  let cursor = seed.nextRunDate;
  let exhausted = false;

  while (occurrenceDates.length < MAX_OCCURRENCES_PER_RUN) {
    if (seed.endDate && cursor > seed.endDate) {
      exhausted = true;
      break;
    }
    if (cursor > asOf) break;
    occurrenceDates.push(cursor);
    periodIndex += 1;
    cursor = addPeriods(seed.startDate, seed.frequency, periodIndex);
  }

  return { occurrenceDates, nextRunDate: cursor, exhausted };
}
