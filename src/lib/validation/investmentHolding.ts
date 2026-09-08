import { z } from "zod";

export const assetClassSchema = z.enum(["EQUITY", "ETF", "MUTUAL_FUND", "CRYPTO", "BOND", "OTHER"]);

export const investmentHoldingInputSchema = z.object({
  accountId: z.string().min(1, "Choose an account"),
  securityName: z.string().trim().min(1, "Name is required").max(120),
  ticker: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  assetClass: assetClassSchema,
  quantity: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,8})?$/, "Enter a valid quantity, e.g. 12.5 or 0.00341522"),
  costBasis: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  currentValue: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount"),
});
export type InvestmentHoldingInput = z.infer<typeof investmentHoldingInputSchema>;
