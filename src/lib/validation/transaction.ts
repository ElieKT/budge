import { z } from "zod";
import { dateOnlyString, optionalNote, positiveAmountString, shortText } from "./shared";

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);

export const transactionInputSchema = z.object({
  type: transactionTypeSchema,
  amount: positiveAmountString,
  date: dateOnlyString,
  categoryId: z.string().min(1).optional().or(z.literal("").transform(() => undefined)),
  description: shortText("Description", 200),
  merchant: shortText("Merchant", 200),
  notes: optionalNote,
});
export type TransactionInput = z.infer<typeof transactionInputSchema>;

export const transactionFilterSchema = z.object({
  type: z.enum(["ALL", "INCOME", "EXPENSE"]).default("ALL"),
  categoryId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["date_desc", "date_asc", "amount_desc", "amount_asc"]).default("date_desc"),
  page: z.coerce.number().int().min(1).default(1),
});
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
