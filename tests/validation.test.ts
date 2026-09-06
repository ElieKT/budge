import { describe, expect, it } from "vitest";
import { positiveAmountString, dateOnlyString } from "@/lib/validation/shared";
import { transactionInputSchema } from "@/lib/validation/transaction";
import { categoryInputSchema } from "@/lib/validation/category";
import { registerSchema, passwordSchema } from "@/lib/validation/auth";
import { monthlyBudgetInputSchema } from "@/lib/validation/budget";

describe("positiveAmountString", () => {
  it("accepts valid decimal amounts", () => {
    expect(positiveAmountString.safeParse("42.50").success).toBe(true);
    expect(positiveAmountString.safeParse("1").success).toBe(true);
  });

  it("rejects zero and negative amounts", () => {
    expect(positiveAmountString.safeParse("0").success).toBe(false);
    expect(positiveAmountString.safeParse("-5").success).toBe(false);
  });

  it("rejects empty, non-numeric, and over-precise input", () => {
    expect(positiveAmountString.safeParse("").success).toBe(false);
    expect(positiveAmountString.safeParse("abc").success).toBe(false);
    expect(positiveAmountString.safeParse("12.999").success).toBe(false);
  });
});

describe("dateOnlyString", () => {
  it("accepts a valid date string", () => {
    expect(dateOnlyString.safeParse("2026-01-15").success).toBe(true);
  });

  it("rejects an invalid date rather than silently coercing it", () => {
    expect(dateOnlyString.safeParse("not-a-date").success).toBe(false);
    expect(dateOnlyString.safeParse("").success).toBe(false);
  });
});

describe("transactionInputSchema", () => {
  it("accepts a well-formed expense", () => {
    const result = transactionInputSchema.safeParse({
      type: "EXPENSE",
      amount: "42.50",
      date: "2026-01-15",
      categoryId: "cat_1",
      merchant: "Trader Joe's",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid type", () => {
    const result = transactionInputSchema.safeParse({ type: "TRANSFER", amount: "10", date: "2026-01-15" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing amount", () => {
    const result = transactionInputSchema.safeParse({ type: "EXPENSE", date: "2026-01-15" });
    expect(result.success).toBe(false);
  });

  it("treats an empty categoryId as uncategorized (undefined), not an error", () => {
    const result = transactionInputSchema.safeParse({ type: "EXPENSE", amount: "10", date: "2026-01-15", categoryId: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.categoryId).toBeUndefined();
  });
});

describe("categoryInputSchema", () => {
  it("rejects an overly long name", () => {
    const result = categoryInputSchema.safeParse({ name: "x".repeat(61), kind: "EXPENSE", color: "#123456" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid color", () => {
    const result = categoryInputSchema.safeParse({ name: "Hobbies", kind: "EXPENSE", color: "blue" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid custom category", () => {
    const result = categoryInputSchema.safeParse({ name: "Hobbies", kind: "EXPENSE", color: "#123456" });
    expect(result.success).toBe(true);
  });
});

describe("passwordSchema / registerSchema", () => {
  it("rejects a password missing complexity requirements", () => {
    expect(passwordSchema.safeParse("alllowercase").success).toBe(false);
    expect(passwordSchema.safeParse("short1A").success).toBe(false);
    expect(passwordSchema.safeParse("nouppercase1").success).toBe(false);
    expect(passwordSchema.safeParse("NOLOWERCASE1").success).toBe(false);
  });

  it("accepts a compliant password", () => {
    expect(passwordSchema.safeParse("GoodPassword1").success).toBe(true);
  });

  it("normalizes email to lowercase and rejects a malformed one", () => {
    const result = registerSchema.safeParse({ name: "Ada", email: "ADA@Example.com", password: "GoodPassword1" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("ada@example.com");

    expect(registerSchema.safeParse({ name: "Ada", email: "not-an-email", password: "GoodPassword1" }).success).toBe(false);
  });
});

describe("monthlyBudgetInputSchema", () => {
  it("rejects duplicate categories in the same budget", () => {
    const result = monthlyBudgetInputSchema.safeParse({
      month: 1,
      year: 2026,
      allocations: [
        { categoryId: "cat_1", amountLimit: "100" },
        { categoryId: "cat_1", amountLimit: "50" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty allocation list", () => {
    const result = monthlyBudgetInputSchema.safeParse({ month: 1, year: 2026, allocations: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range month", () => {
    const result = monthlyBudgetInputSchema.safeParse({
      month: 13,
      year: 2026,
      allocations: [{ categoryId: "cat_1", amountLimit: "100" }],
    });
    expect(result.success).toBe(false);
  });
});
