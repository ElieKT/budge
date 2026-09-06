import { z } from "zod";
import { positiveAmountString } from "./shared";

export const budgetAllocationSchema = z.object({
  categoryId: z.string().min(1),
  amountLimit: positiveAmountString,
});

export const monthlyBudgetInputSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  allocations: z
    .array(budgetAllocationSchema)
    .min(1, "Add at least one category limit")
    .refine(
      (items) => new Set(items.map((i) => i.categoryId)).size === items.length,
      "Each category can only appear once in a budget",
    ),
});
export type MonthlyBudgetInput = z.infer<typeof monthlyBudgetInputSchema>;

export const copyBudgetSchema = z.object({
  fromMonth: z.coerce.number().int().min(1).max(12),
  fromYear: z.coerce.number().int().min(2000).max(2100),
  toMonth: z.coerce.number().int().min(1).max(12),
  toYear: z.coerce.number().int().min(2000).max(2100),
});
