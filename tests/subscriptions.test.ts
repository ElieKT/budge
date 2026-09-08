import { describe, expect, it } from "vitest";
import { annualEquivalentCents, monthlyEquivalentCents, needsReview } from "@/lib/subscriptions";

describe("annualEquivalentCents / monthlyEquivalentCents", () => {
  it("treats monthly as-is", () => {
    expect(monthlyEquivalentCents(1599, "MONTHLY")).toBe(1599);
    expect(annualEquivalentCents(1599, "MONTHLY")).toBe(1599 * 12);
  });

  it("converts weekly to its monthly/annual equivalents", () => {
    expect(annualEquivalentCents(1000, "WEEKLY")).toBe(52_000);
    expect(monthlyEquivalentCents(1000, "WEEKLY")).toBe(Math.round(52_000 / 12));
  });

  it("converts yearly down to a monthly equivalent", () => {
    expect(annualEquivalentCents(12_000, "ANNUALLY")).toBe(12_000);
    expect(monthlyEquivalentCents(12_000, "ANNUALLY")).toBe(1000);
  });

  it("converts quarterly and biweekly", () => {
    expect(annualEquivalentCents(3000, "QUARTERLY")).toBe(12_000);
    expect(annualEquivalentCents(1000, "BIWEEKLY")).toBe(26_000);
  });
});

describe("needsReview", () => {
  const now = new Date("2026-09-08T00:00:00Z");

  it("is false for a subscription created recently and never reviewed", () => {
    const createdAt = new Date("2026-08-20T00:00:00Z"); // ~19 days ago
    expect(needsReview({ createdAt, lastReviewedAt: null }, now)).toBe(false);
  });

  it("is true once a never-reviewed subscription is older than the stale window", () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    expect(needsReview({ createdAt, lastReviewedAt: null }, now)).toBe(true);
  });

  it("uses lastReviewedAt instead of createdAt when present", () => {
    const createdAt = new Date("2020-01-01T00:00:00Z");
    const lastReviewedAt = new Date("2026-09-01T00:00:00Z"); // 7 days ago
    expect(needsReview({ createdAt, lastReviewedAt }, now)).toBe(false);
  });

  it("respects a custom stale window", () => {
    const createdAt = new Date("2026-09-01T00:00:00Z"); // 7 days ago
    expect(needsReview({ createdAt, lastReviewedAt: null }, now, 5)).toBe(true);
    expect(needsReview({ createdAt, lastReviewedAt: null }, now, 10)).toBe(false);
  });
});
