import { endOfDay, endOfMonth, startOfDay, startOfMonth, startOfYear, subMonths } from "date-fns";

export const PERIOD_OPTIONS = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_3_months", label: "Last 3 months" },
  { value: "year_to_date", label: "Year to date" },
  { value: "custom", label: "Custom range" },
] as const;

export type PeriodValue = (typeof PERIOD_OPTIONS)[number]["value"];

export type ResolvedPeriod = { from: Date; to: Date; period: PeriodValue };

/**
 * Resolves a period selector (query params) into a concrete, inclusive
 * [from, to] date range. Falls back to "this month" for anything
 * unrecognized or for an invalid/incomplete custom range, rather than
 * silently returning an unbounded or nonsensical range.
 */
export function resolvePeriod(
  input: { period?: string; from?: string; to?: string },
  now: Date = new Date(),
): ResolvedPeriod {
  const period = (PERIOD_OPTIONS.find((p) => p.value === input.period)?.value ??
    "this_month") as PeriodValue;

  switch (period) {
    case "last_month": {
      const target = subMonths(now, 1);
      return { from: startOfMonth(target), to: endOfMonth(target), period };
    }
    case "last_3_months": {
      return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now), period };
    }
    case "year_to_date": {
      return { from: startOfYear(now), to: endOfDay(now), period };
    }
    case "custom": {
      if (input.from && input.to) {
        const from = new Date(input.from);
        const to = new Date(input.to);
        if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from <= to) {
          return { from: startOfDay(from), to: endOfDay(to), period };
        }
      }
      return { from: startOfMonth(now), to: endOfMonth(now), period: "this_month" };
    }
    case "this_month":
    default:
      return { from: startOfMonth(now), to: endOfMonth(now), period: "this_month" };
  }
}

/** Last N calendar months (oldest first), each as a [from, to] range with a short label — for MoM charts. */
export function lastNMonths(n: number, now: Date = new Date()) {
  const months: { from: Date; to: Date; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const target = subMonths(now, i);
    months.push({
      from: startOfMonth(target),
      to: endOfMonth(target),
      label: target.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return months;
}
