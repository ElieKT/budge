import { describe, expect, it } from "vitest";
import { simulatePayoff, type DebtInput } from "@/lib/debtPayoff";

describe("simulatePayoff", () => {
  it("returns zero months for no debts", () => {
    const result = simulatePayoff([], 0, "AVALANCHE");
    expect(result.totalMonths).toBe(0);
    expect(result.totalInterestCents).toBe(0);
    expect(result.order).toEqual([]);
    expect(result.stalled).toBe(false);
  });

  it("pays off a single debt in a sane number of months and reports positive interest", () => {
    // $1,200 balance, 12% APR, $110/mo minimum, no extra.
    const debts: DebtInput[] = [{ id: "a", name: "Card", balanceCents: 120_000, aprPercent: 12, minPaymentCents: 11_000 }];
    const result = simulatePayoff(debts, 0, "AVALANCHE");

    expect(result.stalled).toBe(false);
    expect(result.totalMonths).toBeGreaterThan(10);
    expect(result.totalMonths).toBeLessThan(14);
    expect(result.totalInterestCents).toBeGreaterThan(0);
    expect(result.order).toEqual([{ id: "a", name: "Card", payoffMonth: result.totalMonths }]);
  });

  it("avalanche pays off the highest-APR debt first", () => {
    const debts: DebtInput[] = [
      { id: "low-apr", name: "Low APR", balanceCents: 500_000, aprPercent: 5, minPaymentCents: 10_000 },
      { id: "high-apr", name: "High APR", balanceCents: 200_000, aprPercent: 25, minPaymentCents: 5_000 },
    ];
    const result = simulatePayoff(debts, 20_000, "AVALANCHE");
    const highApr = result.order.find((d) => d.id === "high-apr")!;
    const lowApr = result.order.find((d) => d.id === "low-apr")!;
    expect(highApr.payoffMonth).toBeLessThan(lowApr.payoffMonth);
  });

  it("snowball pays off the smallest-balance debt first", () => {
    const debts: DebtInput[] = [
      { id: "small-balance", name: "Small balance", balanceCents: 100_000, aprPercent: 22, minPaymentCents: 3_000 },
      { id: "large-balance", name: "Large balance", balanceCents: 900_000, aprPercent: 8, minPaymentCents: 20_000 },
    ];
    const result = simulatePayoff(debts, 20_000, "SNOWBALL");
    const small = result.order.find((d) => d.id === "small-balance")!;
    const large = result.order.find((d) => d.id === "large-balance")!;
    expect(small.payoffMonth).toBeLessThan(large.payoffMonth);
  });

  it("extra monthly payments reduce total months and total interest", () => {
    const debts: DebtInput[] = [{ id: "a", name: "Card", balanceCents: 500_000, aprPercent: 20, minPaymentCents: 15_000 }];
    const withoutExtra = simulatePayoff(debts, 0, "AVALANCHE");
    const withExtra = simulatePayoff(debts, 20_000, "AVALANCHE");

    expect(withExtra.totalMonths).toBeLessThan(withoutExtra.totalMonths);
    expect(withExtra.totalInterestCents).toBeLessThan(withoutExtra.totalInterestCents);
  });

  it("rolls a paid-off debt's minimum payment into the next debt (the snowball/avalanche effect)", () => {
    // Debt A pays off quickly; its minimum should then accelerate debt B beyond what B's own minimum would do alone.
    const small: DebtInput = { id: "a", name: "Small", balanceCents: 20_000, aprPercent: 10, minPaymentCents: 20_000 }; // paid off month 1
    const big: DebtInput = { id: "b", name: "Big", balanceCents: 300_000, aprPercent: 10, minPaymentCents: 5_000 };
    const withRollover = simulatePayoff([small, big], 0, "AVALANCHE");
    const bAlone = simulatePayoff([big], 0, "AVALANCHE");

    expect(withRollover.totalMonths).toBeLessThan(bAlone.totalMonths);
  });

  it("flags a debt as stalled when the minimum payment doesn't cover accruing interest", () => {
    // $10,000 balance at 36% APR accrues $300/mo interest; a $50/mo minimum can never make progress.
    const debts: DebtInput[] = [{ id: "a", name: "Predatory", balanceCents: 1_000_000, aprPercent: 36, minPaymentCents: 5_000 }];
    const result = simulatePayoff(debts, 0, "AVALANCHE");
    expect(result.stalled).toBe(true);
  });
});
