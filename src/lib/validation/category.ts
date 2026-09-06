import { z } from "zod";
import { transactionTypeSchema } from "./transaction";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Keep names under 60 characters"),
  kind: transactionTypeSchema,
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color")
    .default("#6b7280"),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;
