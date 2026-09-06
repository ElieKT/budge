import { describe, expect, it } from "vitest";
import { lastNMonths, resolvePeriod } from "@/lib/period";

const NOW = new Date("2026-03-15T12:00:00.000Z");

describe("resolvePeriod", () => {
  it("defaults to this month for no input", () => {
    const result = resolvePeriod({}, NOW);
    expect(result.period).toBe("this_month");
    // Compared in local time (as date-fns' startOfMonth/endOfMonth produce),
    // not UTC, so this is stable regardless of the runner's timezone.
    expect(result.from.getMonth()).toBe(NOW.getMonth());
    expect(result.to.getMonth()).toBe(NOW.getMonth());
  });

  it("resolves last month across a year boundary", () => {
    const jan = new Date("2026-01-10T00:00:00.000Z");
    const result = resolvePeriod({ period: "last_month" }, jan);
    expect(result.from.getFullYear()).toBe(2025);
    expect(result.from.getMonth()).toBe(11); // December
  });

  it("resolves a valid custom range", () => {
    const result = resolvePeriod({ period: "custom", from: "2026-01-01", to: "2026-01-31" }, NOW);
    expect(result.period).toBe("custom");
    expect(result.from < result.to).toBe(true);
  });

  it("falls back to this month for an invalid custom range (from after to) rather than an unbounded query", () => {
    const result = resolvePeriod({ period: "custom", from: "2026-05-01", to: "2026-01-01" }, NOW);
    expect(result.period).toBe("this_month");
  });

  it("falls back to this month for a malformed custom date", () => {
    const result = resolvePeriod({ period: "custom", from: "not-a-date", to: "2026-01-31" }, NOW);
    expect(result.period).toBe("this_month");
  });

  it("falls back to this month for an unrecognized period value", () => {
    const result = resolvePeriod({ period: "literally_forever" }, NOW);
    expect(result.period).toBe("this_month");
  });
});

describe("lastNMonths", () => {
  it("returns exactly n months, oldest first, ending with the current month", () => {
    const months = lastNMonths(6, NOW);
    expect(months).toHaveLength(6);
    expect(months[5]!.to.getMonth()).toBe(NOW.getMonth());
    expect(months[0]!.from < months[5]!.from).toBe(true);
  });
});
