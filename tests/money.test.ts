import { describe, expect, it } from "vitest";
import { InvalidAmountError, centsToDecimalString, formatCurrency, parseAmountToCents, safePercentage } from "@/lib/money";

describe("parseAmountToCents", () => {
  it("parses whole dollar amounts", () => {
    expect(parseAmountToCents("42")).toBe(4200);
  });

  it("parses decimal amounts", () => {
    expect(parseAmountToCents("42.5")).toBe(4250);
    expect(parseAmountToCents("42.50")).toBe(4250);
    expect(parseAmountToCents("0.01")).toBe(1);
  });

  it("parses negative amounts (sign is separate from type)", () => {
    expect(parseAmountToCents("-10.00")).toBe(-1000);
  });

  it("rejects garbage input rather than silently coercing it", () => {
    expect(() => parseAmountToCents("abc")).toThrow(InvalidAmountError);
    expect(() => parseAmountToCents("")).toThrow(InvalidAmountError);
    expect(() => parseAmountToCents("12.999")).toThrow(InvalidAmountError);
    expect(() => parseAmountToCents("$12.00")).toThrow(InvalidAmountError);
    expect(() => parseAmountToCents("1,200")).toThrow(InvalidAmountError);
    expect(() => parseAmountToCents("NaN")).toThrow(InvalidAmountError);
  });
});

describe("centsToDecimalString", () => {
  it("formats positive and negative cents", () => {
    expect(centsToDecimalString(4250)).toBe("42.50");
    expect(centsToDecimalString(-4250)).toBe("-42.50");
    expect(centsToDecimalString(5)).toBe("0.05");
    expect(centsToDecimalString(0)).toBe("0.00");
  });

  it("rejects non-integer cents (float contamination)", () => {
    expect(() => centsToDecimalString(42.5)).toThrow(InvalidAmountError);
    expect(() => centsToDecimalString(NaN)).toThrow(InvalidAmountError);
  });
});

describe("formatCurrency", () => {
  it("formats USD with symbol and thousands separators", () => {
    expect(formatCurrency(123456)).toBe("$1,234.56");
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(-500)).toBe("-$5.00");
  });
});

describe("safePercentage", () => {
  it("computes a rounded percentage", () => {
    expect(safePercentage(50, 200)).toBe(25);
    expect(safePercentage(1, 3)).toBe(33);
  });

  it("returns 0 for a zero or negative denominator instead of NaN/Infinity", () => {
    expect(safePercentage(50, 0)).toBe(0);
    expect(safePercentage(50, -10)).toBe(0);
  });
});
