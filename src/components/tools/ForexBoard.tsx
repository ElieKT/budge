"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchExchangeRateBoard } from "@/server/actions/tools";
import { FRANKFURTER_CURRENCIES, type ForexRate } from "@/lib/forex";
import { FormBanner } from "@/components/ui/Field";

const BASE_OPTIONS = Array.from(FRANKFURTER_CURRENCIES).sort();

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
      setRates(result.data.rates);
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
            {BASE_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
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
        Live rates from Frankfurter (ECB reference rates). Covers major world currencies — a few of
        the currencies Budge supports for display formatting (e.g. West/Central African francs,
        several Central American currencies) aren&apos;t tracked by this rate source and won&apos;t
        appear here.
      </p>
    </div>
  );
}
