import { z } from "zod";
import { dateOnlyString, optionalNote, positiveAmountString, shortText } from "./shared";
import { transactionTypeSchema } from "./transaction";

export const recurrenceFrequencySchema = z.enum([
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "ANNUALLY",
]);

export const recurringTransactionInputSchema = z
  .object({
    type: transactionTypeSchema,
    amount: positiveAmountString,
    categoryId: z.string().min(1).optional().or(z.literal("").transform(() => undefined)),
    description: shortText("Description", 200),
    merchant: shortText("Merchant", 200),
    notes: optionalNote,
    frequency: recurrenceFrequencySchema,
    startDate: dateOnlyString,
    endDate: z
      .string()
      .trim()
      .optional()
      .or(z.literal("").transform(() => undefined))
      .refine((v) => v === undefined || !Number.isNaN(Date.parse(v)), "Enter a valid end date"),
  })
  .refine(
    (v) => v.endDate === undefined || new Date(v.endDate) >= new Date(v.startDate),
    { message: "End date must be on or after the start date", path: ["endDate"] },
  );
export type RecurringTransactionInput = z.infer<typeof recurringTransactionInputSchema>;
