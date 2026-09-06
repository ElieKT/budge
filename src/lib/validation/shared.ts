import { z } from "zod";

/**
 * A positive decimal amount, up to 2 places, entered as a string (from a
 * form input) — e.g. "42", "42.5", "42.50". Rejects negative amounts,
 * commas, currency symbols, and empty strings rather than coercing them.
 * Sign (income vs. expense) is carried by the record's `type`, not the
 * amount itself.
 */
export const positiveAmountString = z
  .string()
  .trim()
  .min(1, "Amount is required")
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount, e.g. 42.50")
  .refine((v) => Number(v) > 0, "Amount must be greater than zero");

/** A date supplied by a form as "yyyy-mm-dd" (native <input type="date">). */
export const dateOnlyString = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date");

export const optionalNote = z
  .string()
  .trim()
  .max(2000, "Notes must be 2000 characters or fewer")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const shortText = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .optional()
    .or(z.literal("").transform(() => undefined));
