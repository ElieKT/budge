import { describe, expect, it } from "vitest";
import { computeTemplateAllocations } from "@/lib/budgetTemplates";

describe("computeTemplateAllocations", () => {
  it("splits income into needs/wants/savings roughly per the template's percentages", () => {
    const allocations = computeTemplateAllocations("BALANCED", 500000); // $5,000
    const total = allocations.reduce((sum, a) => sum + a.amountCents, 0);
    // Rounding per-category means the total won't be exact, but should be very close.
    expect(total).toBeGreaterThan(490000);
    expect(total).toBeLessThanOrEqual(500000);
  });

  it("gives Housing the largest single allocation under the balanced template", () => {
    const allocations = computeTemplateAllocations("BALANCED", 500000);
    const housing = allocations.find((a) => a.categoryName === "Housing")!;
    const max = Math.max(...allocations.map((a) => a.amountCents));
    expect(housing.amountCents).toBe(max);
  });

  it("bare bones puts more toward needs than balanced does, for the same income", () => {
    const bareBonesNeeds = computeTemplateAllocations("BARE_BONES", 400000)
      .filter((a) => a.categoryName === "Housing")
      .reduce((s, a) => s + a.amountCents, 0);
    const balancedNeeds = computeTemplateAllocations("BALANCED", 400000)
      .filter((a) => a.categoryName === "Housing")
      .reduce((s, a) => s + a.amountCents, 0);
    expect(bareBonesNeeds).toBeGreaterThan(balancedNeeds);
  });

  it("aggressive saver allocates more to Savings than balanced does", () => {
    const aggressive = computeTemplateAllocations("AGGRESSIVE_SAVER", 400000).find((a) => a.categoryName === "Savings")!;
    const balanced = computeTemplateAllocations("BALANCED", 400000).find((a) => a.categoryName === "Savings")!;
    expect(aggressive.amountCents).toBeGreaterThan(balanced.amountCents);
  });

  it("returns no zero-amount allocations", () => {
    const allocations = computeTemplateAllocations("BALANCED", 500000);
    expect(allocations.every((a) => a.amountCents > 0)).toBe(true);
  });

  it("handles zero income without throwing or producing negative amounts", () => {
    const allocations = computeTemplateAllocations("BALANCED", 0);
    expect(allocations).toHaveLength(0);
  });
});
