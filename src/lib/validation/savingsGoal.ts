import { z } from "zod";
import { optionalNote, positiveAmountString } from "./shared";

export const savingsGoalInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  targetAmount: positiveAmountString,
  currentAmount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  targetDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined))
    .refine((v) => v === undefined || !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  notes: optionalNote,
});
export type SavingsGoalInput = z.infer<typeof savingsGoalInputSchema>;

export const updateSavingsProgressSchema = z.object({
  currentAmount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount"),
});
