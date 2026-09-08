/**
 * Frankfurter (https://frankfurter.dev) tracks European Central Bank
 * reference rates, which cover these ~31 currencies — not the full set
 * Budge supports for display formatting (src/lib/currencies.ts). Currencies
 * outside this list (several West/Central African and Central American
 * ones) simply aren't available for live conversion here; that's stated
 * on the page rather than faked with a made-up rate.
 *
 * No "server-only" here (unlike getExchangeRatesBoard below, which does
 * the actual fetch) — this constant is also read from the client-side
 * base-currency picker (src/components/tools/ForexBoard.tsx).
 */
export const FRANKFURTER_CURRENCIES = new Set([
  "AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP",
  "HKD", "HUF", "IDR", "ILS", "INR", "ISK", "JPY", "KRW", "MXN", "MYR",
  "NOK", "NZD", "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR",
]);

export type ForexRate = { code: string; rate: number };

/** All live rates for `base` against every Frankfurter-supported currency, one request. */
export async function getExchangeRatesBoard(base: string): Promise<{ base: string; date: string; rates: ForexRate[] }> {
  const safeBase = FRANKFURTER_CURRENCIES.has(base) ? base : "USD";

  const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${safeBase}`, {
    next: { revalidate: 3600 }, // exchange rates used for display, not transactions — hourly is plenty fresh
  });
  if (!res.ok) throw new Error(`Frankfurter returned ${res.status}`);
  const data = (await res.json()) as { base: string; date: string; rates: Record<string, number> };

  const rates = Object.entries(data.rates)
    .map(([code, rate]) => ({ code, rate }))
    .sort((a, b) => a.code.localeCompare(b.code));

  return { base: data.base, date: data.date, rates };
}
