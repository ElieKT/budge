import { z } from "zod";

export const onboardingSchema = z.object({
  currency: z.enum(["USD"]).default("USD"),
  monthlyIncomeEstimate: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
