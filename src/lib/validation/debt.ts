import { z } from "zod";
import { positiveAmountString } from "./shared";

/** Minimum payment can legitimately be 0 (e.g. a 0% promo balance with no
 * required payment tracked), so this is separate from positiveAmountString. */
const nonNegativeAmountString = z
  .string()
  .trim()
  .min(1, "Amount is required")
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount, e.g. 25.00");

export const debtInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  balance: positiveAmountString,
  apr: z.coerce.number().min(0, "APR can't be negative").max(100, "Enter a percentage, e.g. 24.99"),
  minPayment: nonNegativeAmountString,
});
export type DebtInput = z.infer<typeof debtInputSchema>;
