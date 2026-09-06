import { describe, expect, it } from "vitest";
import {
  budgetStatus,
  budgetUsedPercentage,
  categorySpend,
  netCashFlow,
  remainingBudget,
  savingsProgressPercentage,
  spendByCategory,
  totalExpenses,
  totalIncome,
  type CalcTransaction,
} from "@/lib/calculations";

const tx = (overrides: Partial<CalcTransaction>): CalcTransaction => ({
  type: "EXPENSE",
  amount: 0,
  categoryId: null,
  ...overrides,
});

describe("totalIncome / totalExpenses / netCashFlow", () => {
  it("sums only matching transaction types", () => {
    const transactions = [
      tx({ type: "INCOME", amount: 500000 }),
      tx({ type: "EXPENSE", amount: 12000 }),
      tx({ type: "EXPENSE", amount: 8000 }),
    ];
    expect(totalIncome(transactions)).toBe(500000);
    expect(totalExpenses(transactions)).toBe(20000);
    expect(netCashFlow(transactions)).toBe(480000);
  });

  it("returns 0 for an empty transaction list", () => {
    expect(totalIncome([])).toBe(0);
    expect(totalExpenses([])).toBe(0);
    expect(netCashFlow([])).toBe(0);
  });

  it("produces a negative net cash flow when expenses exceed income", () => {
    const transactions = [tx({ type: "INCOME", amount: 1000 }), tx({ type: "EXPENSE", amount: 5000 })];
    expect(netCashFlow(transactions)).toBe(-4000);
  });
});

describe("categorySpend / spendByCategory", () => {
  it("only counts expenses for the given category", () => {
    const transactions = [
      tx({ type: "EXPENSE", amount: 1000, categoryId: "groceries" }),
      tx({ type: "EXPENSE", amount: 500, categoryId: "groceries" }),
      tx({ type: "EXPENSE", amount: 2000, categoryId: "rent" }),
      tx({ type: "INCOME", amount: 999999, categoryId: "groceries" }), // income never counts as spend
    ];
    expect(categorySpend(transactions, "groceries")).toBe(1500);
    expect(categorySpend(transactions, "rent")).toBe(2000);
    expect(categorySpend(transactions, "nonexistent")).toBe(0);
  });

  it("groups null categories under 'uncategorized'", () => {
    const transactions = [tx({ type: "EXPENSE", amount: 300, categoryId: null })];
    const map = spendByCategory(transactions);
    expect(map.get("uncategorized")).toBe(300);
  });

  it("still attributes historical spend after a category is deleted (categoryId becomes null)", () => {
    // Simulates Category.onDelete: SetNull — the transaction survives, just uncategorized.
    const beforeDelete = [tx({ type: "EXPENSE", amount: 400, categoryId: "old-cat" })];
    const afterDelete = [tx({ type: "EXPENSE", amount: 400, categoryId: null })];
    expect(categorySpend(beforeDelete, "old-cat")).toBe(400);
    expect(spendByCategory(afterDelete).get("uncategorized")).toBe(400);
  });
});

describe("remainingBudget / budgetUsedPercentage / budgetStatus", () => {
  it("computes remaining as limit minus spent, allowing negative (over budget)", () => {
    expect(remainingBudget(10000, 4000)).toBe(6000);
    expect(remainingBudget(10000, 15000)).toBe(-5000);
  });

  it("computes percentage used, clamped at 0", () => {
    expect(budgetUsedPercentage(10000, 5000)).toBe(50);
    expect(budgetUsedPercentage(10000, 20000)).toBe(200);
    expect(budgetUsedPercentage(10000, 0)).toBe(0);
  });

  it("treats a zero-limit budget with spend as 100% used, not a divide-by-zero crash", () => {
    expect(budgetUsedPercentage(0, 500)).toBe(100);
    expect(budgetUsedPercentage(0, 0)).toBe(0);
  });

  it("classifies status by threshold: under < 90%, warning 90-99%, over >= 100%", () => {
    expect(budgetStatus(10000, 5000)).toBe("under");
    expect(budgetStatus(10000, 9000)).toBe("warning");
    expect(budgetStatus(10000, 9900)).toBe("warning");
    expect(budgetStatus(10000, 10000)).toBe("over");
    expect(budgetStatus(10000, 15000)).toBe("over");
  });
});

describe("savingsProgressPercentage", () => {
  it("computes current / target as a percentage", () => {
    expect(savingsProgressPercentage(2500, 10000)).toBe(25);
    expect(savingsProgressPercentage(10000, 10000)).toBe(100);
    expect(savingsProgressPercentage(15000, 10000)).toBe(150);
  });

  it("returns 0 rather than NaN/Infinity when the target is zero or negative", () => {
    expect(savingsProgressPercentage(500, 0)).toBe(0);
    expect(savingsProgressPercentage(500, -100)).toBe(0);
  });

  it("clamps a negative current amount's percentage at 0", () => {
    expect(savingsProgressPercentage(-500, 10000)).toBe(0);
  });
});
