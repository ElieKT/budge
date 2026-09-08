import { z } from "zod";
import { isSupportedCurrency } from "@/lib/currencies";

export const onboardingSchema = z.object({
  currency: z
    .string()
    .refine(isSupportedCurrency, "Choose a supported currency")
    .default("USD"),
  monthlyIncomeEstimate: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
