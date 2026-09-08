"use server";

import { z } from "zod";
import { errorResult, okResult, zodErrorResult, type ActionResult } from "@/server/action-result";
import { getExchangeRatesBoard, type ForexRate } from "@/lib/forex";

const convertSchema = z.object({
  amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount"),
  from: z.string().length(3),
  to: z.string().length(3),
});

/**
 * Live currency conversion via Frankfurter (https://frankfurter.dev) — a
 * free, keyless, open-source exchange-rate API backed by European Central
 * Bank reference rates. No API key or account is required, and this app
 * sends it nothing but the two currency codes and an amount (no user data).
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
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return errorResult("Exchange rate service is unavailable right now.");
    const data = (await res.json()) as { rates: Record<string, number>; date: string };
    const rate = data.rates[to];
    if (!rate) return errorResult(`No rate available for ${from} → ${to}.`);
    return okResult({ result: Math.round(Number(amount) * rate * 100) / 100, rate, date: data.date });
  } catch {
    return errorResult("Couldn't reach the exchange rate service. Try again in a moment.");
  }
}

export async function fetchExchangeRateBoard(
  base: string,
): Promise<ActionResult<{ base: string; date: string; rates: ForexRate[] }>> {
  try {
    const board = await getExchangeRatesBoard(base);
    return okResult(board);
  } catch {
    return errorResult("Couldn't reach the exchange rate service. Try again in a moment.");
  }
}
