"use server";

import { z } from "zod";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";
import { getExchangeRate, getExchangeRatesBoard, type ForexRate } from "@/lib/forex";

const convertSchema = z.object({
  amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount"),
  from: z.string().length(3),
  to: z.string().length(3),
});

/**
 * Live currency conversion — see src/lib/forex.ts for the provider and why
 * it was chosen (broad coverage, including African currencies, over the
 * ECB-only alternative). No API key or account is required, and this app
 * sends it nothing but the two currency codes (no user data).
 */
export async function convertCurrency(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ result: number; rate: number; date: string }>> {
  const parsed = convertSchema.safeParse({
    amount: formData.get("amount"),
    from: formData.get("from"),
    to: formData.get("to"),
  });
  if (!parsed.success) return zodErrorResult(parsed.error);

  const { amount, from, to } = parsed.data;
  if (from === to) return okResult({ result: Number(amount), rate: 1, date: "" });

  try {
    const { rate, date } = await getExchangeRate(from, to);
    return okResult({ result: Math.round(Number(amount) * rate * 100) / 100, rate, date });
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : "Couldn't reach the exchange rate service.");
  }
}

export async function fetchExchangeRateBoard(
  base: string,
): Promise<ActionResult<{ base: string; date: string; rates: ForexRate[] }>> {
  try {
    const board = await getExchangeRatesBoard(base);
    return okResult(board);
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : "Couldn't reach the exchange rate service.");
  }
}
