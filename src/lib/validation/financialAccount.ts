import { z } from "zod";

export const financialAccountTypeSchema = z.enum([
  "CHECKING",
  "SAVINGS",
  "CREDIT_CARD",
  "LOAN",
  "INVESTMENT",
  "RETIREMENT",
  "CRYPTO",
  "OTHER",
]);

// Balances are entered as a plain (non-negative) decimal — for a liability
// (credit card/loan) this is "how much you owe", never a negative number.
const balanceString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount, e.g. 1200.00");

export const manualAccountInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  type: financialAccountTypeSchema,
  currentBalance: balanceString,
});
export type ManualAccountInput = z.infer<typeof manualAccountInputSchema>;

export const updateAccountBalanceSchema = z.object({
  currentBalance: balanceString,
});
