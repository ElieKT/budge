import { describe, expect, it } from "vitest";
import { advanceByFrequency, computeDueOccurrences, type RecurrenceFrequency } from "@/lib/recurring";

/**
 * date-fns' calendar arithmetic (addMonths/addWeeks/etc.) reads and writes
 * local wall-clock date fields, which is what a "transaction day" actually
 * means here. A UTC instant comparison (toISOString()) can spuriously
 * differ from a hand-written expectation across a DST transition even
 * though the calendar date is exactly right. To keep this suite correct
 * regardless of the machine's timezone, every expected date is produced by
 * parsing the same kind of date-only string the app itself parses (`d`)
 * and reading it back as a local calendar date (`ymd`) — so both sides of
 * every assertion go through an identical, timezone-consistent conversion.
 */
function ymd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function d(isoDateOnly: string): Date {
  return new Date(isoDateOnly);
}
function expectYmd(actual: Date, expectedIsoDateOnly: string) {
  expect(ymd(actual)).toBe(ymd(d(expectedIsoDateOnly)));
}
/** Convenience for tests where drift isn't the point: startDate defaults to nextRunDate. */
function seed(overrides: {
  frequency: RecurrenceFrequency;
  nextRunDate: Date;
  endDate: Date | null;
  isActive: boolean;
  startDate?: Date;
}) {
  return { startDate: overrides.nextRunDate, ...overrides };
}

describe("advanceByFrequency", () => {
  const base = d("2026-01-15");

  it("advances weekly by 7 days", () => {
    expectYmd(advanceByFrequency(base, "WEEKLY"), "2026-01-22");
  });
  it("advances biweekly by 14 days", () => {
    expectYmd(advanceByFrequency(base, "BIWEEKLY"), "2026-01-29");
  });
  it("advances monthly by 1 calendar month", () => {
    expectYmd(advanceByFrequency(base, "MONTHLY"), "2026-02-15");
  });
  it("advances quarterly by 3 calendar months", () => {
    expectYmd(advanceByFrequency(base, "QUARTERLY"), "2026-04-15");
  });
  it("advances annually by 1 year", () => {
    expectYmd(advanceByFrequency(base, "ANNUALLY"), "2027-01-15");
  });
});

describe("computeDueOccurrences", () => {
  it("returns nothing when the next run date is in the future", () => {
    const result = computeDueOccurrences(
      seed({ frequency: "MONTHLY", nextRunDate: d("2026-05-01"), endDate: null, isActive: true }),
      d("2026-04-01"),
    );
    expect(result.occurrenceDates).toHaveLength(0);
    expectYmd(result.nextRunDate, "2026-05-01");
  });

  it("returns exactly one occurrence when a single period is due", () => {
    const result = computeDueOccurrences(
      seed({ frequency: "MONTHLY", nextRunDate: d("2026-01-01"), endDate: null, isActive: true }),
      d("2026-01-15"),
    );
    expect(result.occurrenceDates.map(ymd)).toEqual([ymd(d("2026-01-01"))]);
    expectYmd(result.nextRunDate, "2026-02-01");
  });

  it("catches up multiple missed occurrences in one pass (e.g. user hasn't logged in for months)", () => {
    const result = computeDueOccurrences(
      seed({ frequency: "MONTHLY", nextRunDate: d("2026-01-01"), endDate: null, isActive: true }),
      d("2026-04-15"),
    );
    expect(result.occurrenceDates.map(ymd)).toEqual(
      ["2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01"].map((s) => ymd(d(s))),
    );
    expectYmd(result.nextRunDate, "2026-05-01");
    expect(result.exhausted).toBe(false);
  });

  it("stops at endDate and marks the rule exhausted", () => {
    const result = computeDueOccurrences(
      seed({ frequency: "MONTHLY", nextRunDate: d("2026-01-01"), endDate: d("2026-02-15"), isActive: true }),
      d("2026-06-01"),
    );
    expect(result.occurrenceDates.map(ymd)).toEqual(["2026-01-01", "2026-02-01"].map((s) => ymd(d(s))));
    expect(result.exhausted).toBe(true);
  });

  it("generates nothing for an inactive (paused) rule", () => {
    const result = computeDueOccurrences(
      seed({ frequency: "WEEKLY", nextRunDate: d("2020-01-01"), endDate: null, isActive: false }),
      d("2026-01-01"),
    );
    expect(result.occurrenceDates).toHaveLength(0);
    expect(result.exhausted).toBe(false);
  });

  it("is idempotent: re-running with the already-advanced nextRunDate produces no duplicates", () => {
    const startDate = d("2026-01-01");
    const first = computeDueOccurrences(
      { startDate, frequency: "MONTHLY", nextRunDate: startDate, endDate: null, isActive: true },
      d("2026-01-15"),
    );
    const second = computeDueOccurrences(
      { startDate, frequency: "MONTHLY", nextRunDate: first.nextRunDate, endDate: null, isActive: true },
      d("2026-01-15"),
    );
    expect(second.occurrenceDates).toHaveLength(0);
  });

  it("caps runaway generation via the safety limit instead of hanging or OOMing", () => {
    const result = computeDueOccurrences(
      seed({ frequency: "WEEKLY", nextRunDate: d("2000-01-01"), endDate: null, isActive: true }),
      d("2026-01-01"),
    );
    expect(result.occurrenceDates.length).toBeLessThanOrEqual(366);
    expect(result.occurrenceDates.length).toBeGreaterThan(0);
  });

  it("does not let a month-end date drift downward across February (anchors to startDate, not the previous occurrence)", () => {
    // Regression test: a naive implementation chains addMonths off the
    // previous cursor, so Jan 31 -> Feb 28 (clamped) -> Mar 28 (drifted,
    // wrong) -> Apr 28 (drifted) forever. Anchoring every occurrence to
    // the original startDate instead gives Jan 31 -> Feb 28 -> Mar 31 ->
    // Apr 30, snapping back to the 31st whenever the month has one.
    //
    // Built with local Date(y, m, d) constructors (not the `d()`/UTC-string
    // helper used elsewhere) so the calendar day under test — the 31st — is
    // exactly what the local-time addMonths arithmetic actually operates
    // on, regardless of the runner's UTC offset.
    const startDate = new Date(2026, 0, 31); // Jan 31, 2026, local time
    const result = computeDueOccurrences(
      { startDate, frequency: "MONTHLY", nextRunDate: startDate, endDate: null, isActive: true },
      new Date(2026, 3, 30), // Apr 30, 2026, local time
    );
    expect(result.occurrenceDates.map(ymd)).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
  });
});
