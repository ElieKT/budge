/**
 * Money handling.
 *
 * Every monetary value is stored and computed as an integer number of minor
 * units (cents, for USD) — never a JavaScript float — so addition,
 * subtraction, and percentage math never accumulate binary-rounding error.
 * These helpers are the ONLY place that should convert between the "major
 * unit" strings a human types into a form and the integer cents Prisma
 * stores. Do not re-implement this conversion elsewhere.
 */

/** Matches an optionally-negative, optionally-decimal (max 2 places) amount. */
const AMOUNT_PATTERN = /^-?\d+(\.\d{1,2})?$/;

export class InvalidAmountError extends Error {
  constructor(input: unknown) {
    super(`Invalid monetary amount: ${JSON.stringify(input)}`);
    this.name = "InvalidAmountError";
  }
}

/**
 * Parses a user-entered decimal string (e.g. "12.5", "1200") into integer
 * cents. Throws InvalidAmountError rather than silently coercing malformed
 * or NaN input to 0 — callers must handle/report the error explicitly.
 */
export function parseAmountToCents(input: string): number {
  const trimmed = input.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) {
    throw new InvalidAmountError(input);
  }
  const [wholePart = "0", fractionPart = ""] = trimmed.split(".");
  const negative = wholePart.startsWith("-");
  const whole = Math.abs(Number(wholePart));
  const fraction = fractionPart.padEnd(2, "0").slice(0, 2);
  const cents = whole * 100 + Number(fraction);
  return negative ? -cents : cents;
}

/** Formats integer cents as a "12.50"-style decimal string (no currency symbol). */
export function centsToDecimalString(cents: number): string {
  if (!Number.isFinite(cents) || !Number.isInteger(cents)) {
    throw new InvalidAmountError(cents);
  }
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const remainder = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${remainder}`;
}

/** Formats integer cents as a localized currency string, e.g. "$1,234.50". */
export function formatCurrency(cents: number, currency = "USD", locale = "en-US"): string {
  if (!Number.isFinite(cents) || !Number.isInteger(cents)) {
    throw new InvalidAmountError(cents);
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  }).format(cents / 100);
}

/** Safe integer-cents division for progress bars / percentages, e.g. spent/limit. */
export function safePercentage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}
