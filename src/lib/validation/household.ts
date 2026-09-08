import { z } from "zod";
import { emailSchema } from "./auth";

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
});

export const addHouseholdMemberSchema = z.object({
  email: emailSchema,
});

const shareAmount = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount");

export const sharedExpenseInputSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(160),
  amount: shareAmount,
  date: z.string().trim().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  // One share per member — must sum to `amount` (checked in the action,
  // since that requires knowing the parsed total in cents).
  splits: z
    .array(z.object({ userId: z.string().min(1), shareAmount }))
    .min(1, "Add at least one person to split with"),
});
export type SharedExpenseInput = z.infer<typeof sharedExpenseInputSchema>;
