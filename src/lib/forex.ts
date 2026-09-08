/**
 * Live exchange rates via the ExchangeRate-API "open access" endpoint
 * (https://www.exchangerate-api.com/docs/free) — free, keyless, no account
 * needed, refreshed roughly daily. Chosen over Frankfurter/ECB for the
 * currency converter and live-rates board specifically because its
 * coverage (160+ ISO currencies) includes the West/Central African,
 * Central American, and other currencies Budge supports for display
 * (src/lib/currencies.ts) that ECB doesn't track — most notably every
 * African currency in that list, not just South Africa's rand.
 */
const BASE_URL = "https://open.er-api.com/v6/latest";

export type ForexRate = { code: string; rate: number };

type OpenErApiResponse = {
  result: "success" | "error";
  base_code?: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
  ["error-type"]?: string;
};

/** All live rates for `base` against every currency the provider tracks, one request. */
export async function getExchangeRatesBoard(base: string): Promise<{ base: string; date: string; rates: ForexRate[] }> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(base)}`, {
    next: { revalidate: 3600 }, // used for display, not transactions — hourly is plenty fresh, and the source itself only updates ~daily
  });
  if (!res.ok) throw new Error(`Exchange rate service returned ${res.status}`);
  const data = (await res.json()) as OpenErApiResponse;
  if (data.result !== "success" || !data.rates) {
    throw new Error(data["error-type"] || "Exchange rate service returned an unexpected response.");
  }

  const rates = Object.entries(data.rates)
    .map(([code, rate]) => ({ code, rate }))
    .sort((a, b) => a.code.localeCompare(b.code));

  return { base: data.base_code ?? base, date: data.time_last_update_utc ?? "", rates };
}

/** Single from->to rate, derived from the same board call (the provider has no single-pair endpoint). */
export async function getExchangeRate(from: string, to: string): Promise<{ rate: number; date: string }> {
  const board = await getExchangeRatesBoard(from);
  const found = board.rates.find((r) => r.code === to);
  if (!found) throw new Error(`No rate available for ${from} → ${to}.`);
  return { rate: found.rate, date: board.date };
}
