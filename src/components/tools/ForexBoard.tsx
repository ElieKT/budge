"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchExchangeRateBoard } from "@/server/actions/tools";
import type { ForexRate } from "@/lib/forex";
import { CURRENCIES } from "@/lib/currencies";
import { FormBanner } from "@/components/ui/Field";

// The provider tracks 160+ currencies — filter its response down to the
// set Budge actually supports for display elsewhere, so this board stays
// directly relevant instead of dumping every currency in the world.
const SUPPORTED_CODES = new Set(CURRENCIES.map((c) => c.code));

export function ForexBoard() {
  const [base, setBase] = useState("USD");
  const [rates, setRates] = useState<ForexRate[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setError(null);
      const result = await fetchExchangeRateBoard(base);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRates(result.data.rates.filter((r) => SUPPORTED_CODES.has(r.code)));
      setDate(result.data.date);
    });
  }, [base]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Base currency</span>
          <select
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </label>
        {date && <span className="text-xs text-slate-400">as of {date}</span>}
      </div>

      {error && <FormBanner message={error} />}

      {pending && rates.length === 0 ? (
        <p className="text-sm text-slate-400">Loading rates…</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
          {rates.map((r) => (
            <div key={r.code} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{r.code}</span>
              <span className="tabular-nums font-medium text-slate-800 dark:text-slate-100">{r.rate.toFixed(4)}</span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Live rates covering every currency Budge supports — including West/Central African francs
        and other African currencies, not just South Africa&apos;s rand. Rates refresh roughly daily.
      </p>
    </div>
  );
}
